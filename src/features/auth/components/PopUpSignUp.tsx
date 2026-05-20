import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ChevronRight, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import Modal from "@/components/ui/Modal";
import { registerRequest } from "@/features/auth/api/authApi";
import AuthField, { inputClassName } from "@/features/auth/components/AuthField";
import SocialAuthButtons from "@/features/auth/components/SocialAuthButtons";
import { useAuthSession } from "@/features/auth/hooks/useAuthSession";
import {
  signUpSchema,
  type SignUpFormValues,
} from "@/features/auth/schemas/auth-schema";
import { getAuthErrorMessage } from "@/features/auth/utils/getAuthErrorMessage";

export interface PopUpSignUpProps {
  open: boolean;
  onClose: () => void;
  onSwitchToLogin?: () => void;
}

const submitButtonClass =
  "mt-1 flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-primary py-2.5 text-sm font-semibold text-white transition hover:bg-primary-dark active:bg-green-800 disabled:cursor-not-allowed disabled:opacity-60 cursor-pointer";

export default function PopUpSignUp({
  open,
  onClose,
  onSwitchToLogin,
}: PopUpSignUpProps) {
  const { persistSession } = useAuthSession();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<SignUpFormValues>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      fullName: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  const handleClose = () => {
    reset();
    setShowPassword(false);
    setShowConfirmPassword(false);
    onClose();
  };

  const onSubmit = async (values: SignUpFormValues) => {
    try {
      const response = await registerRequest({
        fullName: values.fullName,
        email: values.email,
        password: values.password,
      });

      if (!response.isSuccess || !response.data) {
        toast.error(response.message || "Đăng ký thất bại");
        return;
      }

      persistSession(response.data);
      toast.success(response.message || "Đăng ký thành công");
      handleClose();
    } catch (error) {
      toast.error(getAuthErrorMessage(error, "Đăng ký thất bại. Vui lòng thử lại."));
    }
  };

  return (
    <Modal open={open} title="Đăng ký" onClose={handleClose}>
      <div className="flex flex-col gap-5">
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="flex flex-col gap-3"
          noValidate
        >
          <AuthField
            id="signup-fullname"
            label="Họ và tên"
            error={errors.fullName?.message}
          >
            <input
              id="signup-fullname"
              type="text"
              autoComplete="name"
              aria-invalid={Boolean(errors.fullName)}
              aria-describedby={
                errors.fullName ? "signup-fullname-error" : undefined
              }
              className={inputClassName(Boolean(errors.fullName))}
              placeholder="Nguyễn Văn A"
              {...register("fullName")}
            />
          </AuthField>

          <AuthField
            id="signup-email"
            label="Email"
            error={errors.email?.message}
          >
            <input
              id="signup-email"
              type="email"
              autoComplete="email"
              aria-invalid={Boolean(errors.email)}
              aria-describedby={errors.email ? "signup-email-error" : undefined}
              className={inputClassName(Boolean(errors.email))}
              placeholder="you@example.com"
              {...register("email")}
            />
          </AuthField>

          <AuthField
            id="signup-password"
            label="Mật khẩu"
            error={errors.password?.message}
            hint={
              <span className="text-xs text-gray-400">
                Tối thiểu 8 ký tự, có hoa/thường/số
              </span>
            }
          >
            <div className="relative">
              <input
                id="signup-password"
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                aria-invalid={Boolean(errors.password)}
                aria-describedby={
                  errors.password ? "signup-password-error" : undefined
                }
                className={inputClassName(Boolean(errors.password))}
                placeholder="••••••••"
                {...register("password")}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
                aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </AuthField>

          <AuthField
            id="signup-confirm-password"
            label="Xác nhận mật khẩu"
            error={errors.confirmPassword?.message}
          >
            <div className="relative">
              <input
                id="signup-confirm-password"
                type={showConfirmPassword ? "text" : "password"}
                autoComplete="new-password"
                aria-invalid={Boolean(errors.confirmPassword)}
                aria-describedby={
                  errors.confirmPassword
                    ? "signup-confirm-password-error"
                    : undefined
                }
                className={inputClassName(Boolean(errors.confirmPassword))}
                placeholder="••••••••"
                {...register("confirmPassword")}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
                aria-label={
                  showConfirmPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"
                }
              >
                {showConfirmPassword ? (
                  <EyeOff size={18} />
                ) : (
                  <Eye size={18} />
                )}
              </button>
            </div>
          </AuthField>

          <button
            type="submit"
            disabled={isSubmitting}
            className={submitButtonClass}
          >
            {isSubmitting ? "Đang đăng ký..." : "Đăng ký"}
            <ChevronRight size={16} />
          </button>
        </form>

        <SocialAuthButtons dividerLabel="hoặc đăng ký với" />

        <p className="text-center text-sm text-gray-600">
          Đã có tài khoản?{" "}
          <button
            type="button"
            onClick={onSwitchToLogin}
            className="font-semibold text-primary hover:text-primary-dark cursor-pointer"
          >
            Đăng nhập ngay
          </button>
        </p>
      </div>
    </Modal>
  );
}
