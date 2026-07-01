import { UserCircle2, Mail, Phone, CalendarClock, Trash2, Clock3, CheckCircle2 } from "lucide-react";
import type { InvitationStatus, StoreStaff } from "@/features/shop/types/shop";

interface Props {
  staff: StoreStaff[];
  onRemove: (s: StoreStaff) => void;
  removingId?: string | null;
}

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

function StatusBadge({
  status,
  isActive,
}: {
  status?: InvitationStatus;
  isActive?: boolean;
}) {
  if (isActive) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
        <CheckCircle2 size={11} />
        Đang làm
      </span>
    );
  }
  if (status === "Pending") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-700">
        <Clock3 size={11} />
        Chờ đồng ý
      </span>
    );
  }
  if (status === "Accepted") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
        <CheckCircle2 size={11} />
        Đang làm
      </span>
    );
  }
  // Rejected / Revoked (thường ẩn khỏi list) — hiển thị xám cho gọn.
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-semibold text-gray-500">
      {status}
    </span>
  );
}

function actionLabel(status?: InvitationStatus, isActive?: boolean): string {
  if (isActive) return "Gỡ";
  return status === "Pending" ? "Huỷ lời mời" : "Gỡ";
}

function getStaffDisplayDate(s: StoreStaff): string {
  return s.assignedAt || s.invitedAt || s.id;
}

export default function StaffTable({ staff, onRemove, removingId }: Props) {
  if (!staff.length) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-200 bg-white px-6 py-14 text-center">
        <UserCircle2 size={36} className="mb-2 text-gray-300" />
        <p className="text-sm font-semibold text-gray-700">Chưa có nhân viên nào</p>
        <p className="mt-1 text-xs text-gray-500">
          Mời người dùng để họ có thể nhận đơn & ship cho cửa hàng.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
      {/* Desktop table */}
      <div className="hidden md:block">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
            <tr>
              <th className="px-4 py-3 font-semibold">Nhân viên</th>
              <th className="px-4 py-3 font-semibold">Liên hệ</th>
              <th className="px-4 py-3 font-semibold">Trạng thái</th>
              <th className="px-4 py-3 font-semibold">Ngày mời</th>
              <th className="px-4 py-3 font-semibold">Người mời</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {staff.map((s) => (
              <tr key={s.id} className="hover:bg-gray-50/60">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary">
                      <UserCircle2 size={20} />
                    </span>
                    <div>
                      <p className="font-semibold text-gray-900">{s.staffName || "—"}</p>
                      <p className="text-xs text-gray-500">{s.staffEmail}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-gray-700">
                  <span className="inline-flex items-center gap-1.5 text-xs">
                    <Phone size={13} className="text-gray-400" />
                    {s.staffPhone || "—"}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <StatusBadge status={s.status} isActive={s.isActive} />
                </td>
                <td className="px-4 py-3 text-xs text-gray-600">
                  {formatDate(getStaffDisplayDate(s))}
                </td>
                <td className="px-4 py-3 text-xs text-gray-600">
                  {s.assignedByName || s.invitedByName || "—"}
                </td>
                <td className="px-4 py-3 text-right">
                  <button
                    onClick={() => onRemove(s)}
                    disabled={removingId === s.id}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-red-600 transition-colors hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <Trash2 size={13} />
                    {actionLabel(s.status, s.isActive)}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <ul className="divide-y divide-gray-100 md:hidden">
        {staff.map((s) => (
          <li key={s.id} className="flex items-start gap-3 px-4 py-3">
            <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
              <UserCircle2 size={20} />
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <p className="truncate font-semibold text-gray-900">{s.staffName || "—"}</p>
                <StatusBadge status={s.status} isActive={s.isActive} />
              </div>
              <p className="mt-0.5 flex items-center gap-1 truncate text-xs text-gray-500">
                <Mail size={12} className="shrink-0" />
                {s.staffEmail}
              </p>
              {s.staffPhone && (
                <p className="mt-0.5 flex items-center gap-1 text-xs text-gray-500">
                  <Phone size={12} className="shrink-0" />
                  {s.staffPhone}
                </p>
              )}
              <p className="mt-1 flex items-center gap-1 text-[11px] text-gray-400">
                <CalendarClock size={11} className="shrink-0" />
                {formatDate(getStaffDisplayDate(s))}
              </p>
            </div>
            <button
              onClick={() => onRemove(s)}
              disabled={removingId === s.id}
              className="shrink-0 rounded-lg border border-red-200 p-2 text-red-600 transition-colors hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
              aria-label={actionLabel(s.status, s.isActive)}
            >
              <Trash2 size={14} />
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
