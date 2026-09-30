import { expect } from "@playwright/test";
import type { RevenueBucket } from "./api";
import { db } from "./db";

/**
 * "Nguồn sự thật" độc lập để đối soát: tính lại từ BẢNG GỐC theo định nghĩa trong tài liệu
 * (FengDeskAI/docs/api-documents/15-stores.md, 09-orders.md, 11-returns.md) — cố ý KHÔNG đọc lại
 * code C#. BE tính sai thì hai phía lệch nhau và test đỏ; chép logic C# sang đây thì sai cũng khớp.
 */

const RUNNING = ["Pending", "Confirmed", "Preparing", "Shipped"];
const notDeleted = (alias: string) => `coalesce(${alias}.is_deleted, false) = false`;

/** Làm tròn phí sàn đúng như tài liệu: tới đồng, nửa đồng làm tròn lên. */
const commissionOf = (amount: number, rate: number) =>
  Math.round(Number((amount * rate).toFixed(6)));

// ───────────────────────── Đơn hàng ─────────────────────────

/**
 * Bất biến tiền của MỘT đơn — đúng với mọi đơn, bất kể trạng thái:
 * - subtotal = Σ đơn giá × số lượng của các dòng hàng
 * - totalAmount = subtotal + totalShippingFee − shippingDiscount (voucher)
 * - mỗi delivery: subtotal = Σ dòng hàng thuộc nó
 * - đơn đã có delivery (COD, hoặc PayOS đã trả): Σ phí ship / Σ khoản giảm của delivery = số của đơn
 * - voucher sàn tài trợ: khoản giảm mỗi delivery ≤ phí ship của nó VÀ ≤ phí sàn của nó (docs/adr/voucher-freeship.md)
 */
export async function assertOrderMoneyInvariants(orderId: string) {
  const { rows: orders } = await db().query<{
    subtotal: number;
    total_shipping_fee: number;
    shipping_discount: number;
    total_amount: number;
    items_value: number;
  }>(
    `select o.subtotal, o.total_shipping_fee, o.shipping_discount, o.total_amount,
            (select coalesce(sum(i.unit_price * i.quantity), 0) from order_items i
              where i.order_id = o.id and ${notDeleted("i")}) as items_value
       from orders o where o.id = $1`,
    [orderId],
  );
  const order = orders[0];
  expect(order, `đơn ${orderId} phải tồn tại trong DB`).toBeTruthy();
  expect(order.subtotal, "orders.subtotal = Σ order_items").toBe(order.items_value);
  expect(
    order.total_amount,
    "orders.total_amount = subtotal + total_shipping_fee − shipping_discount",
  ).toBe(order.subtotal + order.total_shipping_fee - order.shipping_discount);

  const { rows: deliveries } = await db().query<{
    id: string;
    subtotal: number;
    shipping_fee: number;
    shipping_discount: number;
    commission_rate: number;
    items_value: number;
  }>(
    `select d.id, d.subtotal, d.shipping_fee, d.shipping_discount, d.commission_rate,
            (select coalesce(sum(i.unit_price * i.quantity), 0) from order_items i
              where i.delivery_id = d.id and ${notDeleted("i")}) as items_value
       from deliveries d
      where d.order_id = $1 and ${notDeleted("d")} and coalesce(d.is_exchange, false) = false`,
    [orderId],
  );
  for (const d of deliveries) {
    expect(d.subtotal, `deliveries.subtotal = Σ order_items của delivery ${d.id}`).toBe(
      d.items_value,
    );
  }
  for (const d of deliveries) {
    expect(d.shipping_discount, `giảm ship ≤ phí ship (delivery ${d.id})`).toBeLessThanOrEqual(
      d.shipping_fee,
    );
    expect(d.shipping_discount, `giảm ship ≤ phí sàn (delivery ${d.id})`).toBeLessThanOrEqual(
      commissionOf(d.subtotal, d.commission_rate),
    );
  }
  if (deliveries.length > 0) {
    const fee = deliveries.reduce((s, d) => s + d.shipping_fee, 0);
    expect(fee, "Σ deliveries.shipping_fee = orders.total_shipping_fee").toBe(
      order.total_shipping_fee,
    );
    const discount = deliveries.reduce((s, d) => s + d.shipping_discount, 0);
    expect(discount, "Σ deliveries.shipping_discount = orders.shipping_discount").toBe(
      order.shipping_discount,
    );
  }
  return { ...order, deliveries };
}

// ───────────────────────── Thống kê cửa hàng ─────────────────────────

export interface ExpectedStoreStats {
  totalRevenue: number;
  totalShippingFee: number;
  totalDeliveries: number;
  deliveriesByStatus: Record<string, number>;
  activeDeliveries: number;
  activeDeliveriesValue: number;
  awaitingPaymentOrders: number;
  awaitingPaymentValue: number;
  outstandingLiabilityValue: number;
  refundedTotal: number;
  refundedItemsValue: number;
  productCount: number;
  staffCount: number;
  /** Doanh thu theo sản phẩm của các delivery đã giao — dùng đối chiếu dòng "Completed". */
  completedValueByProduct: Record<string, number>;
}

export async function expectedStoreStats(storeId: string): Promise<ExpectedStoreStats> {
  const q = db();

  const { rows: deliveries } = await q.query<{
    status: string;
    payment_method: string;
    subtotal: number;
    shipping_fee: number;
  }>(
    `select d.status, o.payment_method, d.subtotal, d.shipping_fee
       from deliveries d join orders o on o.id = d.order_id
      where d.garden_store_id = $1 and ${notDeleted("d")}`,
    [storeId],
  );

  const delivered = deliveries.filter((d) => d.status === "Delivered");
  const running = deliveries.filter((d) => RUNNING.includes(d.status));
  const runningCod = running.filter((d) => d.payment_method === "COD");
  const sum = (xs: Array<{ subtotal: number }>) => xs.reduce((s, x) => s + x.subtotal, 0);

  const deliveriesByStatus: Record<string, number> = {};
  for (const d of deliveries)
    deliveriesByStatus[d.status] = (deliveriesByStatus[d.status] ?? 0) + 1;

  // Đơn online khách đặt nhưng CHƯA trả: order Pending + PayOS, chưa có delivery, có hàng của vườn này.
  const { rows: awaiting } = await q.query<{ orders: number; value: number }>(
    `select count(distinct i.order_id) as orders, coalesce(sum(i.unit_price * i.quantity), 0) as value
       from order_items i
       join orders o on o.id = i.order_id
       join product_items pi on pi.id = i.product_item_id
       join products p on p.id = pi.product_id
      where o.status = 'Pending' and o.payment_method = 'PayOS' and i.delivery_id is null
        and p.garden_store_id = $1 and ${notDeleted("i")}`,
    [storeId],
  );

  const { rows: refunds } = await q.query<{ total: number }>(
    `select coalesce(sum(r.amount), 0) as total
       from refunds r
       join return_requests rr on rr.id = r.return_request_id
       join deliveries d on d.id = rr.delivery_id
      where r.status = 'Completed' and d.garden_store_id = $1 and ${notDeleted("r")}`,
    [storeId],
  );

  const { rows: refundedItems } = await q.query<{ value: number }>(
    `select coalesce(sum(ri.unit_price * ri.quantity), 0) as value
       from return_items ri
       join return_requests rr on rr.id = ri.return_request_id
       join deliveries d on d.id = rr.delivery_id
       join refunds r on r.return_request_id = rr.id
      where r.status = 'Completed' and d.garden_store_id = $1 and ${notDeleted("ri")}`,
    [storeId],
  );

  const { rows: liability } = await q.query<{ total: number }>(
    `select coalesce(sum(amount), 0) as total from vendor_liabilities
      where garden_id = $1 and status <> 'Waived' and coalesce(is_deleted, false) = false`,
    [storeId],
  );

  const { rows: counts } = await q.query<{ products: number; staff: number }>(
    `select (select count(*) from products p where p.garden_store_id = $1 and ${notDeleted("p")}) as products,
            (select count(*) from garden_staff_assignments a
              where a.garden_store_id = $1 and a.status = 'Accepted' and ${notDeleted("a")}) as staff`,
    [storeId],
  );

  const { rows: completedByProduct } = await q.query<{ product_id: string; value: number }>(
    `select pi.product_id, sum(i.unit_price * i.quantity) as value
       from order_items i
       join deliveries d on d.id = i.delivery_id
       join product_items pi on pi.id = i.product_item_id
      where d.garden_store_id = $1 and d.status = 'Delivered' and ${notDeleted("i")}
      group by pi.product_id`,
    [storeId],
  );

  return {
    totalRevenue: sum(delivered),
    totalShippingFee: delivered.reduce((s, d) => s + d.shipping_fee, 0),
    totalDeliveries: deliveries.length,
    deliveriesByStatus,
    activeDeliveries: running.length,
    activeDeliveriesValue: sum(running),
    awaitingPaymentOrders: awaiting[0].orders,
    // Theo tài liệu: tiền chưa thu = đơn PayOS chưa trả + delivery COD đang trên đường.
    awaitingPaymentValue: awaiting[0].value + sum(runningCod),
    outstandingLiabilityValue: liability[0].total,
    refundedTotal: refunds[0].total,
    refundedItemsValue: refundedItems[0].value,
    productCount: counts[0].products,
    staffCount: counts[0].staff,
    completedValueByProduct: Object.fromEntries(
      completedByProduct.map((r) => [r.product_id, r.value]),
    ),
  };
}

/** Cộng một lớp của biểu đồ qua mọi cột. */
export const sumBuckets = (
  buckets: RevenueBucket[],
  key: "completed" | "awaitingPayment" | "inProgress" | "refunded" | "completedCount",
) => buckets.reduce((s, b) => s + b[key], 0);

// ───────────────────────── Phí sàn & sổ cái ─────────────────────────

/**
 * "Thực nhận" của vườn tính lại từ BẢNG NGHIỆP VỤ theo docs/adr/platform-fee-ledger.md — không đọc sổ cái:
 *   Σ delivery đã giao (tiền hàng − phí sàn theo tỉ lệ chốt của delivery)
 * − Σ công nợ chưa miễn (số tiền − phần phí sàn được trả lại, theo tỉ lệ của delivery bị hoàn).
 * Sổ cái mà ghi sai (thiếu/thừa/nhân đôi bút toán) thì hai phía lệch.
 */
export async function expectedSellerEarnings(storeId: string) {
  const { rows: delivered } = await db().query<{ subtotal: number; commission_rate: number }>(
    `select subtotal, commission_rate from deliveries
      where garden_store_id = $1 and status = 'Delivered' and coalesce(is_exchange, false) = false
        and ${notDeleted("deliveries")}`,
    [storeId],
  );
  const { rows: liabilities } = await db().query<{ amount: number; commission_rate: number }>(
    `select l.amount, d.commission_rate
       from vendor_liabilities l
       join return_requests rr on rr.id = l.ticket_id
       join deliveries d on d.id = rr.delivery_id
      where l.garden_id = $1 and l.status <> 'Waived' and ${notDeleted("l")}`,
    [storeId],
  );

  const grossCommission = delivered.reduce(
    (s, d) => s + commissionOf(d.subtotal, d.commission_rate),
    0,
  );
  const returnedCommission = liabilities.reduce(
    (s, l) => s + commissionOf(l.amount, l.commission_rate),
    0,
  );
  const goods = delivered.reduce((s, d) => s + d.subtotal, 0);
  const liability = liabilities.reduce((s, l) => s + l.amount, 0);

  return {
    platformCommission: grossCommission - returnedCommission,
    ledgerBalance: goods - grossCommission - liability + returnedCommission,
  };
}

/**
 * Bảo toàn tiền của MỘT đơn qua sổ cái: Σ mọi bút toán (sổ vườn + sổ sàn) = tiền khách trả − tiền nhà vận
 * chuyển lấy − tiền đã hoàn cho khách. Sổ không được tự sinh hay làm mất đồng nào.
 */
export async function assertLedgerConservesMoney(orderId: string) {
  const { rows } = await db().query<{
    ledger: number;
    paid: number;
    carrier: number;
    refunded: number;
  }>(
    `with d as (select * from deliveries where order_id = $1 and status = 'Delivered'
                  and coalesce(is_exchange, false) = false),
          r as (select r.* from refunds r join return_requests rr on rr.id = r.return_request_id
                 where rr.order_id = $1 and r.status = 'Completed'),
          l as (select l.* from vendor_liabilities l join r on r.id = l.refund_id)
     select
       (select coalesce(sum(amount), 0) from ledger_entries
         where delivery_id in (select id from d) or refund_id in (select id from r)
            or vendor_liability_id in (select id from l)) as ledger,
       (select coalesce(sum(subtotal + shipping_fee - shipping_discount), 0) from d) as paid,
       (select coalesce(sum(carrier_shipping_fee), 0) from d) as carrier,
       (select coalesce(sum(amount), 0) from r) as refunded`,
    [orderId],
  );
  const { ledger, paid, carrier, refunded } = rows[0];
  expect(
    ledger,
    `Σ sổ cái của đơn ${orderId} = khách trả ${paid} − vận chuyển ${carrier} − hoàn ${refunded}`,
  ).toBe(paid - carrier - refunded);
}
