import { z } from "zod";

const emailField = z.string().trim().min(1, "Vui lòng nhập email").email("Email không hợp lệ");

const passwordField = z
  .string()
  .min(1, "Vui lòng nhập mật khẩu")
  .min(8, "Mật khẩu tối thiểu 8 ký tự")
  .regex(/[A-Z]/, "Mật khẩu cần ít nhất 1 chữ hoa")
  .regex(/[a-z]/, "Mật khẩu cần ít nhất 1 chữ thường")
  .regex(/[0-9]/, "Mật khẩu cần ít nhất 1 chữ số");

const vietnamesePhoneField = z
  .string()
  .trim()
  .min(1, "Vui lòng nhập số điện thoại")
  .regex(/^0(3|5|7|8|9)\d{8}$/, "Số điện thoại không hợp lệ (10 số, bắt đầu bằng 0)");

export const loginEmailSchema = z.object({
  email: emailField,
  password: z.string().min(1, "Vui lòng nhập mật khẩu").min(6, "Mật khẩu tối thiểu 6 ký tự"),
  remember: z.boolean().optional(),
});

export type LoginEmailFormValues = z.infer<typeof loginEmailSchema>;

export const signUpInitiateSchema = z.object({
  email: emailField,
});

export type SignUpInitiateFormValues = z.infer<typeof signUpInitiateSchema>;

export const signUpVerifySchema = z.object({
  otp: z
    .string()
    .length(6, "Mã OTP phải có đủ 6 chữ số")
    .regex(/^\d{6}$/, "Mã OTP chỉ được chứa số"),
});

export type SignUpVerifyFormValues = z.infer<typeof signUpVerifySchema>;

export const signUpFinalizeSchema = z
  .object({
    fullName: z
      .string()
      .trim()
      .min(1, "Vui lòng nhập họ tên")
      .min(2, "Họ tên tối thiểu 2 ký tự")
      .max(100, "Họ tên tối đa 100 ký tự"),
    phone: vietnamesePhoneField,
    dateOfBirth: z.string().min(1, "Vui lòng chọn ngày sinh"),
    gender: z.union([z.string(), z.number()]).transform((v) => Number(v)),
    password: passwordField,
    confirmPassword: z.string().min(1, "Vui lòng xác nhận mật khẩu"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Mật khẩu xác nhận không khớp",
    path: ["confirmPassword"],
  });

export type SignUpFinalizeFormValues = z.infer<typeof signUpFinalizeSchema>;
