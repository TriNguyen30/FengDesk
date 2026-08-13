import { useState, useRef, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ChevronRight, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import Modal from "@/components/ui/Modal";
import Calendar from "@/components/ui/Calendar";
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
  const { t } = useTranslation();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [email, setEmail] = useState("");
  const [registrationToken, setRegistrationToken] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [showCalendar, setShowCalendar] = useState(false);
  const calendarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (calendarRef.current && !calendarRef.current.contains(e.target as Node)) {
        setShowCalendar(false);
      }
    };
    if (showCalendar) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showCalendar]);

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
        toast.error(response.message || t("signup.toast.init_failed"));
        return;
      }
      setEmail(values.email);
      setStep(2);
      toast.success(response.message || t("signup.toast.init_success"));
    } catch (error) {
      toast.error(getAuthErrorMessage(error, t("signup.toast.init_error")));
    }
  };

  const onVerifySubmit = async (values: SignUpVerifyFormValues) => {
    try {
      const response = await registerVerifyRequest({ email, otp: values.otp });
      if (!response.isSuccess || !response.data?.registrationToken) {
        toast.error(response.message || t("signup.toast.verify_failed"));
        return;
      }
      setRegistrationToken(response.data.registrationToken);
      setStep(3);
      toast.success(t("signup.toast.verify_success"));
    } catch (error) {
      toast.error(getAuthErrorMessage(error, t("signup.toast.verify_error")));
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
        toast.error(response.message || t("signup.toast.finalize_failed"));
        return;
      }

      toast.success(response.message || t("signup.toast.finalize_success"));
      handleClose();
      if (onSwitchToLogin) onSwitchToLogin();
    } catch (error) {
      toast.error(getAuthErrorMessage(error, t("signup.toast.finalize_error")));
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
              {t("signup.step1.desc")}
            </p>
            <AuthField
              id="signup-initiate-email"
              label={t("signup.step1.email_label")}
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
                placeholder={t("signup.step1.email_placeholder")}
                {...initiateForm.register("email")}
              />
            </AuthField>

            <button
              type="submit"
              disabled={initiateForm.formState.isSubmitting}
              className={submitButtonClass}
            >
              {initiateForm.formState.isSubmitting ? t("signup.step1.submitting") : t("signup.step1.submit")}
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
                {t("signup.step2.desc_part1")}{" "}
                <span className="font-semibold text-gray-900">{email}</span>
              </p>
              <button
                type="button"
                onClick={() => setStep(1)}
                className="text-xs text-green-600 hover:text-green-700 cursor-pointer"
              >
                {t("signup.step2.change_email")}
              </button>
            </div>

            <OtpInput
              // eslint-disable-next-line react-hooks/incompatible-library
              value={verifyForm.watch("otp")}
              onChange={(otp) => verifyForm.setValue("otp", otp, { shouldValidate: true })}
              error={verifyForm.formState.errors.otp?.message}
            />

            <p className="text-center text-xs text-gray-500">
              {t("signup.step2.no_code")}{" "}
              <button
                type="button"
                onClick={() => initiateForm.handleSubmit(onInitiateSubmit)()}
                className="font-medium text-green-600 hover:text-green-700 cursor-pointer"
              >
                {t("signup.step2.resend")}
              </button>
            </p>

            <button
              type="submit"
              disabled={verifyForm.formState.isSubmitting || verifyForm.watch("otp").length < 6}
              className={submitButtonClass}
            >
              {t("signup.step2.submit")}
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
              label={t("signup.step3.fullname_label")}
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
                placeholder={t("signup.step3.fullname_placeholder")}
                {...finalizeForm.register("fullName")}
              />
            </AuthField>

            <div className="flex gap-3">
              <AuthField
                id="signup-phone"
                label={t("signup.step3.phone_label")}
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
                  placeholder={t("signup.step3.phone_placeholder")}
                  {...finalizeForm.register("phone", {
                    setValueAs: (value) => String(value).replace(/\D/g, ""),
                  })}
                />
              </AuthField>

              <AuthField
                id="signup-dob"
                label={t("signup.step3.dob_label")}
                error={finalizeForm.formState.errors.dateOfBirth?.message}
              >
                <div className="relative" ref={calendarRef}>
                  <input
                    id="signup-dob"
                    type="text"
                    readOnly
                    onClick={() => setShowCalendar(true)}
                    value={
                      finalizeForm.watch("dateOfBirth")
                        ? new Date(finalizeForm.watch("dateOfBirth")).toLocaleDateString("vi-VN")
                        : ""
                    }
                    aria-invalid={Boolean(finalizeForm.formState.errors.dateOfBirth)}
                    aria-describedby={
                      finalizeForm.formState.errors.dateOfBirth ? "signup-dob-error" : undefined
                    }
                    className={
                      inputClassName(Boolean(finalizeForm.formState.errors.dateOfBirth)) +
                      " cursor-pointer bg-white"
                    }
                    placeholder={t("signup.step3.dob_placeholder")}
                  />
                  {showCalendar && (
                    <div className="absolute top-full right-0 z-50 mt-1">
                      <Calendar
                        value={finalizeForm.watch("dateOfBirth")}
                        onChange={(val) => {
                          finalizeForm.setValue("dateOfBirth", val, { shouldValidate: true });
                          setShowCalendar(false);
                        }}
                      />
                    </div>
                  )}
                </div>
              </AuthField>
            </div>

            <AuthField
              id="signup-gender"
              label={t("signup.step3.gender_label")}
              error={finalizeForm.formState.errors.gender?.message}
            >
              <select
                id="signup-gender"
                className={inputClassName(Boolean(finalizeForm.formState.errors.gender))}
                {...finalizeForm.register("gender")}
              >
                <option value={1}>{t("signup.step3.gender_male")}</option>
                <option value={2}>{t("signup.step3.gender_female")}</option>
                <option value={3}>{t("signup.step3.gender_other")}</option>
              </select>
            </AuthField>

            <AuthField
              id="signup-password"
              label={t("signup.step3.password_label")}
              error={finalizeForm.formState.errors.password?.message}
              hint={
                <span className="text-xs text-gray-400">{t("signup.step3.password_hint")}</span>
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
                  placeholder={t("signup.step3.password_placeholder")}
                  {...finalizeForm.register("password")}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
                  aria-label={showPassword ? t("signup.step3.hide_password") : t("signup.step3.show_password")}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </AuthField>

            <AuthField
              id="signup-confirm-password"
              label={t("signup.step3.confirm_password_label")}
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
                  placeholder={t("signup.step3.confirm_password_placeholder")}
                  {...finalizeForm.register("confirmPassword")}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
                  aria-label={showConfirmPassword ? t("signup.step3.hide_password") : t("signup.step3.show_password")}
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
              {finalizeForm.formState.isSubmitting ? t("signup.step3.submitting") : t("signup.step3.submit")}
              <ChevronRight size={16} />
            </button>
          </form>
        );

      default:
        return null;
    }
  };

  return (
    <Modal open={open} title={t("signup.title")} onClose={handleClose}>
      <div className="flex flex-col gap-5">
        {renderStep()}

        {step === 1 && <SocialAuthButtons dividerLabel="HOẶC" onSuccess={handleClose} />}

        <p className="text-center text-sm text-gray-600">
          {t("signup.has_account")}{" "}
          <button
            type="button"
            onClick={onSwitchToLogin}
            className="font-semibold text-primary hover:text-primary-dark cursor-pointer"
          >
            {t("signup.login_now")}
          </button>
        </p>
      </div>
    </Modal>
  );
}
