import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Search, TriangleAlert } from "lucide-react";
import {
  useDeleteElementInputTag,
  useElementInputTags,
  useUpdateElementInputTag,
} from "../hooks/useElementInputTags";
import ElementInputTagRow from "../components/ElementInputTagRow";
import {
  ALL_KINDS,
  ELEMENT_KIND_LABEL,
  VISIBILITY_LABEL,
  isTotalWeightNormal,
  type ElementInputKind,
  type ElementInputTag,
  type ElementInputTagFilters,
  type UpdateElementInputTagPayload,
} from "../types/elementInputTag";

type SourceFilter = "all" | "pending" | "personal" | "public" | "userCreated";

const SOURCE_FILTERS: { value: SourceFilter; label: string }[] = [
  { value: "all", label: "Tất cả" },
  { value: "pending", label: "Chờ duyệt" },
  { value: "personal", label: "Cá nhân" },
  { value: "public", label: "Công cộng" },
  { value: "userCreated", label: "Do user tạo" },
];

/** Bộ lọc UI → query param của BE (visibility / isUserCreated). */
function toQueryFilters(source: SourceFilter): ElementInputTagFilters {
  switch (source) {
    case "pending":
      return { visibility: "Pending" };
    case "personal":
      return { visibility: "Personal" };
    case "public":
      return { visibility: "Public" };
    case "userCreated":
      return { isUserCreated: true };
    default:
      return {};
  }
}

/**
 * Quản lý tag ngũ hành (`element_input_map`) — nguồn dữ liệu quyết định vector "hiện trạng phòng"
 * và cũng là từ vựng mà AI intake dùng để map mô tả của user.
 *
 * Sửa `labelVi` đổi ngay chữ user thấy ở picker, tooltip radar và 3 dòng nhận định.
 * Sửa `weight` đổi cách tag đó kéo đồ thị ngũ hành — nên có cảnh báo khi Σ ≠ 1.
 */
export default function AdminElementTagsPage() {
  const [kind, setKind] = useState<ElementInputKind | "">("");
  const [source, setSource] = useState<SourceFilter>("all");
  const [search, setSearch] = useState("");

  const filters = useMemo(
    () => ({ ...(kind ? { kind } : {}), ...toQueryFilters(source) }),
    [kind, source],
  );

  const { data: tags, isLoading, isError } = useElementInputTags(filters);
  const updateTag = useUpdateElementInputTag();
  const deleteTag = useDeleteElementInputTag();

  // Tìm kiếm lọc phía client — danh sách tag chỉ vài trăm dòng, không cần thêm round-trip.
  const visible = useMemo(() => {
    const needle = search.trim().toLowerCase();
    if (!needle) return tags ?? [];
    return (tags ?? []).filter(
      (t) =>
        t.labelVi.toLowerCase().includes(needle) || t.inputCode.toLowerCase().includes(needle),
    );
  }, [tags, search]);

  const pendingCount = (tags ?? []).filter((t) => t.isPending).length;
  const abnormalCount = (tags ?? []).filter((t) => !isTotalWeightNormal(t.totalWeight)).length;

  const handleSave = (tag: ElementInputTag, payload: UpdateElementInputTagPayload) => {
    updateTag.mutate(
      { kind: tag.inputKind, code: tag.inputCode, payload },
      {
        onSuccess: () =>
          toast.success(
            payload.visibility
              ? `"${tag.labelVi}" → ${VISIBILITY_LABEL[payload.visibility]}.`
              : `Đã cập nhật "${payload.labelVi ?? tag.labelVi}".`,
          ),
        onError: () => toast.error("Không lưu được thay đổi, thử lại sau."),
      },
    );
  };

  const handleDelete = (tag: ElementInputTag) => {
    const ok = window.confirm(
      `Xóa tag "${tag.labelVi}"?\n\n` +
        "Những workspace đang gắn tag này sẽ mất phần đóng góp của nó vào đồ thị ngũ hành " +
        "(không báo lỗi, chỉ lặng lẽ biến mất). Cân nhắc chuyển sang Cá nhân thay vì xóa.",
    );
    if (!ok) return;

    deleteTag.mutate(
      { kind: tag.inputKind, code: tag.inputCode },
      {
        onSuccess: () => toast.success(`Đã xóa "${tag.labelVi}".`),
        onError: () => toast.error("Không xóa được tag."),
      },
    );
  };

  return (
    <div className="p-6">
      <div className="mb-1 flex flex-wrap items-center gap-3">
        <h1 className="text-xl font-bold text-gray-900">Tag ngũ hành</h1>
        {pendingCount > 0 && (
          <button
            type="button"
            onClick={() => setSource("pending")}
            className="cursor-pointer rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-medium text-amber-700 hover:bg-amber-100"
          >
            {pendingCount} tag chờ duyệt
          </button>
        )}
        {abnormalCount > 0 && (
          <span className="flex items-center gap-1 rounded-full bg-gray-100 px-2.5 py-0.5 text-xs text-gray-600">
            <TriangleAlert size={12} className="text-amber-500" />
            {abnormalCount} tag có Σ weight ≠ 1
          </span>
        )}
      </div>
      <p className="mb-5 max-w-3xl text-sm text-gray-500">
        Từ vựng quyết định vector <strong>hiện trạng phòng</strong> và cũng là danh sách mã mà AI
        intake được phép dùng. <strong>Nhãn tiếng Việt</strong> là chữ user nhìn thấy ở picker,
        tooltip biểu đồ radar và 3 dòng nhận định. <strong>Weight</strong> là số "phiếu" tag bỏ vào
        đồ thị — tổng chuẩn là <code className="rounded bg-gray-100 px-1">1.0</code>.
      </p>

      {/* Bộ lọc */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="relative">
          <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm theo nhãn hoặc mã..."
            className="w-60 rounded-md border border-gray-300 py-1.5 pl-8 pr-3 text-sm focus:border-primary focus:outline-none"
          />
        </div>

        <select
          value={kind}
          onChange={(e) => setKind(e.target.value as ElementInputKind | "")}
          className="cursor-pointer rounded-md border border-gray-300 px-2 py-1.5 text-sm focus:border-primary focus:outline-none"
        >
          <option value="">Mọi nhóm</option>
          {ALL_KINDS.map((k) => (
            <option key={k} value={k}>
              {ELEMENT_KIND_LABEL[k]}
            </option>
          ))}
        </select>

        <div className="flex items-center gap-1">
          {SOURCE_FILTERS.map((f) => (
            <button
              key={f.value}
              type="button"
              onClick={() => setSource(f.value)}
              className={`cursor-pointer rounded-full border px-2.5 py-1 text-xs transition-colors ${
                source === f.value
                  ? "border-primary bg-primary/15 font-medium text-primary"
                  : "border-gray-300 text-gray-600 hover:border-primary/60"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        <span className="ml-auto text-xs text-gray-400">{visible.length} tag</span>
      </div>

      {/* Bảng */}
      <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
        <table className="w-full min-w-[880px] text-left">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50 text-xs font-medium text-gray-500">
              <th className="px-3 py-2">Nhóm</th>
              <th className="px-3 py-2">Nhãn hiển thị / Mã</th>
              <th className="px-3 py-2">Phân bổ hành (weight)</th>
              <th className="px-3 py-2">Σ</th>
              <th className="px-3 py-2">Nguồn</th>
              <th className="px-3 py-2 text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr>
                <td colSpan={6} className="px-3 py-10 text-center text-sm text-gray-400">
                  Đang tải...
                </td>
              </tr>
            )}
            {isError && (
              <tr>
                <td colSpan={6} className="px-3 py-10 text-center text-sm text-red-600">
                  Không tải được danh sách tag.
                </td>
              </tr>
            )}
            {!isLoading && !isError && visible.length === 0 && (
              <tr>
                <td colSpan={6} className="px-3 py-10 text-center text-sm text-gray-400">
                  Không có tag nào khớp bộ lọc.
                </td>
              </tr>
            )}
            {visible.map((tag) => (
              <ElementInputTagRow
                key={`${tag.inputKind}-${tag.inputCode}`}
                tag={tag}
                saving={updateTag.isPending || deleteTag.isPending}
                onSave={(payload) => handleSave(tag, payload)}
                onDelete={() => handleDelete(tag)}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
