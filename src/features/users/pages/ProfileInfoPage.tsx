import { useEffect, useState } from "react";
import { useAppDispatch, useAppSelector } from "@/app/store";
import { logout } from "@/features/auth/store/authSlice";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import {
  logoutRequest,
  myProfileRequest,
  updateBirthTimeRequest,
  updateProfileRequest,
} from "@/features/auth/api/auth.api";
import type { UpdateProfilePayload } from "@/features/auth/types/auth";
import { clearSession } from "@/utils";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import Modal from "@/components/ui/Modal";
import ChangeEmailFlow from "../components/ChangeEmailFlow";

type GenderValue = UpdateProfilePayload["gender"];

interface ProfileForm {
  fullName: string;
  phone: string;
  gender: GenderValue;
  /** "YYYY-MM-DD" cho <input type="date">; rỗng = chưa khai. */
  dateOfBirth: string;
}

const EMPTY_FORM: ProfileForm = { fullName: "", phone: "", gender: "Unspecified", dateOfBirth: "" };

export default function ProfileInfoPage() {
  const { t } = useTranslation();
  const user = useAppSelector((state) => state.auth.user);
  const { refreshToken } = useAppSelector((state) => state.auth);
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const { data: profileResponse, isLoading } = useQuery({
    queryKey: ["myProfile"],
    queryFn: myProfileRequest,
  });

  const profile = profileResponse?.data || user;
  const queryClient = useQueryClient();

  // Giờ sinh — lưu riêng qua endpoint có sẵn (PUT /Auth/me/birth-time), không đi cùng form chính.
  const [birthTime, setBirthTime] = useState("");
  const [savingBirthTime, setSavingBirthTime] = useState(false);
  const savedBirthTime =
    profileResponse?.data && "birthTime" in profileResponse.data
      ? (profileResponse.data.birthTime?.slice(0, 5) ?? "")
      : "";

  const [form, setForm] = useState<ProfileForm>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  // Đổi ngày sinh làm engine tính lại mệnh Nạp Âm/cung Kua → hỏi lại trước khi lưu.
  const [dobWarningOpen, setDobWarningOpen] = useState(false);

  const savedForm: ProfileForm = {
    fullName: profile?.fullName ?? "",
    phone: profile?.phone ?? "",
    gender: (profile?.gender as GenderValue) || "Unspecified",
    dateOfBirth: profile?.dateOfBirth ? profile.dateOfBirth.slice(0, 10) : "",
  };

  useEffect(() => {
    setBirthTime(savedBirthTime);
  }, [savedBirthTime]);

  // Đồng bộ form với hồ sơ mỗi khi dữ liệu server đổi (lần tải đầu, sau khi lưu, sau khi đổi email).
  useEffect(() => {
    setForm({
      fullName: profile?.fullName ?? "",
      phone: profile?.phone ?? "",
      gender: (profile?.gender as GenderValue) || "Unspecified",
      dateOfBirth: profile?.dateOfBirth ? profile.dateOfBirth.slice(0, 10) : "",
    });
  }, [profile?.fullName, profile?.phone, profile?.gender, profile?.dateOfBirth]);

  const isDirty = (Object.keys(savedForm) as (keyof ProfileForm)[]).some(
    (key) => form[key] !== savedForm[key],
  );
  const dobChanged = form.dateOfBirth !== savedForm.dateOfBirth;

  const handleSaveBirthTime = async () => {
    setSavingBirthTime(true);
    try {
      const res = await updateBirthTimeRequest(birthTime || null);
      if (res.isSuccess) {
        toast.success(res.message || t("profile_info.toast.birth_time_success"));
        queryClient.invalidateQueries({ queryKey: ["myProfile"] });
      } else {
        toast.error(res.message || t("profile_info.toast.birth_time_error"));
      }
    } catch {
      toast.error(t("profile_info.toast.birth_time_error"));
    } finally {
      setSavingBirthTime(false);
    }
  };

  const submitProfile = async () => {
    setSaving(true);
    try {
      const res = await updateProfileRequest({
        fullName: form.fullName.trim(),
        phone: form.phone.trim() || null,
        gender: form.gender,
        dateOfBirth: form.dateOfBirth || null,
      });
      if (res.isSuccess) {
        toast.success(res.message || t("profile_info.toast.update_success"));
        queryClient.invalidateQueries({ queryKey: ["myProfile"] });
      } else {
        toast.error(res.message || t("profile_info.toast.update_error"));
      }
    } catch {
      toast.error(t("profile_info.toast.update_error"));
    } finally {
      setSaving(false);
      setDobWarningOpen(false);
    }
  };

  const handleUpdate = () => {
    if (!form.fullName.trim()) {
      toast.error(t("profile_info.errors.fullname_required"));
      return;
    }
    if (dobChanged) {
      setDobWarningOpen(true);
      return;
    }
    void submitProfile();
  };

  const handleLogout = async () => {
    try {
      if (refreshToken) {
        await logoutRequest({ refreshToken });
      }
    } catch (error) {
      console.error("Logout error", error);
    } finally {
      clearSession();
      dispatch(logout());
      toast.success(t("profile_info.toast.logout_success"));
      navigate("/");
    }
  };

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  if (isLoading) {
    return <div className="w-full animate-pulse space-y-6">{t("profile_info.loading")}</div>;
  }

  if (!profile) return null;

  const inputClass =
    "block w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm text-gray-900 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/20";

  return (
    <div className="w-full">
      <div className="mb-6">
        <h1 className="text-xl font-bold tracking-tight text-gray-900">{t("profile_info.title")}</h1>
        <p className="mt-0.5 text-sm text-gray-500">{t("profile_info.subtitle")}</p>
      </div>

      <div className="space-y-6">
        <div className="flex items-center gap-6 pb-6 border-b border-gray-100">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 text-primary text-2xl font-bold">
            {profile.fullName ? profile.fullName.charAt(0).toUpperCase() : "U"}
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              {profile.fullName || t("profile_info.default_user")}
            </h2>
            <p className="text-sm text-gray-500">
              {profile.role === "Customer"
                ? t("profile_info.roles.customer")
                : t("profile_info.roles.staff")}
            </p>
          </div>
        </div>

        <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">
              {t("profile_info.fields.fullname")}
            </label>
            <input
              type="text"
              value={form.fullName}
              onChange={(e) => setForm((f) => ({ ...f, fullName: e.target.value }))}
              className={inputClass}
            />
          </div>

          <ChangeEmailFlow
            currentEmail={profile.email || ""}
            onChanged={() => queryClient.invalidateQueries({ queryKey: ["myProfile"] })}
          />

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                {t("profile_info.fields.phone")}
              </label>
              <input
                type="tel"
                inputMode="numeric"
                maxLength={10}
                value={form.phone}
                onChange={(e) =>
                  setForm((f) => ({ ...f, phone: e.target.value.replace(/\D/g, "") }))
                }
                placeholder={t("profile_info.placeholders.phone")}
                className={inputClass}
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                {t("profile_info.fields.gender")}
              </label>
              <select
                value={form.gender}
                onChange={(e) => setForm((f) => ({ ...f, gender: e.target.value as GenderValue }))}
                className={`${inputClass} cursor-pointer`}
              >
                <option value="Unspecified">{t("profile_info.values.not_updated")}</option>
                <option value="Male">{t("profile_info.values.male")}</option>
                <option value="Female">{t("profile_info.values.female")}</option>
                <option value="Other">{t("profile_info.values.other")}</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                {t("profile_info.fields.dob")}
              </label>
              <input
                type="date"
                max={new Date().toISOString().slice(0, 10)}
                value={form.dateOfBirth}
                onChange={(e) => setForm((f) => ({ ...f, dateOfBirth: e.target.value }))}
                className={inputClass}
              />
            </div>
            <div>
              {/* Mệnh là giá trị phái sinh do BE tính từ ngày sinh + giới tính — luôn chỉ đọc. */}
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                {t("profile_info.fields.element")}
              </label>
              <input
                type="text"
                disabled
                value={
                  profile.fengShui?.element === "Kim"
                    ? t("profile_info.values.metal")
                    : profile.fengShui?.element === "Moc"
                      ? t("profile_info.values.wood")
                      : profile.fengShui?.element === "Thuy"
                        ? t("profile_info.values.water")
                        : profile.fengShui?.element === "Hoa"
                          ? t("profile_info.values.fire")
                          : profile.fengShui?.element === "Tho"
                            ? t("profile_info.values.earth")
                            : t("profile_info.values.not_updated")
                }
                className="block w-full cursor-not-allowed rounded-lg border border-gray-300 bg-gray-50 px-4 py-2.5 text-sm text-gray-900 opacity-70"
              />
            </div>
          </div>

          {/* Giờ sinh — lưu riêng: trợ lý AI dùng để luận đủ Tứ Trụ/Bát Tự */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">
              {t("profile_info.fields.birth_time")}{" "}
              <span className="font-normal text-gray-400">
                {t("profile_info.fields.optional")}
              </span>
            </label>
            <div className="flex gap-2">
              <input
                type="time"
                value={birthTime}
                onChange={(e) => setBirthTime(e.target.value)}
                disabled={savingBirthTime}
                className={`${inputClass} bg-white`}
              />
              <button
                type="button"
                onClick={handleSaveBirthTime}
                disabled={savingBirthTime || birthTime === savedBirthTime}
                className="shrink-0 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-dark disabled:opacity-50 cursor-pointer"
              >
                {savingBirthTime
                  ? t("profile_info.actions.saving")
                  : t("profile_info.actions.save")}
              </button>
            </div>
            <p className="mt-1 text-xs text-gray-400">{t("profile_info.hints.birth_time")}</p>
          </div>

          <div className="pt-4 flex gap-3">
            <button
              type="button"
              onClick={handleUpdate}
              disabled={saving || !isDirty}
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary-dark disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              {t("profile_info.actions.update")}
            </button>
            <button
              type="button"
              onClick={handleLogout}
              className="rounded-lg bg-red-500 px-5 py-2.5 text-sm font-medium text-white hover:bg-red-600 transition-colors cursor-pointer"
            >
              {t("profile_info.actions.logout")}
            </button>
          </div>
        </form>
      </div>

      <Modal
        open={dobWarningOpen}
        title={t("profile_info.dob_warning.title")}
        onClose={() => setDobWarningOpen(false)}
      >
        <div className="flex flex-col gap-4">
          <p className="text-sm text-gray-600">{t("profile_info.dob_warning.body")}</p>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setDobWarningOpen(false)}
              disabled={saving}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 cursor-pointer"
            >
              {t("profile_info.dob_warning.cancel")}
            </button>
            <button
              type="button"
              onClick={() => void submitProfile()}
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-dark disabled:opacity-50 cursor-pointer"
            >
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              {t("profile_info.dob_warning.confirm")}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
