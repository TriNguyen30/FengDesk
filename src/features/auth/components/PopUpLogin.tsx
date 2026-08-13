import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ChevronRight, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
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
  onSwitchToForgotPassword?: () => void;
}

const submitButtonClass =
  "mt-1 flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-primary py-2.5 text-sm font-semibold text-white transition hover:bg-primary-dark active:bg-green-800 disabled:cursor-not-allowed disabled:opacity-60 cursor-pointer";

export default function PopUpLogin({ open, onClose, onSwitchToSignUp, onSwitchToForgotPassword }: PopUpLoginProps) {
  const { t } = useTranslation();
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
        toast.error(response.message || t("login.toast.login_failed"));
        return;
      }

      persistSession(response.data);
      toast.success(response.message || t("login.toast.login_success"));
      handleClose();

      // Staff/Manager/Admin → vào khu điều hành. role có thể là chuỗi nhiều giá trị ("Customer, Staff").
      const roles = (response.data.user.role ?? "").split(",").map((r) => r.trim());
      if (roles.some((r) => r === "Staff" || r === "Manager" || r === "Admin")) {
        window.location.assign("/manager");
      }
    } catch (error) {
      toast.error(getAuthErrorMessage(error, t("login.toast.login_failed_retry")));
    }
  };

  const emailErrors = emailForm.formState.errors;

  return (
    <Modal open={open} title={t("login.title")} onClose={handleClose}>
      <div className="flex flex-col gap-5">
        <form
          onSubmit={emailForm.handleSubmit(onEmailSubmit)}
          className="flex flex-col gap-3"
          noValidate
        >
          <AuthField id="login-email" label={t("login.email_label")} error={emailErrors.email?.message}>
            <input
              id="login-email"
              type="email"
              autoComplete="email"
              aria-invalid={Boolean(emailErrors.email)}
              aria-describedby={emailErrors.email ? "login-email-error" : undefined}
              className={inputClassName(Boolean(emailErrors.email))}
              placeholder={t("login.email_placeholder")}
              {...emailForm.register("email")}
            />
          </AuthField>

          <AuthField id="login-password" label={t("login.password_label")} error={emailErrors.password?.message}>
            <div className="relative">
              <input
                id="login-password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                aria-invalid={Boolean(emailErrors.password)}
                aria-describedby={emailErrors.password ? "login-password-error" : undefined}
                className={inputClassName(Boolean(emailErrors.password))}
                placeholder={t("login.password_placeholder")}
                {...emailForm.register("password")}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
                aria-label={showPassword ? t("login.hide_password") : t("login.show_password")}
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
            {t("login.remember_me")}
          </label>

          <button
            type="submit"
            disabled={emailForm.formState.isSubmitting}
            className={submitButtonClass}
          >
            {emailForm.formState.isSubmitting ? t("login.submitting") : t("login.submit")}
            <ChevronRight size={16} />
          </button>

          <div className="text-start mt-1">
            <button
              type="button"
              className="text-sm text-primary hover:text-primary-dark cursor-pointer transition-colors"
              onClick={onSwitchToForgotPassword}
            >
              {t("login.forgot_password")}
            </button>
          </div>
        </form>

        <SocialAuthButtons onSuccess={handleClose} />

        <p className="text-center text-sm text-gray-600">
          {t("login.no_account")}{" "}
          <button
            type="button"
            onClick={onSwitchToSignUp}
            className="font-semibold text-primary hover:text-primary-dark cursor-pointer"
          >
            {t("login.register_now")}
          </button>
        </p>
      </div>
    </Modal>
  );
}
