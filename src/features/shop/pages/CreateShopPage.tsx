import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Store, Phone, Clock, FileText, Loader2, Sparkles, Check } from "lucide-react";
import { createShopRequest } from "@/features/shop/api/shop.api";
import { createShopSchema, type CreateShopFormValues } from "@/features/shop/schemas/shop-schema";
import { refreshTokenRequest } from "@/features/auth/api/auth.api";
import { useAuthSession } from "@/features/auth/hooks/useAuthSession";
import { getRefreshToken } from "@/utils";

const PERKS = [
  "Tự quản lý cửa hàng, sản phẩm và giá",
  "Nhận và xử lý đơn giao của shop",
  "Khai báo phong thủy để sản phẩm được AI gợi ý",
];

export default function CreateShopPage() {
  const navigate = useNavigate();
  const { persistSession } = useAuthSession();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CreateShopFormValues>({
    resolver: zodResolver(createShopSchema),
    defaultValues: { name: "", hotline: "", description: "", openingHours: "" },
  });

  // Sau khi mở shop, user được BE cấp role GardenOwner. Làm mới phiên để token/menu phản ánh ngay
  // (best-effort — lỗi cũng không chặn điều hướng, lần refresh sau sẽ tự cập nhật).
  const refreshSession = async () => {
    try {
      const refreshToken = getRefreshToken();
      if (!refreshToken) return;
      const refreshed = await refreshTokenRequest({ refreshToken });
      if (refreshed.isSuccess && refreshed.data) persistSession(refreshed.data);
    } catch (err) {
      console.error("Refresh session after shop creation failed", err);
    }
  };

  const onSubmit = async (values: CreateShopFormValues) => {
    try {
      const res = await createShopRequest({
        name: values.name,
        hotline: values.hotline,
        description: values.description || "",
        openingHours: values.openingHours || "",
      });

      if (!res.isSuccess || !res.data) {
        toast.error(res.message || "Không thể tạo cửa hàng. Vui lòng thử lại.");
        return;
      }

      toast.success("Tạo cửa hàng thành công! Bạn đã trở thành người bán.");
      await refreshSession();
      navigate("/seller");
    } catch (err) {
      console.error(err);
      toast.error("Đã xảy ra lỗi hệ thống. Vui lòng thử lại.");
    }
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <div className="grid items-start gap-8 lg:grid-cols-[1fr_320px]">
        {/* ── Form ───────────────────────────────────────────────── */}
        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm sm:p-8">
          <div className="mb-6 flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Store size={22} />
            </span>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-gray-900">Mở cửa hàng</h1>
              <p className="text-sm text-gray-500">
                Tạo gian hàng phong thủy của riêng bạn chỉ trong một bước.
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
            {/* Tên cửa hàng */}
            <div>
              <label htmlFor="name" className="mb-1.5 block text-sm font-semibold text-gray-700">
                Tên cửa hàng <span className="text-red-500">*</span>
              </label>
              <input
                id="name"
                type="text"
                placeholder="VD: Vườn Phong Thủy An Nhiên"
                className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                {...register("name")}
              />
              {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name.message}</p>}
            </div>

            {/* Hotline */}
            <div>
              <label htmlFor="hotline" className="mb-1.5 block text-sm font-semibold text-gray-700">
                Hotline <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Phone
                  size={16}
                  className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
                />
                <input
                  id="hotline"
                  type="text"
                  placeholder="VD: 1900 1234 hoặc 0901234567"
                  className="w-full rounded-xl border border-gray-200 py-2.5 pl-10 pr-4 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                  {...register("hotline")}
                />
              </div>
              {errors.hotline && (
                <p className="mt-1 text-xs text-red-500">{errors.hotline.message}</p>
              )}
            </div>

            {/* Giờ mở cửa */}
            <div>
              <label
                htmlFor="openingHours"
                className="mb-1.5 block text-sm font-semibold text-gray-700"
              >
                Giờ mở cửa
              </label>
              <div className="relative">
                <Clock
                  size={16}
                  className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
                />
                <input
                  id="openingHours"
                  type="text"
                  placeholder="VD: 08:00 - 21:00"
                  className="w-full rounded-xl border border-gray-200 py-2.5 pl-10 pr-4 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                  {...register("openingHours")}
                />
              </div>
              {errors.openingHours && (
                <p className="mt-1 text-xs text-red-500">{errors.openingHours.message}</p>
              )}
            </div>

            {/* Mô tả */}
            <div>
              <label
                htmlFor="description"
                className="mb-1.5 block text-sm font-semibold text-gray-700"
              >
                Mô tả
              </label>
              <div className="relative">
                <FileText size={16} className="absolute left-3.5 top-3 text-gray-400" />
                <textarea
                  id="description"
                  rows={4}
                  placeholder="Giới thiệu ngắn về cửa hàng, sản phẩm chủ lực…"
                  className="w-full resize-none rounded-xl border border-gray-200 py-2.5 pl-10 pr-4 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                  {...register("description")}
                />
              </div>
              {errors.description && (
                <p className="mt-1 text-xs text-red-500">{errors.description.message}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-white shadow-md transition-all hover:bg-primary-dark active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Đang tạo cửa hàng…
                </>
              ) : (
                <>
                  <Store size={16} />
                  Mở cửa hàng
                </>
              )}
            </button>

            <p className="text-xs text-gray-400">
              Địa chỉ giao nhận có thể thêm sau trong phần quản lý cửa hàng.
            </p>
          </form>
        </div>

        {/* ── Quyền lợi ──────────────────────────────────────────── */}
        <aside className="rounded-2xl border border-primary/15 bg-primary/5 p-6">
          <div className="mb-3 flex items-center gap-2 text-primary">
            <Sparkles size={18} />
            <h2 className="text-sm font-bold">Khi trở thành người bán</h2>
          </div>
          <ul className="space-y-3">
            {PERKS.map((perk) => (
              <li key={perk} className="flex items-start gap-2.5 text-sm text-gray-600">
                <Check size={16} className="mt-0.5 shrink-0 text-primary" />
                <span>{perk}</span>
              </li>
            ))}
          </ul>
          <p className="mt-5 border-t border-primary/15 pt-4 text-xs text-gray-500">
            Tài khoản của bạn vẫn dùng để mua sắm như bình thường — chỉ được bổ sung thêm kênh người
            bán.
          </p>
        </aside>
      </div>
    </div>
  );
}
