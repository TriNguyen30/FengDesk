import { z } from "zod";

/**
 * Form mở cửa hàng (self-service garden owner).
 * Khớp CreateStoreRequest của BE: chỉ name + hotline bắt buộc; owner = người đang đăng nhập.
 */
export const createShopSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Vui lòng nhập tên cửa hàng")
    .max(255, "Tên cửa hàng tối đa 255 ký tự"),
  hotline: z
    .string()
    .trim()
    .min(1, "Vui lòng nhập hotline")
    .max(20, "Hotline tối đa 20 ký tự")
    .regex(/^[0-9\s+().-]{6,}$/, "Hotline không hợp lệ"),
  description: z.string().trim().max(1000, "Mô tả tối đa 1000 ký tự").optional().or(z.literal("")),
  openingHours: z
    .string()
    .trim()
    .max(100, "Giờ mở cửa tối đa 100 ký tự")
    .optional()
    .or(z.literal("")),
});

export type CreateShopFormValues = z.infer<typeof createShopSchema>;
