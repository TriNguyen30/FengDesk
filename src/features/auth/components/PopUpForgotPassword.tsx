import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ChevronRight, Eye, EyeOff, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import Modal from "@/components/ui/Modal";
import AuthField, { inputClassName } from "@/features/auth/components/AuthField";
import OtpInput from "@/features/auth/components/OtpInput";
import {
  forgotPasswordEmailSchema,
  type ForgotPasswordEmailFormValues,
  forgotPasswordResetSchema,
  type ForgotPasswordResetFormValues,
} from "@/features/auth/schemas/auth-schema";
import { getAuthErrorMessage } from "@/features/auth/utils/getAuthErrorMessage";
import {
  forgotPasswordRequest,
  verifyForgotPasswordRequest,
  resetForgotPasswordRequest,
} from "@/features/auth/api/auth.api";

export interface PopUpForgotPasswordProps {
  open: boolean;
  onClose: () => void;
  onSwitchToLogin: () => void;
}

type Step = "EMAIL" | "OTP" | "RESET";

const submitButtonClass =
  "mt-1 flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-primary py-2.5 text-sm font-semibold text-white transition hover:bg-primary-dark active:bg-green-800 disabled:cursor-not-allowed disabled:opacity-60 cursor-pointer";

export default function PopUpForgotPassword({
  open,
  onClose,
  onSwitchToLogin,
}: PopUpForgotPasswordProps) {
  const { t } = useTranslation();
  const [step, setStep] = useState<Step>("EMAIL");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [resetToken, setResetToken] = useState("");
  
  // UI states
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Forms
  const emailForm = useForm<ForgotPasswordEmailFormValues>({
    resolver: zodResolver(forgotPasswordEmailSchema),
    defaultValues: { email: "" },
  });

  const resetForm = useForm<ForgotPasswordResetFormValues>({
    resolver: zodResolver(forgotPasswordResetSchema),
    defaultValues: { password: "", confirmPassword: "" },
  });

  const resetAll = () => {
    setStep("EMAIL");
    setEmail("");
    setOtp("");
    setResetToken("");
    setIsSendingOtp(false);
    setIsVerifying(false);
    setShowPassword(false);
    setShowConfirmPassword(false);
    emailForm.reset();
    resetForm.reset();
  };

  const handleClose = () => {
    resetAll();
    onClose();
  };

  const onEmailSubmit = async (values: ForgotPasswordEmailFormValues) => {
    try {
      setIsSendingOtp(true);
      const response = await forgotPasswordRequest({ email: values.email });
      
      if (!response.isSuccess) {
        throw new Error(response.message || "Failed to initiate password reset");
      }
      
      setEmail(values.email);
      setStep("OTP");
      toast.success(t("forgot_password.toast.init_success"));
    } catch (error) {
      toast.error(getAuthErrorMessage(error, t("forgot_password.toast.init_error")));
    } finally {
      setIsSendingOtp(false);
    }
  };

  const onOtpComplete = async (code: string) => {
    setOtp(code);
    try {
      setIsVerifying(true);
      const response = await verifyForgotPasswordRequest({ email, otp: code });
      
      if (!response.isSuccess || !response.data?.resetPasswordToken) {
        throw new Error(response.message || "Invalid OTP");
      }
      
      const token = response.data.resetPasswordToken;
      setResetToken(token);
      setStep("RESET");
      toast.success(t("forgot_password.toast.verify_success"));
    } catch (error) {
      toast.error(getAuthErrorMessage(error, t("forgot_password.toast.verify_error")));
      setOtp("");
    } finally {
      setIsVerifying(false);
    }
  };

  const onResetSubmit = async (values: ForgotPasswordResetFormValues) => {
    try {
      const response = await resetForgotPasswordRequest({ 
        resetPasswordToken: resetToken, 
        newPassword: values.password 
      });
      
      if (!response.isSuccess) {
        throw new Error(response.message || "Failed to reset password");
      }
      
      toast.success(t("forgot_password.toast.reset_success"));
      handleClose();
      onSwitchToLogin();
    } catch (error) {
      toast.error(getAuthErrorMessage(error, t("forgot_password.toast.reset_error")));
    }
  };

  return (
    <Modal open={open} title={t("forgot_password.title")} onClose={handleClose}>
      <div className="flex flex-col gap-5">
        {step === "EMAIL" && (
          <form
            onSubmit={emailForm.handleSubmit(onEmailSubmit)}
            className="flex flex-col gap-3"
            noValidate
          >
            <p className="text-sm text-gray-600 mb-2">{t("forgot_password.email_step.desc")}</p>
            <AuthField id="forgot-email" label="Email" error={emailForm.formState.errors.email?.message}>
              <input
                id="forgot-email"
                type="email"
                autoComplete="email"
                aria-invalid={Boolean(emailForm.formState.errors.email)}
                className={inputClassName(Boolean(emailForm.formState.errors.email))}
                placeholder="you@example.com"
                {...emailForm.register("email")}
              />
            </AuthField>

            <button
              type="submit"
              disabled={isSendingOtp}
              className={submitButtonClass}
            >
              {isSendingOtp ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {t("forgot_password.email_step.submitting")}
                </>
              ) : (
                <>
                  {t("forgot_password.email_step.submit")}
                  <ChevronRight size={16} />
                </>
              )}
            </button>
          </form>
        )}

        {step === "OTP" && (
          <div className="flex flex-col items-center gap-4 text-center">
            <p className="text-sm text-gray-600">
              {t("forgot_password.otp_step.desc", { email })}
            </p>
            <OtpInput length={6} value={otp} onChange={setOtp} onComplete={onOtpComplete} />
            <button
              type="button"
              onClick={() => onOtpComplete(otp)}
              disabled={otp.length !== 6 || isVerifying}
              className={submitButtonClass}
            >
              {isVerifying ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {t("forgot_password.otp_step.submitting")}
                </>
              ) : (
                <>
                  {t("forgot_password.otp_step.submit")}
                  <ChevronRight size={16} />
                </>
              )}
            </button>
            <button
              type="button"
              onClick={() => onEmailSubmit({ email })}
              className="mt-2 text-sm font-medium text-primary hover:text-primary-dark cursor-pointer transition-colors disabled:opacity-50"
              disabled={isSendingOtp || isVerifying}
            >
              {isSendingOtp ? <Loader2 className="inline-block h-4 w-4 animate-spin mr-1" /> : null}
              {t("forgot_password.otp_step.resend")}
            </button>
          </div>
        )}

        {step === "RESET" && (
          <form
            onSubmit={resetForm.handleSubmit(onResetSubmit)}
            className="flex flex-col gap-3"
            noValidate
          >
            <p className="text-sm text-gray-600 mb-2">{t("forgot_password.reset_step.desc")}</p>
            
            <AuthField id="new-password" label={t("forgot_password.reset_step.new_password")} error={resetForm.formState.errors.password?.message}>
              <div className="relative">
                <input
                  id="new-password"
                  type={showPassword ? "text" : "password"}
                  aria-invalid={Boolean(resetForm.formState.errors.password)}
                  className={inputClassName(Boolean(resetForm.formState.errors.password))}
                  placeholder="••••••••"
                  {...resetForm.register("password")}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </AuthField>

            <AuthField id="confirm-password" label={t("forgot_password.reset_step.confirm_password")} error={resetForm.formState.errors.confirmPassword?.message}>
              <div className="relative">
                <input
                  id="confirm-password"
                  type={showConfirmPassword ? "text" : "password"}
                  aria-invalid={Boolean(resetForm.formState.errors.confirmPassword)}
                  className={inputClassName(Boolean(resetForm.formState.errors.confirmPassword))}
                  placeholder="••••••••"
                  {...resetForm.register("confirmPassword")}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
                >
                  {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </AuthField>

            <button
              type="submit"
              disabled={resetForm.formState.isSubmitting}
              className={submitButtonClass}
            >
              {resetForm.formState.isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {t("forgot_password.reset_step.submitting")}
                </>
              ) : (
                <>
                  {t("forgot_password.reset_step.submit")}
                  <ChevronRight size={16} />
                </>
              )}
            </button>
          </form>
        )}

        <p className="text-center text-sm text-gray-600">
          <button
            type="button"
            onClick={() => {
              resetAll();
              onSwitchToLogin();
            }}
            className="font-semibold text-primary hover:text-primary-dark cursor-pointer transition-colors"
          >
            {t("forgot_password.back_to_login")}
          </button>
        </p>
      </div>
    </Modal>
  );
}
