import { useState } from "react";
import { Loader2, Mail, Lock, X } from "lucide-react";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import {
  forgotPasswordRequest,
  verifyForgotPasswordRequest,
  resetForgotPasswordRequest,
} from "@/features/auth/api/auth.api";

type Stage = "idle" | "otp" | "newPassword";

interface ChangePasswordFlowProps {
  currentEmail: string;
}

export default function ChangePasswordFlow({ currentEmail }: ChangePasswordFlowProps) {
  const { t } = useTranslation();
  const [stage, setStage] = useState<Stage>("idle");
  const [busy, setBusy] = useState(false);
  const [otp, setOtp] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const reset = () => {
    setStage("idle");
    setOtp("");
    setResetToken("");
    setNewPassword("");
    setConfirmPassword("");
    setShowPassword(false);
  };

  const handleStart = async () => {
    setBusy(true);
    try {
      const res = await forgotPasswordRequest({ email: currentEmail });
      if ((res as any).isSuccess === false) {
        toast.error((res as any).message || t("profile_info.email_change.errors.generic"));
        return;
      }
      toast.success(t("profile_info.email_change.hints.otp_current", { email: currentEmail }));
      setStage("otp");
    } catch {
      toast.error(t("profile_info.email_change.errors.generic"));
    } finally {
      setBusy(false);
    }
  };

  const handleVerifyOtp = async () => {
    setBusy(true);
    try {
      const res = await verifyForgotPasswordRequest({ email: currentEmail, otp });
      if (!res.isSuccess || !res.data?.resetPasswordToken) {
        toast.error(res.message || t("profile_info.email_change.errors.otp"));
        return;
      }
      setResetToken(res.data.resetPasswordToken);
      setStage("newPassword");
    } catch {
      toast.error(t("profile_info.email_change.errors.otp"));
    } finally {
      setBusy(false);
    }
  };

  const handleResetPassword = async () => {
    if (newPassword.length < 5) {
      toast.error("Mật khẩu tối thiểu 5 ký tự");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("Mật khẩu xác nhận không khớp");
      return;
    }

    setBusy(true);
    try {
      const res = await resetForgotPasswordRequest({
        resetPasswordToken: resetToken,
        newPassword,
      });
      if ((res as any).isSuccess === false) {
        toast.error((res as any).message || t("profile_info.email_change.errors.generic"));
        return;
      }
      toast.success("Đổi mật khẩu thành công");
      reset();
    } catch {
      toast.error(t("profile_info.email_change.errors.generic"));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-gray-700">Mật khẩu</label>

      <div className="flex gap-2">
        <input
          type="password"
          value="********"
          disabled
          className="block w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm text-gray-900 bg-gray-50 opacity-70"
        />

        {stage === "idle" ? (
          <button
            type="button"
            onClick={handleStart}
            disabled={busy}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-50 cursor-pointer"
          >
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Lock className="h-4 w-4" />}
            Đổi mật khẩu
          </button>
        ) : (
          <button
            type="button"
            onClick={reset}
            disabled={busy}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-semibold text-gray-500 transition-colors hover:bg-gray-50 disabled:opacity-50 cursor-pointer"
          >
            <X className="h-4 w-4" />
            Hủy
          </button>
        )}
      </div>

      {stage === "otp" && (
        <div className="mt-2">
          <p className="mb-2 flex items-center gap-1.5 text-xs text-gray-500">
            <Mail className="h-3.5 w-3.5" />
            {t("profile_info.email_change.hints.otp_current", { email: currentEmail })}
          </p>
          <div className="flex gap-2">
            <input
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
              placeholder="••••••"
              className="block w-40 rounded-lg border border-gray-300 px-4 py-2 text-center text-sm tracking-[0.3em] text-gray-900 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/20"
            />
            <button
              type="button"
              onClick={handleVerifyOtp}
              disabled={busy || otp.length < 6}
              className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary-dark disabled:opacity-50 cursor-pointer"
            >
              {busy && <Loader2 className="h-4 w-4 animate-spin" />}
              {t("profile_info.email_change.actions.verify")}
            </button>
          </div>
        </div>
      )}

      {stage === "newPassword" && (
        <div className="mt-4 space-y-3 rounded-lg border border-gray-200 p-4 bg-gray-50/50">
          <p className="text-sm font-medium text-gray-900">Nhập mật khẩu mới</p>
          
          <div>
            <input
              type={showPassword ? "text" : "password"}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Mật khẩu mới (tối thiểu 5 ký tự)"
              className="block w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm text-gray-900 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/20"
            />
          </div>
          
          <div>
            <input
              type={showPassword ? "text" : "password"}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Xác nhận mật khẩu mới"
              className="block w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm text-gray-900 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/20"
            />
          </div>

          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
              <input
                type="checkbox"
                checked={showPassword}
                onChange={(e) => setShowPassword(e.target.checked)}
                className="rounded border-gray-300 text-primary focus:ring-primary"
              />
              Hiển thị mật khẩu
            </label>
            <button
              type="button"
              onClick={handleResetPassword}
              disabled={busy || !newPassword || !confirmPassword}
              className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary-dark disabled:opacity-50 cursor-pointer"
            >
              {busy && <Loader2 className="h-4 w-4 animate-spin" />}
              Đổi mật khẩu
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
