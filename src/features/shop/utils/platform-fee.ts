/**
 * Phí sàn cho một khoản tiền hàng — CÙNG quy tắc với BE (`PlatformFeePolicy.ComputeCommission`): làm tròn tới
 * đồng, nửa đồng làm tròn lên. `toFixed(6)` gột sai số dấu phẩy động (vd 25 × 0.1 = 2.5000000000000004) để
 * `Math.round` làm tròn đúng số mà BE (decimal) nhìn thấy.
 */
export function computeCommission(price: number, rate: number): number {
  if (!Number.isFinite(price) || price <= 0) return 0;
  return Math.round(Number((price * rate).toFixed(6)));
}

/** Người bán thực nhận cho một khoản tiền hàng. */
export function computeSellerNet(price: number, rate: number): number {
  return Math.max(0, price - computeCommission(price, rate));
}

/**
 * Giá niêm yết nhỏ nhất để người bán nhận ĐÚNG `net` (hoặc sát trên nhất khi làm tròn phí khiến không có giá
 * nào cho đúng số đó). Dùng khi người bán nhập "đơn giá" muốn nhận thay vì giá khách trả.
 */
export function computeListedPriceForNet(net: number, rate: number): number {
  if (!Number.isFinite(net) || net <= 0) return 0;
  if (rate <= 0) return net;
  const estimate = Math.ceil(net / (1 - rate));
  for (let price = Math.max(1, estimate - 3); price <= estimate + 3; price++) {
    if (computeSellerNet(price, rate) >= net) return price;
  }
  return estimate;
}
