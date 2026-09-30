import { createStore } from "../support/db";
import { E2E } from "../support/env";
import { expect, readVnd, test } from "../support/fixtures";

interface FeePolicy {
  commissionRate: number;
}

const digits = (v: string) => Number(v.replace(/\D/g, ""));
const commissionOf = (price: number, rate: number) => Math.round(Number((price * rate).toFixed(6)));

/**
 * Ô giá chia đôi: "Đơn giá" (người bán nhận) ⇄ "Giá niêm yết" (khách trả). Nhập bên nào bên kia tự tính, khớp
 * TỪNG ĐỒNG với quy tắc làm tròn của BE (docs/adr/platform-fee-ledger.md) — không phải ước lượng riêng của FE.
 */
test.describe("Người bán xem giá thực nhận khi nhập giá", () => {
  test("SellerPricing_TypingEitherSide_ComputesTheOtherExactly", async ({
    page,
    loginAs,
    request,
  }) => {
    const store = await createStore([{ name: "Mẫu", price: 100_000, stock: 1 }]);
    await loginAs(page, store.owner);

    const policyRes = await request.get(`${E2E.apiBaseUrl}/platform/fee-policy`);
    const policy = ((await policyRes.json()) as { data: FeePolicy }).data;
    expect(policy.commissionRate, "BE phải công bố tỉ lệ phí sàn").toBeGreaterThan(0);

    await page.goto(`/seller/${store.storeId}/products/new`);
    const field = page.getByTestId("seller-pricing-field").first();
    const listed = field.getByTestId("customer-pays");
    const net = field.getByTestId("seller-receives");
    const note = field.getByTestId("pricing-note");
    await expect(net).toBeEnabled();

    // Nhập giá niêm yết. 99 999 × 8% = 7 999.92 → 8 000: bắt được FE nào làm tròn xuống hay cắt phần lẻ.
    for (const price of [150_000, 99_999, 1_234_567]) {
      await listed.fill(String(price));
      const fee = commissionOf(price, policy.commissionRate);

      await expect(listed, "ô tiền có dấu phẩy ngăn nghìn").toHaveValue(
        price.toLocaleString("en-US"),
      );
      expect(await readVnd(field.getByTestId("platform-fee")), `phí sàn cho giá ${price}`).toBe(
        fee,
      );
      expect(digits(await net.inputValue()), `đơn giá cho giá ${price}`).toBe(price - fee);
    }
    await expect(note.filter({ hasText: "Giá niêm yết là" })).toBeVisible();
    const direction = field.getByTestId("pricing-direction");
    await expect(direction, "nhập giá niêm yết ⇒ kim chỉ sang đơn giá").toHaveAttribute("data-direction", "right");
    await expect(direction).toContainText("bạn nhận được");

    // Nhập đơn giá muốn nhận → giá niêm yết nhỏ nhất cho đúng số đó.
    await net.fill("184000");
    // Ghi chú cũ còn trong lúc chạy hiệu ứng rời đi — lọc theo nội dung thay vì đòi đúng một phần tử.
    await expect(note.filter({ hasText: "Đơn giá là" })).toBeVisible();
    await expect(direction, "nhập đơn giá ⇒ kim quay về giá niêm yết").toHaveAttribute("data-direction", "left");
    await expect(direction).toContainText("khách sẽ trả");
    const derived = digits(await listed.inputValue());
    expect(derived - commissionOf(derived, policy.commissionRate)).toBe(184_000);
    expect(
      derived - 1 - commissionOf(derived - 1, policy.commissionRate),
      "giá niêm yết phải là số nhỏ nhất đủ đơn giá",
    ).toBeLessThan(184_000);

    // Không có số 0 thừa đầu và không nhận chữ.
    await listed.fill("0012a000");
    await expect(listed).toHaveValue("12,000");
  });

  test("SellerPricing_VietnameseImeComposition_KeepsTypedDigits", async ({ page, loginAs }) => {
    // Bộ gõ Telex/VNI dạng composition (có sẵn trong Windows/macOS) soạn cả "từ" rồi mới chốt. Ô tiền từng chèn
    // dấu phẩy giữa lúc đang soạn ⇒ gõ 12000 ra 11200 / 12,001,200,012,000.
    const store = await createStore([{ name: "Mẫu", price: 100_000, stock: 1 }]);
    await loginAs(page, store.owner);
    await page.goto(`/seller/${store.storeId}/products/new`);
    const listed = page.getByTestId("seller-pricing-field").getByTestId("customer-pays");
    await listed.click();
    const cdp = await page.context().newCDPSession(page);

    let text = "";
    for (const ch of "12000") {
      text += ch;
      await cdp.send("Input.imeSetComposition", {
        text,
        selectionStart: text.length,
        selectionEnd: text.length,
      });
    }
    await cdp.send("Input.insertText", { text });

    await expect(listed).toHaveValue("12,000");
    await expect(page.getByTestId("sku-input"), "SKU sàn điền sẵn").toHaveValue(/^FD-[0-9A-Z]{8}$/);
  });
});
