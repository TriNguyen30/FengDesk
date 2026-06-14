import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ChevronRight, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import Modal from "@/components/ui/Modal";
import { loginRequest } from "@/features/auth/api/auth.api";
import AuthField, { inputClassName } from "@/features/auth/components/AuthField";
import SocialAuthButtons from "@/features/auth/components/SocialAuthButtons";
import { useAuthSession } from "@/features/auth/hooks/useAuthSession";
import { loginEmailSchema, type LoginEmailFormValues } from "@/features/auth/schemas/auth-schema";
import { getAuthErrorMessage } from "@/features/auth/utils/getAuthErrorMessage";

export interface PopUpLoginProps {
  open: boolean;
  onClose: () => void;
  onSwitchToSignUp?: () => void;
}

const submitButtonClass =
  "mt-1 flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-primary py-2.5 text-sm font-semibold text-white transition hover:bg-primary-dark active:bg-green-800 disabled:cursor-not-allowed disabled:opacity-60 cursor-pointer";

export default function PopUpLogin({ open, onClose, onSwitchToSignUp }: PopUpLoginProps) {
  const { persistSession } = useAuthSession();
  const [showPassword, setShowPassword] = useState(false);

  const emailForm = useForm<LoginEmailFormValues>({
    resolver: zodResolver(loginEmailSchema),
    defaultValues: { email: "", password: "", remember: false },
  });

  const resetAll = () => {
    emailForm.reset();
    setShowPassword(false);
  };

  const handleClose = () => {
    resetAll();
    onClose();
  };

  const onEmailSubmit = async (values: LoginEmailFormValues) => {
    try {
      const response = await loginRequest({
        email: values.email,
        password: values.password,
      });

      if (!response.isSuccess || !response.data) {
        toast.error(response.message || "Đăng nhập thất bại");
        return;
      }

      persistSession(response.data);
      toast.success(response.message || "Đăng nhập thành công");
      handleClose();
    } catch (error) {
      toast.error(getAuthErrorMessage(error, "Đăng nhập thất bại. Vui lòng thử lại."));
    }
  };

  const emailErrors = emailForm.formState.errors;

  return (
    <Modal open={open} title="Đăng nhập" onClose={handleClose}>
      <div className="flex flex-col gap-5">
        <form
          onSubmit={emailForm.handleSubmit(onEmailSubmit)}
          className="flex flex-col gap-3"
          noValidate
        >
          <AuthField id="login-email" label="Email" error={emailErrors.email?.message}>
            <input
              id="login-email"
              type="email"
              autoComplete="email"
              aria-invalid={Boolean(emailErrors.email)}
              aria-describedby={emailErrors.email ? "login-email-error" : undefined}
              className={inputClassName(Boolean(emailErrors.email))}
              placeholder="you@example.com"
              {...emailForm.register("email")}
            />
          </AuthField>

          <AuthField
            id="login-password"
            label="Mật khẩu"
            error={emailErrors.password?.message}
            hint={
              <button
                type="button"
                className="text-xs font-medium text-primary hover:text-primary-dark cursor-pointer"
              >
                Quên mật khẩu?
              </button>
            }
          >
            <div className="relative">
              <input
                id="login-password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                aria-invalid={Boolean(emailErrors.password)}
                aria-describedby={emailErrors.password ? "login-password-error" : undefined}
                className={inputClassName(Boolean(emailErrors.password))}
                placeholder="••••••••"
                {...emailForm.register("password")}
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

          <label className="flex cursor-pointer items-center gap-2 text-sm text-gray-600">
            <input
              type="checkbox"
              className="size-4 rounded border-gray-300 accent-green-600"
              {...emailForm.register("remember")}
            />
            Ghi nhớ đăng nhập
          </label>

          <button
            type="submit"
            disabled={emailForm.formState.isSubmitting}
            className={submitButtonClass}
          >
            {emailForm.formState.isSubmitting ? "Đang đăng nhập..." : "Đăng nhập"}
            <ChevronRight size={16} />
          </button>
        </form>

        <SocialAuthButtons />

        <p className="text-center text-sm text-gray-600">
          Chưa có tài khoản?{" "}
          <button
            type="button"
            onClick={onSwitchToSignUp}
            className="font-semibold text-primary hover:text-primary-dark cursor-pointer"
          >
            Đăng ký ngay
          </button>
        </p>
      </div>
    </Modal>
  );
}
