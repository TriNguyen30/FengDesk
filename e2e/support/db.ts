import { randomBytes, randomUUID } from "node:crypto";
import bcrypt from "bcryptjs";
import pg from "pg";
import { assertSafeDatabase, E2E } from "./env";

/**
 * Truy cập thẳng Postgres của E2E — hai việc:
 * 1. Dựng DỮ LIỆU NỀN (user, cửa hàng, sản phẩm, địa chỉ). Dựng qua API nghĩa là mỗi test bán hàng
 *    kiêm luôn test đăng ký OTP + tạo cửa hàng + duyệt — chậm và gãy dây chuyền. Luồng đang được
 *    kiểm (giỏ → đặt → giao → hoàn) thì LUÔN đi qua UI/API thật.
 * 2. Làm "nguồn sự thật" độc lập khi đối soát số liệu API/UI (xem reconcile.ts).
 */

// numeric → string mặc định (tránh mất chính xác); tiền VND trong hệ thống không có phần lẻ nên an toàn đổi sang number.
pg.types.setTypeParser(pg.types.builtins.NUMERIC, (v) => Number(v));
pg.types.setTypeParser(pg.types.builtins.INT8, (v) => Number(v));

let pool: pg.Pool | undefined;

export function db(): pg.Pool {
  if (!pool) {
    assertSafeDatabase();
    pool = new pg.Pool({ connectionString: E2E.databaseUrl, max: 4 });
  }
  return pool;
}

export async function closeDb(): Promise<void> {
  await pool?.end();
  pool = undefined;
}

/** Bit-flag khớp `FengDeskAI.Domain.Enums.UserRole`. */
export const Role = {
  Customer: 1,
  Manager: 2,
  Staff: 4,
  Admin: 8,
  GardenOwner: 16,
} as const;

/** Số di động hợp lệ với nhà vận chuyển — hotline 1900 hay số cố định bị BE từ chối. */
const CARRIER_VALID_PHONE = "0901234567";

export interface SeededUser {
  id: string;
  email: string;
  password: string;
  fullName: string;
}

export interface SeededProduct {
  productId: string;
  productItemId: string;
  name: string;
  price: number;
  stock: number;
}

export interface SeededStore {
  storeId: string;
  name: string;
  owner: SeededUser;
  products: SeededProduct[];
}

const tag = () => randomBytes(4).toString("hex");

/** Mỗi lần chạy một mật khẩu mới — không có secret nào nằm trong mã nguồn. */
const newPassword = () => `E2e!${randomBytes(9).toString("base64url")}`;

export async function createUser(role: number, label: string): Promise<SeededUser> {
  const id = randomUUID();
  const password = newPassword();
  const email = `e2e-${label}-${tag()}@e2e.test`;
  const fullName = `E2E ${label}`;
  // Cost thấp cho nhanh — BCrypt.Verify của BE đọc cost từ chính chuỗi hash nên vẫn đúng.
  const hash = await bcrypt.hash(password, 4);

  await db().query(
    `insert into users (id, email, password_hash, full_name, gender, role, balance, is_active, token_version,
                        auth_provider, created_at, updated_at, is_deleted)
     values ($1, $2, $3, $4, 0, $5, 0, true, 0, 0, now(), now(), false)`,
    [id, email, hash, fullName, role],
  );
  return { id, email, password, fullName };
}

/**
 * Một phường/xã có đủ mã GHN. GeographySeeder KHÔNG điền mã GHN (chỉ có khi chạy sync-geo với mạng
 * ngoài) mà thiếu mã thì BE chặn đặt hàng với lỗi "chưa có mã vùng nhà vận chuyển" — nên tự điền.
 * Cửa hàng và khách dùng CÙNG phường ⇒ nội tỉnh ⇒ phí ship cố định theo ShippingFeeCalculator.
 */
export async function ensureShippableWard(): Promise<string> {
  const { rows } = await db().query<{ id: string; district_id: string }>(
    `select id, district_id from wards where coalesce(is_deleted, false) = false order by name limit 1`,
  );
  if (!rows[0])
    throw new Error(
      "DB E2E chưa có phường/xã — seeder của BE chưa chạy (xem webServer trong playwright.config).",
    );
  await db().query(
    `update wards set ghn_ward_code = coalesce(ghn_ward_code, '20308') where id = $1`,
    [rows[0].id],
  );
  await db().query(
    `update districts set ghn_district_id = coalesce(ghn_district_id, 1442) where id = $1`,
    [rows[0].district_id],
  );
  return rows[0].id;
}

export async function createStore(
  products: Array<{ name: string; price: number; stock: number }>,
): Promise<SeededStore> {
  const wardId = await ensureShippableWard();
  const owner = await createUser(Role.Customer | Role.GardenOwner, "owner");
  const storeId = randomUUID();
  const name = `Vườn E2E ${tag()}`;
  const client = await db().connect();
  try {
    await client.query("begin");
    await client.query(
      `insert into garden_stores (id, name, description, hotline, opening_hours, is_active, created_at, updated_at, is_deleted)
       values ($1, $2, 'Cửa hàng dựng cho E2E.', $3, '08:00 - 21:00', true, now(), now(), false)`,
      [storeId, name, CARRIER_VALID_PHONE],
    );
    await client.query(
      `insert into garden_store_owners (id, garden_store_id, owner_user_id, is_primary, assigned_at, created_at, updated_at, is_deleted)
       values ($1, $2, $3, true, now(), now(), now(), false)`,
      [randomUUID(), storeId, owner.id],
    );
    await client.query(
      `insert into stores_address (id, store_id, ward_id, street_address, is_active, sender_name, sender_phone, created_at, updated_at, is_deleted)
       values ($1, $2, $3, '1 Đường Kiểm Thử', true, $4, $5, now(), now(), false)`,
      [randomUUID(), storeId, wardId, name, CARRIER_VALID_PHONE],
    );

    const seeded: SeededProduct[] = [];
    for (const p of products) {
      const productId = randomUUID();
      const productItemId = randomUUID();
      const productName = `${p.name} ${tag()}`;
      await client.query(
        `insert into products (id, garden_store_id, name, description, is_active, created_at, updated_at, is_deleted)
         values ($1, $2, $3, 'Sản phẩm dựng cho E2E.', true, now(), now(), false)`,
        [productId, storeId, productName],
      );
      await client.query(
        `insert into product_items (id, product_id, name, price, stock, sku, weight_gram, created_at, updated_at, is_deleted)
         values ($1, $2, 'Tiêu chuẩn', $3, $4, $5, 500, now(), now(), false)`,
        [productItemId, productId, p.price, p.stock, `E2E-${tag()}`],
      );
      seeded.push({ productId, productItemId, name: productName, price: p.price, stock: p.stock });
    }
    await client.query("commit");
    return { storeId, name, owner, products: seeded };
  } catch (error) {
    await client.query("rollback");
    throw error;
  } finally {
    client.release();
  }
}

export interface SeededCustomer extends SeededUser {
  addressId: string;
}

export async function createCustomer(): Promise<SeededCustomer> {
  const wardId = await ensureShippableWard();
  const user = await createUser(Role.Customer, "customer");
  const addressId = randomUUID();
  await db().query(
    `insert into user_address (id, user_id, ward_id, street_address, recipient_name, recipient_phone, is_default, label,
                               created_at, updated_at, is_deleted)
     values ($1, $2, $3, '88 Đường Người Nhận', $4, $5, true, 'Nhà', now(), now(), false)`,
    [addressId, user.id, wardId, user.fullName, CARRIER_VALID_PHONE],
  );
  return { ...user, addressId };
}

export async function stockOf(productItemId: string): Promise<number> {
  const { rows } = await db().query<{ stock: number }>(
    `select stock from product_items where id = $1`,
    [productItemId],
  );
  return rows[0].stock;
}
