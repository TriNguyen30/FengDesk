import { useState } from "react";
import { Plus, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { classifyElementInput } from "../api/workspace.api";
import type {
  ElementInputOption,
  ElementInputVocabulary,
  WorkspaceProfileInputDto,
} from "../types/workspace";

type InputKind = WorkspaceProfileInputDto["inputKind"];

interface CurrentStateTagPickerProps {
  vocabulary: ElementInputVocabulary | null;
  value: WorkspaceProfileInputDto[];
  onChange: (inputs: WorkspaceProfileInputDto[]) => void;
  /** Có tag nào đến từ AI intake không — hiện sparkle nhắc user kiểm tra lại. */
  aiFilled?: boolean;
}

/**
 * Trần số tag mỗi nhóm — PHẢI khớp `ElementInputLimits` bên BE (Color 3, còn lại 5). BE mới là chốt
 * thật (nó cắt im lặng lúc lưu); ở đây chỉ để user thấy giới hạn trước khi bấm, thay vì bấm xong rồi
 * mất tag mà không hiểu vì sao.
 *
 * Vì sao có trần: mỗi tag là một "phiếu" dựng `current`. Càng nhiều tag thì `current` càng phẳng, mà
 * phẳng thì phủ tốt với mọi mức lý tưởng ⇒ gap teo lại và điểm mọi sản phẩm xích về giữa.
 */
const MAX_PER_KIND: Record<InputKind, number> = {
  Color: 3,
  Material: 5,
  DecorItem: 5,
  Shape: 5,
};

const GROUPS: {
  kind: InputKind;
  label: string;
  options: (v: ElementInputVocabulary) => ElementInputOption[];
}[] = [
  { kind: "Color", label: "Màu chủ đạo", options: (v) => v.colors },
  { kind: "Material", label: "Nội thất - chất liệu nội thất", options: (v) => v.materials },
  { kind: "DecorItem", label: "Vật trang trí", options: (v) => v.decorItems },
  { kind: "Shape", label: "Hình khối chủ đạo", options: (v) => v.shapes ?? [] },
];

const chipClass = (selected: boolean) =>
  `rounded-full border px-2.5 py-1 text-xs transition-colors cursor-pointer ${
    selected
      ? "border-primary bg-primary/20 text-primary font-medium"
      : "border-gray-400 text-gray-700 hover:border-primary/60 hover:text-primary"
  }`;

/**
 * Tag picker "hiện trạng không gian hiện tại" — user chọn trực tiếp màu/vật liệu/vật trang trí
 * đang có trong phòng (thay vì chỉ suy ra qua mô tả AI). Cùng vocabulary với AI intake
 * (element_input_map), nên giá trị luôn hợp lệ với engine chấm điểm — không cần validate thêm ở FE.
 *
 * Mỗi nhóm mặc định thu gọn — chỉ hiện tag đã chọn — và mở rộng đầy đủ khi hover để chọn thêm.
 * Cho phép gõ tag chưa có sẵn: AI phân loại thành hành + weight (POST classify), thanh mảnh dưới
 * tên nhóm chuyển thành progress bar trong lúc chờ.
 */
export default function CurrentStateTagPicker({
  vocabulary,
  value,
  onChange,
  aiFilled = false,
}: CurrentStateTagPickerProps) {
  const [expandedKind, setExpandedKind] = useState<InputKind | null>(null);
  // Tag user tự tạo trong phiên này — giữ cả nhãn để chip hiện đúng chữ user gõ.
  const [extraOptions, setExtraOptions] = useState<
    Partial<Record<InputKind, ElementInputOption[]>>
  >({});
  const [drafts, setDrafts] = useState<Partial<Record<InputKind, string>>>({});
  const [classifyingKind, setClassifyingKind] = useState<InputKind | null>(null);

  const isSelected = (kind: InputKind, code: string) =>
    value.some((i) => i.inputKind === kind && i.inputCode === code);

  const countOf = (kind: InputKind) => value.filter((i) => i.inputKind === kind).length;
  const isFull = (kind: InputKind) => countOf(kind) >= MAX_PER_KIND[kind];

  const toggle = (kind: InputKind, code: string) => {
    if (isSelected(kind, code)) {
      onChange(value.filter((i) => !(i.inputKind === kind && i.inputCode === code)));
      return;
    }
    // Đầy thì KHÔNG báo lỗi, chỉ không nhận thêm — chip đã bị `disabled` nên không vào được tới đây
    // bằng chuột; nhánh này là lưới chắn cho bàn phím và cho tag AI điền sẵn.
    if (isFull(kind)) return;
    onChange([...value, { inputKind: kind, inputCode: code }]);
  };

  const submitCustomTag = async (kind: InputKind) => {
    const label = (drafts[kind] ?? "").trim();
    if (!label || classifyingKind) return;

    if (isFull(kind)) return; // nhóm đã đủ — bỏ qua im lặng, không toast
    setClassifyingKind(kind);
    try {
      const result = await classifyElementInput(kind, label);
      setExtraOptions((prev) => {
        const list = prev[kind] ?? [];
        return list.some((o) => o.code === result.code)
          ? prev
          : {
              ...prev,
              [kind]: [...list, { code: result.code, labelVi: result.labelVi || label }],
            };
      });
      onChange([
        ...value.filter((i) => !(i.inputKind === kind && i.inputCode === result.code)),
        { inputKind: kind, inputCode: result.code },
      ]);
      setDrafts((prev) => ({ ...prev, [kind]: "" }));
    } catch {
      toast.error("Không phân loại được tag này - thử mô tả cụ thể hơn (vd chất liệu chính).");
    } finally {
      setClassifyingKind(null);
    }
  };

  if (!vocabulary) {
    return <div className="h-16 animate-pulse rounded-lg bg-gray-100" />;
  }

  return (
    <div>
      <p className="mb-1.5 flex items-center gap-1 text-sm font-medium text-gray-700">
        Hiện trạng không gian hiện tại
        {aiFilled && (
          <span title="AI nhận diện từ mô tả - hãy kiểm tra" className="text-primary">
            <Sparkles size={12} />
          </span>
        )}
      </p>
      <p className="mb-3 text-xs text-gray-400">
        Chọn màu chủ đạo, chất liệu nội thất và vật trang trí đang thực sự có trong không gian của
        bạn, chúng tôi sẽ có cái nhìn toàn cảnh và tính toán chính xác hơn (vd bàn ghế gỗ, có bể
        cá...). Không thấy tag phù hợp? Gõ tên mới, AI sẽ tự xếp hành cho nó.
      </p>

      <div>
        {GROUPS.map((group, i) => {
          const options = [...group.options(vocabulary), ...(extraOptions[group.kind] ?? [])];
          const selectedOptions = options.filter((o) => isSelected(group.kind, o.code));
          const expanded = expandedKind === group.kind;
          const classifying = classifyingKind === group.kind;
          const max = MAX_PER_KIND[group.kind];
          const picked = countOf(group.kind);
          const full = isFull(group.kind);

          return (
            <div
              key={group.kind}
              className={i === 0 ? "pb-3" : "border-t border-gray-200 py-3"}
              onMouseEnter={() => setExpandedKind(group.kind)}
              onMouseLeave={() => setExpandedKind((k) => (k === group.kind ? null : k))}
            >
              <p className="mb-1.5 flex items-baseline justify-between gap-2 text-xs font-medium text-gray-500">
                <span>{group.label}</span>
                {/* Bộ đếm, KHÔNG phải cảnh báo: đỏ ở đây sẽ đọc như "bạn làm sai". Chỉ đậm lên khi
                    đã đủ, để user hiểu vì sao các chip còn lại mờ đi. */}
                <span className={full ? "font-semibold text-gray-600" : "text-gray-400"}>
                  {picked}/{max}
                </span>
              </p>

              <div
                className={`tag-progress-bar relative mb-2 h-0.5 w-full overflow-hidden rounded-full bg-gray-200 transition-opacity duration-200 ${
                  classifying ? "opacity-100" : "opacity-0"
                }`}
              />

              {/* Danh sách đầy đủ — mở khi hover, animate chiều cao mượt bằng grid-rows trick. */}
              <div
                className="grid transition-[grid-template-rows] duration-300 ease-in-out"
                style={{ gridTemplateRows: expanded ? "1fr" : "0fr" }}
              >
                <div className="overflow-hidden">
                  <div className="flex flex-wrap items-center gap-1.5 pb-1">
                    {options.map((option) => {
                      const selected = isSelected(group.kind, option.code);
                      // Đủ trần ⇒ các chip CHƯA chọn mờ đi và bấm không ăn; chip ĐÃ chọn vẫn bấm được
                      // để bỏ ra — nếu khoá cả hai thì user kẹt, không đổi được lựa chọn.
                      const blocked = !selected && full;
                      return (
                        <button
                          key={option.code}
                          type="button"
                          onClick={() => toggle(group.kind, option.code)}
                          aria-pressed={selected}
                          disabled={blocked}
                          title={blocked ? `Tối đa ${max} lựa chọn - bỏ bớt một cái để đổi` : undefined}
                          className={`${chipClass(selected)} ${
                            blocked ? "cursor-not-allowed opacity-40" : ""
                          }`}
                        >
                          {option.labelVi}
                        </button>
                      );
                    })}
                    <input
                      type="text"
                      value={drafts[group.kind] ?? ""}
                      onChange={(e) =>
                        setDrafts((prev) => ({ ...prev, [group.kind]: e.target.value }))
                      }
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          void submitCustomTag(group.kind);
                        }
                      }}
                      placeholder={full ? `Đủ ${max}` : "Thêm mới..."}
                      disabled={classifying || full}
                      maxLength={50}
                      className="w-24 rounded-full border border-dashed border-gray-300 px-2.5 py-1 text-xs focus:border-primary focus:outline-none disabled:opacity-50"
                    />
                    <button
                      type="button"
                      onClick={() => void submitCustomTag(group.kind)}
                      disabled={classifying || full || !(drafts[group.kind] ?? "").trim()}
                      className="flex h-6 w-6 items-center justify-center rounded-full border border-gray-300 text-gray-500 transition-colors hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-40 cursor-pointer"
                      aria-label="Thêm tag mới"
                    >
                      <Plus size={12} />
                    </button>
                  </div>
                </div>
              </div>

              {/* Tóm tắt — chỉ hiện khi thu gọn, crossfade với danh sách đầy đủ ở trên. */}
              <div
                className="grid transition-[grid-template-rows] duration-300 ease-in-out"
                style={{ gridTemplateRows: expanded ? "0fr" : "1fr" }}
              >
                <div className="overflow-hidden">
                  {selectedOptions.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5">
                      {selectedOptions.map((option) => (
                        <span key={option.code} className={chipClass(true)}>
                          {option.labelVi}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs italic text-gray-400">Di chuột vào để chọn...</p>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
