import { useState } from "react";
import { Loader2, Mail, Pencil, X } from "lucide-react";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { useAppDispatch } from "@/app/store";
import { setCredentials } from "@/features/auth/store/authSlice";
import { setSession } from "@/utils";
import {
  confirmNewEmailRequest,
  initiateEmailChangeRequest,
  requestNewEmailRequest,
  verifyCurrentEmailRequest,
} from "@/features/auth/api/auth.api";

/**
 * Các chặng của luồng đổi email. Nút bên cạnh ô email đổi nhãn theo chặng, đúng như thiết kế:
 * idle → gửi OTP mail cũ → nhập OTP mail cũ → (mở khóa) nhập mail mới → nhập OTP mail mới.
 */
type Stage = "idle" | "otpCurrent" | "newEmail" | "otpNew";

interface ChangeEmailFlowProps {
  currentEmail: string;
  /** Gọi sau khi đổi email thành công để màn cha refetch hồ sơ. */
  onChanged: () => void;
}

export default function ChangeEmailFlow({ currentEmail, onChanged }: ChangeEmailFlowProps) {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();

  const [stage, setStage] = useState<Stage>("idle");
  const [busy, setBusy] = useState(false);
  const [changeEmailToken, setChangeEmailToken] = useState("");
  const [currentOtp, setCurrentOtp] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newOtp, setNewOtp] = useState("");

  const reset = () => {
    setStage("idle");
    setChangeEmailToken("");
    setCurrentOtp("");
    setNewEmail("");
    setNewOtp("");
  };

  /** Bọc mọi lời gọi API: bật cờ busy, báo lỗi bằng message của BE, trả về true nếu thành công. */
  const run = async (fn: () => Promise<{ isSuccess: boolean; message: string | null }>) => {
    setBusy(true);
    try {
      const res = await fn();
      if (!res.isSuccess) {
        toast.error(res.message || t("profile_info.email_change.errors.generic"));
        return false;
      }
      if (res.message) toast.success(res.message);
      return true;
    } catch {
      toast.error(t("profile_info.email_change.errors.generic"));
      return false;
    } finally {
      setBusy(false);
    }
  };

  // B1 — gửi OTP tới email hiện tại.
  const handleStart = async () => {
    if (await run(initiateEmailChangeRequest)) setStage("otpCurrent");
  };

  // B2 — xác thực OTP email hiện tại, nhận token mở khóa ô nhập email mới.
  const handleVerifyCurrent = async () => {
    setBusy(true);
    try {
      const res = await verifyCurrentEmailRequest(currentOtp.trim());
      if (!res.isSuccess || !res.data) {
        toast.error(res.message || t("profile_info.email_change.errors.otp"));
        return;
      }
      setChangeEmailToken(res.data.changeEmailToken);
      setStage("newEmail");
    } catch {
      toast.error(t("profile_info.email_change.errors.otp"));
    } finally {
      setBusy(false);
    }
  };

  // B3 — khai email mới, BE gửi OTP tới hòm thư đó.
  const handleRequestNew = async () => {
    if (await run(() => requestNewEmailRequest(changeEmailToken, newEmail.trim())))
      setStage("otpNew");
  };

  // B4 — xác thực OTP email mới. BE cấp lại token vì access token mang claim email.
  const handleConfirm = async () => {
    setBusy(true);
    try {
      const res = await confirmNewEmailRequest(changeEmailToken, newOtp.trim());
      if (!res.isSuccess || !res.data) {
        toast.error(res.message || t("profile_info.email_change.errors.otp"));
        return;
      }
      const { accessToken, refreshToken, user } = res.data;
      setSession(accessToken, refreshToken, user);
      dispatch(setCredentials({ token: accessToken, refreshToken, user }));
      toast.success(res.message || t("profile_info.email_change.success"));
      reset();
      onChanged();
    } catch {
      toast.error(t("profile_info.email_change.errors.otp"));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-gray-700">
        {t("profile_info.fields.email")}
      </label>

      <div className="flex gap-2">
        <input
          type="email"
          value={stage === "newEmail" || stage === "otpNew" ? newEmail : currentEmail}
          onChange={(e) => setNewEmail(e.target.value)}
          // Chỉ mở khóa sau khi đã xác thực OTP của email cũ.
          disabled={stage !== "newEmail"}
          placeholder={stage === "newEmail" ? t("profile_info.email_change.new_placeholder") : ""}
          className="block w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm text-gray-900 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/20 disabled:cursor-not-allowed disabled:bg-gray-50 disabled:opacity-70"
        />

        {stage === "idle" ? (
          <button
            type="button"
            onClick={handleStart}
            disabled={busy}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-50 cursor-pointer"
          >
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Pencil className="h-4 w-4" />}
            {t("profile_info.email_change.actions.edit")}
          </button>
        ) : (
          <button
            type="button"
            onClick={reset}
            disabled={busy}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-semibold text-gray-500 transition-colors hover:bg-gray-50 disabled:opacity-50 cursor-pointer"
          >
            <X className="h-4 w-4" />
            {t("profile_info.email_change.actions.cancel")}
          </button>
        )}
      </div>

      {stage === "otpCurrent" && (
        <OtpStep
          hint={t("profile_info.email_change.hints.otp_current", { email: currentEmail })}
          value={currentOtp}
          onChange={setCurrentOtp}
          onSubmit={handleVerifyCurrent}
          busy={busy}
          submitLabel={t("profile_info.email_change.actions.verify")}
        />
      )}

      {stage === "newEmail" && (
        <div className="mt-2">
          <p className="mb-2 flex items-center gap-1.5 text-xs text-gray-500">
            <Mail className="h-3.5 w-3.5" />
            {t("profile_info.email_change.hints.enter_new")}
          </p>
          <button
            type="button"
            onClick={handleRequestNew}
            disabled={busy || !newEmail.trim()}
            className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary-dark disabled:opacity-50 cursor-pointer"
          >
            {busy && <Loader2 className="h-4 w-4 animate-spin" />}
            {t("profile_info.email_change.actions.send_otp_new")}
          </button>
        </div>
      )}

      {stage === "otpNew" && (
        <OtpStep
          hint={t("profile_info.email_change.hints.otp_new", { email: newEmail })}
          value={newOtp}
          onChange={setNewOtp}
          onSubmit={handleConfirm}
          busy={busy}
          submitLabel={t("profile_info.email_change.actions.confirm")}
        />
      )}
    </div>
  );
}

interface OtpStepProps {
  hint: string;
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  busy: boolean;
  submitLabel: string;
}

/** Ô nhập OTP 6 số dùng chung cho cả hai chặng xác thực. */
function OtpStep({ hint, value, onChange, onSubmit, busy, submitLabel }: OtpStepProps) {
  return (
    <div className="mt-2">
      <p className="mb-2 flex items-center gap-1.5 text-xs text-gray-500">
        <Mail className="h-3.5 w-3.5" />
        {hint}
      </p>
      <div className="flex gap-2">
        <input
          type="text"
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={6}
          value={value}
          onChange={(e) => onChange(e.target.value.replace(/\D/g, ""))}
          placeholder="••••••"
          className="block w-40 rounded-lg border border-gray-300 px-4 py-2 text-center text-sm tracking-[0.3em] text-gray-900 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/20"
        />
        <button
          type="button"
          onClick={onSubmit}
          disabled={busy || value.length < 6}
          className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary-dark disabled:opacity-50 cursor-pointer"
        >
          {busy && <Loader2 className="h-4 w-4 animate-spin" />}
          {submitLabel}
        </button>
      </div>
    </div>
  );
}
