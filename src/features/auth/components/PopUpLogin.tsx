import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Mail, Phone, ChevronRight, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import Modal from "@/components/ui/Modal";
import { loginRequest } from "@/features/auth/api/authApi";
import AuthField, { inputClassName } from "@/features/auth/components/AuthField";
import OtpInput from "@/features/auth/components/OtpInput";
import SocialAuthButtons from "@/features/auth/components/SocialAuthButtons";
import { useAuthSession } from "@/features/auth/hooks/useAuthSession";
import {
  loginEmailSchema,
  loginPhoneSchema,
  otpSchema,
  type LoginEmailFormValues,
  type LoginPhoneFormValues,
  type OtpFormValues,
} from "@/features/auth/schemas/auth-schema";
import { getAuthErrorMessage } from "@/features/auth/utils/getAuthErrorMessage";

export interface PopUpLoginProps {
  open: boolean;
  onClose: () => void;
  onSwitchToSignUp?: () => void;
}

type Tab = "email" | "phone";

const submitButtonClass =
  "mt-1 flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-primary py-2.5 text-sm font-semibold text-white transition hover:bg-primary-dark active:bg-green-800 disabled:cursor-not-allowed disabled:opacity-60 cursor-pointer";

export default function PopUpLogin({
  open,
  onClose,
  onSwitchToSignUp,
}: PopUpLoginProps) {
  const { persistSession } = useAuthSession();
  const [tab, setTab] = useState<Tab>("email");
  const [otpSent, setOtpSent] = useState(false);
  const [verifiedPhone, setVerifiedPhone] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const emailForm = useForm<LoginEmailFormValues>({
    resolver: zodResolver(loginEmailSchema),
    defaultValues: { email: "", password: "", remember: false },
  });

  const phoneForm = useForm<LoginPhoneFormValues>({
    resolver: zodResolver(loginPhoneSchema),
    defaultValues: { phone: "" },
  });

  const otpForm = useForm<OtpFormValues>({
    resolver: zodResolver(otpSchema),
    defaultValues: { otp: "" },
  });

  const resetAll = () => {
    emailForm.reset();
    phoneForm.reset();
    otpForm.reset();
    setTab("email");
    setOtpSent(false);
    setVerifiedPhone("");
    setShowPassword(false);
  };

  const handleClose = () => {
    resetAll();
    onClose();
  };

  const switchTab = (next: Tab) => {
    setTab(next);
    setOtpSent(false);
    setVerifiedPhone("");
    otpForm.reset();
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
      toast.error(
        getAuthErrorMessage(error, "Đăng nhập thất bại. Vui lòng thử lại."),
      );
    }
  };

  const onSendOtp = async (values: LoginPhoneFormValues) => {
    try {
      // TODO: integrate phone OTP API when backend is ready
      console.log("send otp to", values.phone);
      setVerifiedPhone(values.phone);
      setOtpSent(true);
      otpForm.reset({ otp: "" });
      toast.success("Đã gửi mã OTP (demo)");
    } catch (error) {
      toast.error(getAuthErrorMessage(error, "Không thể gửi mã OTP"));
    }
  };

  const onVerifyOtp = async (values: OtpFormValues) => {
    try {
      // TODO: integrate OTP verify API when backend is ready
      console.log("verify otp", { phone: verifiedPhone, otp: values.otp });
      toast.success("Xác minh OTP thành công (demo)");
      handleClose();
    } catch (error) {
      toast.error(getAuthErrorMessage(error, "Mã OTP không hợp lệ"));
    }
  };

  const emailErrors = emailForm.formState.errors;
  const phoneErrors = phoneForm.formState.errors;
  const otpErrors = otpForm.formState.errors;

  return (
    <Modal open={open} title="Đăng nhập" onClose={handleClose}>
      <div className="flex flex-col gap-5">
        <div className="flex rounded-xl bg-gray-100 p-1">
          <button
            type="button"
            onClick={() => switchTab("email")}
            className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2 text-sm font-medium transition cursor-pointer ${
              tab === "email"
                ? "bg-white text-primary shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            <Mail size={15} />
            Email
          </button>
          <button
            type="button"
            onClick={() => switchTab("phone")}
            className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2 text-sm font-medium transition cursor-pointer ${
              tab === "phone"
                ? "bg-white text-primary shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            <Phone size={15} />
            Số điện thoại
          </button>
        </div>

        {tab === "email" && (
          <form
            onSubmit={emailForm.handleSubmit(onEmailSubmit)}
            className="flex flex-col gap-3"
            noValidate
          >
            <AuthField
              id="login-email"
              label="Email"
              error={emailErrors.email?.message}
            >
              <input
                id="login-email"
                type="email"
                autoComplete="email"
                aria-invalid={Boolean(emailErrors.email)}
                aria-describedby={
                  emailErrors.email ? "login-email-error" : undefined
                }
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
                  aria-describedby={
                    emailErrors.password ? "login-password-error" : undefined
                  }
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
              {emailForm.formState.isSubmitting
                ? "Đang đăng nhập..."
                : "Đăng nhập"}
              <ChevronRight size={16} />
            </button>
          </form>
        )}

        {tab === "phone" && !otpSent && (
          <form
            onSubmit={phoneForm.handleSubmit(onSendOtp)}
            className="flex flex-col gap-3"
            noValidate
          >
            <AuthField
              id="login-phone"
              label="Số điện thoại"
              error={phoneErrors.phone?.message}
            >
              <input
                id="login-phone"
                type="tel"
                inputMode="numeric"
                aria-invalid={Boolean(phoneErrors.phone)}
                aria-describedby={
                  phoneErrors.phone ? "login-phone-error" : undefined
                }
                className={inputClassName(Boolean(phoneErrors.phone))}
                placeholder="09xxxxxxxx"
                {...phoneForm.register("phone", {
                  setValueAs: (value) => String(value).replace(/\D/g, ""),
                })}
              />
            </AuthField>
            <button
              type="submit"
              disabled={phoneForm.formState.isSubmitting}
              className={submitButtonClass}
            >
              Tiếp tục
              <ChevronRight size={16} />
            </button>
          </form>
        )}

        {tab === "phone" && otpSent && (
          <form
            onSubmit={otpForm.handleSubmit(onVerifyOtp)}
            className="flex flex-col gap-4"
            noValidate
          >
            <div>
              <p className="mb-1 text-sm text-gray-600">
                Nhập mã 6 chữ số vừa gửi đến{" "}
                <span className="font-semibold text-gray-900">
                  {verifiedPhone}
                </span>
              </p>
              <button
                type="button"
                onClick={() => {
                  setOtpSent(false);
                  otpForm.reset({ otp: "" });
                }}
                className="text-xs text-green-600 hover:text-green-700 cursor-pointer"
              >
                Đổi số điện thoại
              </button>
            </div>

            <OtpInput
              value={otpForm.watch("otp")}
              onChange={(otp) =>
                otpForm.setValue("otp", otp, { shouldValidate: true })
              }
              error={otpErrors.otp?.message}
            />

            <p className="text-center text-xs text-gray-500">
              Không nhận được mã?{" "}
              <button
                type="button"
                onClick={() => phoneForm.handleSubmit(onSendOtp)()}
                className="font-medium text-green-600 hover:text-green-700 cursor-pointer"
              >
                Gửi lại
              </button>
            </p>

            <button
              type="submit"
              disabled={
                otpForm.formState.isSubmitting ||
                otpForm.watch("otp").length < 6
              }
              className={submitButtonClass}
            >
              Xác nhận
              <ChevronRight size={16} />
            </button>
          </form>
        )}

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
