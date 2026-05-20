import { toast } from "sonner";

function fakeRequest(ok: boolean) {
  return new Promise<{ name: string }>((resolve, reject) => {
    setTimeout(() => {
      if (ok) resolve({ name: "Đơn hàng #1024" });
      else reject(new Error("Mạng không ổn định"));
    }, 1500);
  });
}

export default function ToastExample() {
  return (
    <section
      className="mt-6 rounded-xl border border-neutral-200 bg-neutral-50/90 p-4 sm:p-5"
      aria-labelledby="toast-example-heading"
    >
      <h2
        id="toast-example-heading"
        className="mb-3 text-sm font-semibold tracking-tight text-neutral-900"
      >
        Sonner — ví dụ toast
      </h2>
      <p className="mb-4 text-xs text-neutral-600">
        Gọi <code className="rounded bg-neutral-200/80 px-1 py-0.5 font-mono text-[11px]">toast()</code> từ bất kỳ component nào sau khi đã có{" "}
        <code className="rounded bg-neutral-200/80 px-1 py-0.5 font-mono text-[11px]">&lt;Toaster /&gt;</code> trong layout.
      </p>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          className="rounded-lg border border-neutral-300 bg-white px-3 py-1.5 text-xs font-medium text-neutral-800 shadow-sm transition hover:bg-neutral-50"
          onClick={() => toast("Thông báo mặc định")}
        >
          Mặc định
        </button>
        <button
          type="button"
          className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-900 transition hover:bg-emerald-100/80"
          onClick={() => toast.success("Đã lưu cài đặt")}
        >
          success
        </button>
        <button
          type="button"
          className="rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-medium text-red-900 transition hover:bg-red-100/80"
          onClick={() => toast.error("Không thể tải dữ liệu")}
        >
          error
        </button>
        <button
          type="button"
          className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-medium text-amber-950 transition hover:bg-amber-100/80"
          onClick={() =>
            toast.warning("Giỏ hàng sắp hết hạn sau 15 phút", {
              description: "Hoàn tất thanh toán để giữ sản phẩm.",
            })
          }
        >
          warning + mô tả
        </button>
        <button
          type="button"
          className="rounded-lg border border-sky-200 bg-sky-50 px-3 py-1.5 text-xs font-medium text-sky-950 transition hover:bg-sky-100/80"
          onClick={() =>
            toast.info("Bạn có 2 tin nhắn mới", {
              action: {
                label: "Xem",
                onClick: () => toast.message("Đã mở hộp thư (ví dụ)"),
              },
            })
          }
        >
          info + action
        </button>
        <button
          type="button"
          className="rounded-lg border border-violet-200 bg-violet-50 px-3 py-1.5 text-xs font-medium text-violet-950 transition hover:bg-violet-100/80"
          onClick={() =>
            toast.promise(fakeRequest(true), {
              loading: "Đang xử lý đơn hàng…",
              success: (data) => `${data.name} đã xác nhận`,
              error: (err) => (err instanceof Error ? err.message : "Thất bại"),
            })
          }
        >
          promise (thành công)
        </button>
        <button
          type="button"
          className="rounded-lg border border-neutral-400 bg-neutral-200/60 px-3 py-1.5 text-xs font-medium text-neutral-900 transition hover:bg-neutral-300/60"
          onClick={() =>
            toast.promise(fakeRequest(false), {
              loading: "Đang thử lại…",
              success: "Xong",
              error: (err) => (err instanceof Error ? err.message : "Lỗi"),
            })
          }
        >
          promise (lỗi)
        </button>
      </div>
    </section>
  );
}
