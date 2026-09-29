import { expect, request, type APIRequestContext, type APIResponse } from "@playwright/test";
import { recordApiCall } from "./coverage";
import { E2E } from "./env";
import type { SeededUser } from "./db";

/** Phong bì phản hồi chung của BE (`ApiResponse<T>`). */
export interface Envelope<T> {
  data: T;
  isSuccess: boolean;
  message: string;
  statusCode: number;
}

export interface LoginData {
  accessToken: string;
  refreshToken: string;
  user: { id: string; email: string; role?: string; roles?: string[] };
}

export interface OrderDetail {
  id: string;
  status: string;
  paymentMethod: string;
  subtotal: number;
  totalShippingFee: number;
  shippingDiscount?: number;
  voucherCode?: string | null;
  totalAmount: number;
  items: Array<{ id: string; productItemId: string; unitPrice: number; quantity: number }>;
  deliveries: Array<{ id: string; status: string; subtotal: number; shippingFee: number }>;
}

export interface ReturnDetail {
  id: string;
  status: string;
  refundAmount: number;
  refund: { id: string; amount: number; status: string } | null;
}

/**
 * Client API mang token của MỘT user. Dùng cho các bước không phải trọng tâm của test (vendor đẩy
 * trạng thái giao, staff duyệt RMA…) — bước đang kiểm thì đi qua UI.
 */
export class ApiClient {
  private constructor(
    private readonly ctx: APIRequestContext,
    readonly session: LoginData,
  ) {}

  static async login(user: SeededUser): Promise<ApiClient> {
    const anon = await request.newContext({ baseURL: `${E2E.apiBaseUrl}/` });
    recordApiCall("POST", `${E2E.apiBaseUrl}/Auth/login`);
    const res = await anon.post("Auth/login", {
      data: { email: user.email, password: user.password },
    });
    const body = await readEnvelope<LoginData>(res, `đăng nhập ${user.email}`);
    await anon.dispose();

    const ctx = await request.newContext({
      baseURL: `${E2E.apiBaseUrl}/`,
      extraHTTPHeaders: { Authorization: `Bearer ${body.accessToken}` },
    });
    return new ApiClient(ctx, body);
  }

  async dispose() {
    await this.ctx.dispose();
  }

  get<T>(path: string, step = `GET ${path}`) {
    return this.send("GET", path, undefined).then((r) => readEnvelope<T>(r, step));
  }

  post<T>(path: string, data?: unknown, step = `POST ${path}`) {
    return this.send("POST", path, data ?? {}).then((r) => readEnvelope<T>(r, step));
  }

  patch<T>(path: string, data: unknown, step = `PATCH ${path}`) {
    return this.send("PATCH", path, data).then((r) => readEnvelope<T>(r, step));
  }

  /** POST thô, không bóc phong bì — dùng khi test cần kiểm chính mã lỗi. */
  rawPost(path: string, data: unknown) {
    return this.send("POST", path, data);
  }

  private send(method: "GET" | "POST" | "PATCH", path: string, data: unknown) {
    const relative = stripSlash(path);
    recordApiCall(method, `${E2E.apiBaseUrl}/${relative}`);
    return this.ctx.fetch(relative, { method, data });
  }

  // ───────────── Nghiệp vụ hay dùng ─────────────

  async addToCart(productItemId: string, quantity: number) {
    return this.post("cart/items", { productItemId, quantity }, "thêm vào giỏ");
  }

  async checkout(input: {
    shippingAddressId: string;
    items: Array<{ productItemId: string; quantity: number }>;
    paymentMethod: "COD" | "PayOS";
  }) {
    return this.post<OrderDetail>("orders", input, `đặt hàng ${input.paymentMethod}`);
  }

  getOrder(orderId: string) {
    return this.get<OrderDetail>(`orders/${orderId}`, "đọc đơn");
  }

  /** Vendor đi đúng chuỗi trạng thái hợp lệ — cũng là đường thật chủ vườn thao tác. */
  async advanceDelivery(
    deliveryId: string,
    to: "Confirmed" | "Preparing" | "Shipped" | "Delivered",
  ) {
    const chain = ["Confirmed", "Preparing", "Shipped", "Delivered"] as const;
    for (const status of chain.slice(0, chain.indexOf(to) + 1)) {
      await this.patch(
        `orders/deliveries/${deliveryId}/status`,
        { status },
        `delivery → ${status}`,
      );
    }
  }

  createReturn(input: {
    deliveryId: string;
    items: Array<{ orderItemId: string; quantity: number }>;
    reason?: string;
  }) {
    return this.post<ReturnDetail>(
      "returns",
      {
        deliveryId: input.deliveryId,
        type: "Refund",
        reason: input.reason ?? "PlantHealth",
        reasonDetail: "Cây đến nơi đã héo (E2E).",
        items: input.items,
        imageUrls: ["https://e2e-storage.invalid/evidence/seed.png"],
        bankAccountName: "KHACH E2E",
        bankAccountNumber: "0123456789",
        bankName: "Ngân hàng E2E",
      },
      "tạo yêu cầu trả hàng",
    );
  }

  getReturn(id: string) {
    return this.get<ReturnDetail>(`returns/${id}`, "đọc yêu cầu trả hàng");
  }

  /** Staff: tiếp nhận → duyệt hoàn tiền. PlantHealth đi thẳng Reviewing (không thu hồi hàng). */
  async acceptAndApproveRefund(returnId: string) {
    await this.post(`returns/${returnId}/accept`, undefined, "staff tiếp nhận RMA");
    await this.post(
      `returns/${returnId}/approve-refund`,
      { restock: false, note: "Duyệt hoàn tiền (E2E)." },
      "duyệt hoàn tiền",
    );
    const detail = await this.getReturn(returnId);
    expect(detail.refund, "duyệt hoàn tiền phải sinh lệnh hoàn tiền").not.toBeNull();
    return detail.refund!;
  }

  /** Giả lập cổng báo hoàn tiền thành công — endpoint chỉ mở ở Development. */
  completeRefund(refundId: string) {
    return this.post(`dev/refunds/${refundId}/success`, undefined, "giả lập hoàn tiền thành công");
  }

  storeStatistics(storeId: string, range?: string) {
    return this.get<StoreStatistics>(
      `stores/${storeId}/statistics${range ? `?range=${range}` : ""}`,
      "thống kê cửa hàng",
    );
  }
}

export interface RevenueBucket {
  start: string;
  revenue: number;
  deliveredCount: number;
  awaitingPayment: number;
  awaitingPaymentCount: number;
  inProgress: number;
  inProgressCount: number;
  completed: number;
  completedCount: number;
  refunded: number;
  refundedCount: number;
}

export interface StoreStatistics {
  totalRevenue: number;
  totalShippingFee: number;
  totalDeliveries: number;
  deliveriesByStatus: Record<string, number>;
  activeDeliveries: number;
  activeDeliveriesValue: number;
  awaitingPaymentOrders: number;
  awaitingPaymentValue: number;
  itemsByStatus: Array<{
    productId: string;
    productName: string;
    status: string;
    quantity: number;
    value: number;
    orderCount: number;
    shippingFee: number;
  }>;
  shippingFeeByStatus: Record<string, number>;
  payoutHoldDays: number;
  availableForPayoutValue: number;
  pendingClearanceValue: number;
  outstandingLiabilityValue: number;
  commissionRate: number;
  platformCommission: number;
  ledgerBalance: number;
  ledgerAvailable: number;
  ledgerPending: number;
  productCount: number;
  staffCount: number;
  range: string;
  revenueSeries: RevenueBucket[];
  revenueSeriesByRange: Record<"week" | "month" | "quarter" | "year", RevenueBucket[]>;
}

async function readEnvelope<T>(res: APIResponse, step: string): Promise<T> {
  const text = await res.text();
  if (!res.ok()) throw new Error(`Bước "${step}" thất bại: ${res.status()} ${text}`);
  const body = JSON.parse(text) as Envelope<T>;
  if (!body.isSuccess) throw new Error(`Bước "${step}" trả isSuccess=false: ${text}`);
  return body.data;
}

const stripSlash = (p: string) => p.replace(/^\//, "");
