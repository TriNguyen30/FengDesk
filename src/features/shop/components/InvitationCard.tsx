import { toast } from "sonner";
import { Check, Loader2, Store as StoreIcon, UserCircle2, X } from "lucide-react";
import {
  useAcceptStoreInvitation,
  useRejectStoreInvitation,
} from "@/features/shop/hooks/useShopStaff";
import type { StoreInvitation } from "@/features/shop/types/shop";
import { useTranslation } from "react-i18next";

interface Props {
  invitation: StoreInvitation;
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

export default function InvitationCard({ invitation }: Props) {
  const { t } = useTranslation();
  const accept = useAcceptStoreInvitation();
  const reject = useRejectStoreInvitation();
  const busy = accept.isPending || reject.isPending;

  const handleAccept = async () => {
    try {
      const res = await accept.mutateAsync(invitation.id);
      if (!res.isSuccess) {
        toast.error(res.message || t("my_invitations.card.toast.accept_error"));
        return;
      }
      toast.success(res.message || t("my_invitations.card.toast.accept_success"));
    } catch (err) {
      console.error(err);
      toast.error(t("my_invitations.card.toast.exception"));
    }
  };

  const handleReject = async () => {
    try {
      const res = await reject.mutateAsync(invitation.id);
      if (!res.isSuccess) {
        toast.error(res.message || t("my_invitations.card.toast.reject_error"));
        return;
      }
      toast.success(res.message || t("my_invitations.card.toast.reject_success"));
    } catch (err) {
      console.error(err);
      toast.error(t("my_invitations.card.toast.exception"));
    }
  };

  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:gap-4">
        <div className="flex min-w-0 flex-1 items-start gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <StoreIcon size={22} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="font-semibold leading-tight text-gray-900">
              {t("my_invitations.card.title")}
            </p>
            <p className="mt-0.5 text-sm text-gray-700">
              <span className="font-semibold">"{invitation.storeName}"</span>
            </p>
            <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-gray-500">
              <span className="inline-flex items-center gap-1">
                <UserCircle2 size={12} className="shrink-0" />
                {t("my_invitations.card.inviter")} {invitation.invitedByName || "—"}
              </span>
              <span aria-hidden>·</span>
              <span>{formatDate(invitation.invitedAt)}</span>
            </p>
            <p className="mt-2 text-xs text-gray-500">
              {t("my_invitations.card.note")}
            </p>
          </div>
        </div>

        <div className="flex shrink-0 flex-row gap-2 sm:flex-col sm:items-stretch sm:justify-center">
          <button
            type="button"
            onClick={handleReject}
            disabled={busy}
            className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60 cursor-pointer"
          >
            {reject.isPending ? <Loader2 size={14} className="animate-spin" /> : <X size={14} />}
            {t("my_invitations.card.reject")}
          </button>
          <button
            type="button"
            onClick={handleAccept}
            disabled={busy}
            className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white shadow-sm transition-all hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-60 cursor-pointer"
          >
            {accept.isPending ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Check size={14} />
            )}
            {t("my_invitations.card.accept")}
          </button>
        </div>
      </div>
    </div>
  );
}
