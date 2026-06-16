import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ChevronRight, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import Modal from "@/components/ui/Modal";
import {
  registerInitiateRequest,
  registerVerifyRequest,
  registerFinalizeRequest,
} from "@/features/auth/api/auth.api";
import AuthField, { inputClassName } from "@/features/auth/components/AuthField";
import OtpInput from "@/features/auth/components/OtpInput";
import SocialAuthButtons from "@/features/auth/components/SocialAuthButtons";
import {
  signUpInitiateSchema,
  type SignUpInitiateFormValues,
  signUpVerifySchema,
  type SignUpVerifyFormValues,
  signUpFinalizeSchema,
  type SignUpFinalizeFormValues,
} from "@/features/auth/schemas/auth-schema";
import { getAuthErrorMessage } from "@/features/auth/utils/getAuthErrorMessage";

export interface PopUpSignUpProps {
  open: boolean;
  onClose: () => void;
  onSwitchToLogin?: () => void;
}

const submitButtonClass =
  "mt-1 flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-primary py-2.5 text-sm font-semibold text-white transition hover:bg-primary-dark active:bg-green-800 disabled:cursor-not-allowed disabled:opacity-60 cursor-pointer";

export default function PopUpSignUp({ open, onClose, onSwitchToLogin }: PopUpSignUpProps) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [email, setEmail] = useState("");
  const [registrationToken, setRegistrationToken] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const initiateForm = useForm<SignUpInitiateFormValues>({
    resolver: zodResolver(signUpInitiateSchema),
    defaultValues: { email: "" },
  });

  const verifyForm = useForm<SignUpVerifyFormValues>({
    resolver: zodResolver(signUpVerifySchema),
    defaultValues: { otp: "" },
  });

  const finalizeForm = useForm<SignUpFinalizeFormValues>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(signUpFinalizeSchema) as any,
    defaultValues: {
      fullName: "",
      phone: "",
      dateOfBirth: "",
      gender: 0, // 0 = Nam, 1 = Nữ, 2 = Khác
      password: "",
      confirmPassword: "",
    },
  });

  const handleClose = () => {
    initiateForm.reset();
    verifyForm.reset();
    finalizeForm.reset();
    setStep(1);
    setEmail("");
    setRegistrationToken("");
    setShowPassword(false);
    setShowConfirmPassword(false);
    onClose();
  };

  const onInitiateSubmit = async (values: SignUpInitiateFormValues) => {
    try {
      const response = await registerInitiateRequest({ email: values.email });
      if (!response.isSuccess) {
        toast.error(response.message || "Không thể gửi OTP");
        return;
      }
      setEmail(values.email);
      setStep(2);
      toast.success(response.message || "Mã OTP đã được gửi đến email");
    } catch (error) {
      toast.error(getAuthErrorMessage(error, "Có lỗi xảy ra. Vui lòng thử lại."));
    }
  };

  const onVerifySubmit = async (values: SignUpVerifyFormValues) => {
    try {
      const response = await registerVerifyRequest({ email, otp: values.otp });
      if (!response.isSuccess || !response.data?.registrationToken) {
        toast.error(response.message || "Xác thực OTP thất bại");
        return;
      }
      setRegistrationToken(response.data.registrationToken);
      setStep(3);
      toast.success("Xác thực email thành công");
    } catch (error) {
      toast.error(getAuthErrorMessage(error, "Mã OTP không hợp lệ"));
    }
  };

  const onFinalizeSubmit = async (values: SignUpFinalizeFormValues) => {
    try {
      const response = await registerFinalizeRequest({
        registrationToken,
        fullName: values.fullName,
        phone: values.phone,
        dateOfBirth: new Date(values.dateOfBirth).toISOString(),
        gender: values.gender,
        password: values.password,
      });

      if (!response.isSuccess) {
        toast.error(response.message || "Đăng ký thất bại");
        return;
      }

      toast.success(response.message || "Đăng ký thành công! Vui lòng đăng nhập.");
      handleClose();
      if (onSwitchToLogin) onSwitchToLogin();
    } catch (error) {
      toast.error(getAuthErrorMessage(error, "Đăng ký thất bại. Vui lòng thử lại."));
    }
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <form
            onSubmit={initiateForm.handleSubmit(onInitiateSubmit)}
            className="flex flex-col gap-3"
            noValidate
          >
            <p className="text-sm text-gray-600 mb-2">
              Vui lòng nhập email của bạn để bắt đầu đăng ký. Chúng tôi sẽ gửi mã xác nhận đến email
              này.
            </p>
            <AuthField
              id="signup-initiate-email"
              label="Email"
              error={initiateForm.formState.errors.email?.message}
            >
              <input
                id="signup-initiate-email"
                type="email"
                autoComplete="email"
                aria-invalid={Boolean(initiateForm.formState.errors.email)}
                aria-describedby={
                  initiateForm.formState.errors.email ? "signup-initiate-email-error" : undefined
                }
                className={inputClassName(Boolean(initiateForm.formState.errors.email))}
                placeholder="you@example.com"
                {...initiateForm.register("email")}
              />
            </AuthField>

            <button
              type="submit"
              disabled={initiateForm.formState.isSubmitting}
              className={submitButtonClass}
            >
              {initiateForm.formState.isSubmitting ? "Đang gửi OTP..." : "Tiếp tục"}
              <ChevronRight size={16} />
            </button>
          </form>
        );

      case 2:
        return (
          <form
            onSubmit={verifyForm.handleSubmit(onVerifySubmit)}
            className="flex flex-col gap-4"
            noValidate
          >
            <div>
              <p className="mb-1 text-sm text-gray-600">
                Nhập mã 6 chữ số vừa gửi đến{" "}
                <span className="font-semibold text-gray-900">{email}</span>
              </p>
              <button
                type="button"
                onClick={() => setStep(1)}
                className="text-xs text-green-600 hover:text-green-700 cursor-pointer"
              >
                Đổi email
              </button>
            </div>

            <OtpInput
              // eslint-disable-next-line react-hooks/incompatible-library
              value={verifyForm.watch("otp")}
              onChange={(otp) => verifyForm.setValue("otp", otp, { shouldValidate: true })}
              error={verifyForm.formState.errors.otp?.message}
            />

            <p className="text-center text-xs text-gray-500">
              Không nhận được mã?{" "}
              <button
                type="button"
                onClick={() => initiateForm.handleSubmit(onInitiateSubmit)()}
                className="font-medium text-green-600 hover:text-green-700 cursor-pointer"
              >
                Gửi lại
              </button>
            </p>

            <button
              type="submit"
              disabled={verifyForm.formState.isSubmitting || verifyForm.watch("otp").length < 6}
              className={submitButtonClass}
            >
              Xác nhận
              <ChevronRight size={16} />
            </button>
          </form>
        );

      case 3:
        return (
          <form
            onSubmit={finalizeForm.handleSubmit(onFinalizeSubmit)}
            className="flex flex-col gap-3"
            noValidate
          >
            <AuthField
              id="signup-fullname"
              label="Họ và tên"
              error={finalizeForm.formState.errors.fullName?.message}
            >
              <input
                id="signup-fullname"
                type="text"
                autoComplete="name"
                aria-invalid={Boolean(finalizeForm.formState.errors.fullName)}
                aria-describedby={
                  finalizeForm.formState.errors.fullName ? "signup-fullname-error" : undefined
                }
                className={inputClassName(Boolean(finalizeForm.formState.errors.fullName))}
                placeholder="Nguyễn Văn A"
                {...finalizeForm.register("fullName")}
              />
            </AuthField>

            <div className="flex gap-3">
              <AuthField
                id="signup-phone"
                label="Số điện thoại"
                error={finalizeForm.formState.errors.phone?.message}
              >
                <input
                  id="signup-phone"
                  type="tel"
                  inputMode="numeric"
                  aria-invalid={Boolean(finalizeForm.formState.errors.phone)}
                  aria-describedby={
                    finalizeForm.formState.errors.phone ? "signup-phone-error" : undefined
                  }
                  className={inputClassName(Boolean(finalizeForm.formState.errors.phone))}
                  placeholder="09xxxxxxxx"
                  {...finalizeForm.register("phone", {
                    setValueAs: (value) => String(value).replace(/\D/g, ""),
                  })}
                />
              </AuthField>

              <AuthField
                id="signup-dob"
                label="Ngày sinh"
                error={finalizeForm.formState.errors.dateOfBirth?.message}
              >
                <input
                  id="signup-dob"
                  type="date"
                  aria-invalid={Boolean(finalizeForm.formState.errors.dateOfBirth)}
                  aria-describedby={
                    finalizeForm.formState.errors.dateOfBirth ? "signup-dob-error" : undefined
                  }
                  className={inputClassName(Boolean(finalizeForm.formState.errors.dateOfBirth))}
                  {...finalizeForm.register("dateOfBirth")}
                />
              </AuthField>
            </div>

            <AuthField
              id="signup-gender"
              label="Giới tính"
              error={finalizeForm.formState.errors.gender?.message}
            >
              <select
                id="signup-gender"
                className={inputClassName(Boolean(finalizeForm.formState.errors.gender))}
                {...finalizeForm.register("gender")}
              >
                <option value={0}>Nam</option>
                <option value={1}>Nữ</option>
                <option value={2}>Khác</option>
              </select>
            </AuthField>

            <AuthField
              id="signup-password"
              label="Mật khẩu"
              error={finalizeForm.formState.errors.password?.message}
              hint={
                <span className="text-xs text-gray-400">Tối thiểu 8 ký tự, có hoa/thường/số</span>
              }
            >
              <div className="relative">
                <input
                  id="signup-password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  aria-invalid={Boolean(finalizeForm.formState.errors.password)}
                  aria-describedby={
                    finalizeForm.formState.errors.password ? "signup-password-error" : undefined
                  }
                  className={inputClassName(Boolean(finalizeForm.formState.errors.password))}
                  placeholder="••••••••"
                  {...finalizeForm.register("password")}
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
              error={finalizeForm.formState.errors.confirmPassword?.message}
            >
              <div className="relative">
                <input
                  id="signup-confirm-password"
                  type={showConfirmPassword ? "text" : "password"}
                  autoComplete="new-password"
                  aria-invalid={Boolean(finalizeForm.formState.errors.confirmPassword)}
                  aria-describedby={
                    finalizeForm.formState.errors.confirmPassword
                      ? "signup-confirm-password-error"
                      : undefined
                  }
                  className={inputClassName(Boolean(finalizeForm.formState.errors.confirmPassword))}
                  placeholder="••••••••"
                  {...finalizeForm.register("confirmPassword")}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
                  aria-label={showConfirmPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                >
                  {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </AuthField>

            <button
              type="submit"
              disabled={finalizeForm.formState.isSubmitting}
              className={submitButtonClass}
            >
              {finalizeForm.formState.isSubmitting ? "Đang đăng ký..." : "Hoàn tất đăng ký"}
              <ChevronRight size={16} />
            </button>
          </form>
        );

      default:
        return null;
    }
  };

  return (
    <Modal open={open} title="Đăng ký" onClose={handleClose}>
      <div className="flex flex-col gap-5">
        {renderStep()}

        {step === 1 && <SocialAuthButtons dividerLabel="HOẶC" />}

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
