/** 12000000 → "12,000,000" — dạng số tiền trong ô nhập và phần giải thích giá. */
export const formatMoneyInput = (value: number) => Math.trunc(value).toLocaleString("en-US");
