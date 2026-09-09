import { useEffect, useMemo, useState } from "react";
import { Check, Pencil, Trash2, TriangleAlert, X, Plus } from "lucide-react";
import {
  ALL_ELEMENTS,
  ELEMENT_COLOR,
  ELEMENT_LABEL,
  ELEMENT_KIND_LABEL,
  VISIBILITY_BADGE,
  VISIBILITY_HINT,
  VISIBILITY_LABEL,
  isTotalWeightNormal,
  type ElementInputTag,
  type FengShuiElement,
  type UpdateElementInputTagPayload,
} from "../types/elementInputTag";

interface ElementInputTagRowProps {
  tag: ElementInputTag;
  saving: boolean;
  onSave: (payload: UpdateElementInputTagPayload) => void;
  onDelete: () => void;
}

interface DraftContribution {
  element: FengShuiElement;
  /** Giữ dạng chuỗi để user gõ "0." dở dang mà ô không nhảy số. */
  weight: string;
}

const round3 = (n: number) => Math.round(n * 1000) / 1000;

/**
 * Một dòng tag trong bảng quản trị. Chế độ xem hiển thị nhãn + phân bổ hành; bấm sửa thì mở
 * form inline cho phép đổi nhãn tiếng Việt, chỉnh weight từng hành, thêm/bớt hành.
 *
 * Weight ở đây là "phiếu" tag bỏ vào vector hiện trạng phòng — Σ chuẩn là 1.0, lệch đi thì tag
 * nặng/nhẹ hơn tag khác. Không chặn, chỉ cảnh báo, vì đôi khi admin cố ý làm vậy.
 */
export default function ElementInputTagRow({
  tag,
  saving,
  onSave,
  onDelete,
}: ElementInputTagRowProps) {
  const [editing, setEditing] = useState(false);
  const [label, setLabel] = useState(tag.labelVi);
  const [drafts, setDrafts] = useState<DraftContribution[]>([]);

  // Server trả bản mới sau khi lưu → đồng bộ lại form, tránh hiện giá trị cũ.
  useEffect(() => {
    setLabel(tag.labelVi);
    setDrafts(tag.contributions.map((c) => ({ element: c.element, weight: String(c.weight) })));
  }, [tag]);

  const draftTotal = useMemo(
    () => round3(drafts.reduce((sum, d) => sum + (Number(d.weight) || 0), 0)),
    [drafts],
  );

  const unusedElements = ALL_ELEMENTS.filter((e) => !drafts.some((d) => d.element === e));
  const invalid =
    !label.trim() ||
    drafts.length === 0 ||
    drafts.some((d) => !(Number(d.weight) > 0));

  const startEdit = () => {
    setLabel(tag.labelVi);
    setDrafts(tag.contributions.map((c) => ({ element: c.element, weight: String(c.weight) })));
    setEditing(true);
  };

  const save = () => {
    if (invalid || saving) return;
    onSave({
      labelVi: label.trim(),
      contributions: drafts.map((d) => ({ element: d.element, weight: Number(d.weight) })),
    });
    setEditing(false);
  };

  /** Chia đều 1.0 cho các hành đang có — lối tắt cho trường hợp phổ biến nhất. */
  const normalize = () => {
    if (drafts.length === 0) return;
    const even = round3(1 / drafts.length);
    setDrafts((prev) =>
      prev.map((d, i) =>
        // Dồn sai số làm tròn vào phần tử cuối để Σ đúng bằng 1.
        i === prev.length - 1
          ? { ...d, weight: String(round3(1 - even * (prev.length - 1))) }
          : { ...d, weight: String(even) },
      ),
    );
  };

  return (
    <tr className="border-b border-gray-100 align-top hover:bg-gray-50/60">
      {/* Nhóm */}
      <td className="px-3 py-3 text-xs text-gray-500">{ELEMENT_KIND_LABEL[tag.inputKind]}</td>

      {/* Nhãn + code */}
      <td className="px-3 py-3">
        {editing ? (
          <input
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            maxLength={80}
            autoFocus
            className="w-full rounded-md border border-gray-300 px-2 py-1 text-sm focus:border-primary focus:outline-none"
            placeholder="Nhãn tiếng Việt"
          />
        ) : (
          <span className="text-sm font-medium text-gray-900">{tag.labelVi}</span>
        )}
        <p className="mt-0.5 font-mono text-[11px] text-gray-400">{tag.inputCode}</p>
      </td>

      {/* Phân bổ hành */}
      <td className="px-3 py-3">
        {editing ? (
          <div className="flex flex-col gap-1.5">
            {drafts.map((d, i) => (
              <div key={d.element} className="flex items-center gap-2">
                <span
                  className="w-12 shrink-0 text-xs font-medium"
                  style={{ color: ELEMENT_COLOR[d.element] }}
                >
                  {ELEMENT_LABEL[d.element]}
                </span>
                <input
                  type="number"
                  min={0}
                  max={5}
                  step={0.05}
                  value={d.weight}
                  onChange={(e) =>
                    setDrafts((prev) =>
                      prev.map((x, xi) => (xi === i ? { ...x, weight: e.target.value } : x)),
                    )
                  }
                  className="w-20 rounded-md border border-gray-300 px-2 py-1 text-sm focus:border-primary focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setDrafts((prev) => prev.filter((_, xi) => xi !== i))}
                  className="cursor-pointer text-gray-400 hover:text-red-600"
                  aria-label={`Bỏ hành ${ELEMENT_LABEL[d.element]}`}
                >
                  <X size={13} />
                </button>
              </div>
            ))}

            {unusedElements.length > 0 && (
              <div className="flex flex-wrap items-center gap-1 pt-0.5">
                {unusedElements.map((e) => (
                  <button
                    key={e}
                    type="button"
                    onClick={() => setDrafts((prev) => [...prev, { element: e, weight: "0.5" }])}
                    className="flex cursor-pointer items-center gap-0.5 rounded-full border border-dashed border-gray-300 px-2 py-0.5 text-[11px] text-gray-500 hover:border-primary hover:text-primary"
                  >
                    <Plus size={10} /> {ELEMENT_LABEL[e]}
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-wrap gap-1.5">
            {tag.contributions.map((c) => (
              <span
                key={c.id}
                className="rounded-full px-2 py-0.5 text-[11px] font-medium"
                style={{ background: `${ELEMENT_COLOR[c.element]}20`, color: ELEMENT_COLOR[c.element] }}
              >
                {ELEMENT_LABEL[c.element]} {c.weight}
              </span>
            ))}
          </div>
        )}
      </td>

      {/* Σ weight — cảnh báo khi khác 1.0 */}
      <td className="px-3 py-3">
        {(() => {
          const total = editing ? draftTotal : tag.totalWeight;
          const normal = isTotalWeightNormal(total);
          return (
            <div className="flex items-center gap-1">
              <span
                className={`text-sm tabular-nums ${normal ? "text-gray-700" : "font-semibold text-amber-700"}`}
              >
                {total}
              </span>
              {!normal && (
                <span
                  title="Σ weight khác 1.0 → tag này nặng/nhẹ hơn tag khác khi tính vector phòng"
                  className="text-amber-500"
                >
                  <TriangleAlert size={13} />
                </span>
              )}
              {editing && drafts.length > 0 && !normal && (
                <button
                  type="button"
                  onClick={normalize}
                  className="cursor-pointer text-[11px] text-primary underline"
                >
                  chia đều
                </button>
              )}
            </div>
          );
        })()}
      </td>

      {/* Phạm vi hiển thị + nguồn tạo */}
      <td className="px-3 py-3">
        <span
          className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${VISIBILITY_BADGE[tag.visibility]}`}
          title={VISIBILITY_HINT[tag.visibility]}
        >
          {VISIBILITY_LABEL[tag.visibility]}
        </span>
        <p className="mt-1 text-[11px] text-gray-400">
          {tag.isUserCreated ? "Do user tạo" : "Hệ thống"}
        </p>
      </td>

      {/* Thao tác */}
      <td className="px-3 py-3">
        <div className="flex items-center justify-end gap-1.5">
          {editing ? (
            <>
              <button
                type="button"
                onClick={save}
                disabled={invalid || saving}
                className="flex cursor-pointer items-center gap-1 rounded-md bg-primary px-2 py-1 text-xs text-white disabled:cursor-not-allowed disabled:opacity-40"
              >
                <Check size={12} /> Lưu
              </button>
              <button
                type="button"
                onClick={() => setEditing(false)}
                className="cursor-pointer rounded-md border border-gray-300 px-2 py-1 text-xs text-gray-600 hover:bg-gray-50"
              >
                Hủy
              </button>
            </>
          ) : (
            <>
              {tag.visibility !== "Public" && (
                <button
                  type="button"
                  onClick={() => onSave({ visibility: "Public" })}
                  disabled={saving}
                  className="cursor-pointer rounded-md bg-emerald-600 px-2 py-1 text-xs text-white disabled:opacity-40"
                  title="Công khai: mọi user dùng được tag này"
                >
                  Công khai
                </button>
              )}
              {/* Rời hàng đợi mà KHÔNG công khai — chỗ chứa hành động "đã xem, không duyệt". */}
              {tag.visibility === "Pending" && (
                <button
                  type="button"
                  onClick={() => onSave({ visibility: "Personal" })}
                  disabled={saving}
                  className="cursor-pointer rounded-md border border-sky-300 px-2 py-1 text-xs text-sky-700 hover:bg-sky-50 disabled:opacity-40"
                  title="Đã xem, giữ riêng cho người tạo — tag vẫn dùng được và rời khỏi hàng đợi"
                >
                  Giữ riêng tư
                </button>
              )}
              {tag.visibility === "Public" && tag.isUserCreated && (
                <button
                  type="button"
                  onClick={() => onSave({ visibility: "Personal" })}
                  disabled={saving}
                  className="cursor-pointer rounded-md border border-gray-300 px-2 py-1 text-xs text-gray-600 hover:bg-gray-50 disabled:opacity-40"
                  title="Thu hồi: chỉ người tạo còn thấy tag này"
                >
                  Thu hồi
                </button>
              )}
              <button
                type="button"
                onClick={startEdit}
                className="cursor-pointer rounded-md border border-gray-300 p-1.5 text-gray-600 hover:border-primary hover:text-primary"
                aria-label="Sửa tag"
              >
                <Pencil size={13} />
              </button>
              <button
                type="button"
                onClick={onDelete}
                className="cursor-pointer rounded-md border border-gray-300 p-1.5 text-gray-500 hover:border-red-400 hover:text-red-600"
                aria-label="Xóa tag"
              >
                <Trash2 size={13} />
              </button>
            </>
          )}
        </div>
      </td>
    </tr>
  );
}
