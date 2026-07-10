// BE lưu diện tích mặt bàn nguyên (cm²); UI luôn nhập/hiển thị bằng m² cho dễ hình dung.
const CM2_PER_M2 = 10000;

export const toCm2 = (m2: number): number => Math.round(m2 * CM2_PER_M2);
export const fromCm2 = (cm2: number): number => cm2 / CM2_PER_M2;
