import {
  useLayoutEffect,
  useRef,
  useState,
  type ChangeEvent,
  type InputHTMLAttributes,
  type Ref,
} from "react";
import { formatMoneyInput } from "@/utils/money";

const MAX_DIGITS = 15;

type MoneyInputProps = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "value" | "onChange" | "type" | "inputMode"
> & {
  /** `null` = ô trống (vd "không giới hạn"). */
  value: number | null;
  onChange: (value: number | null) => void;
  ref?: Ref<HTMLInputElement>;
};

/**
 * Ô nhập tiền VNĐ: hiện dấu phẩy ngăn nghìn (120,000), chỉ nhận chữ số, không có số 0 thừa đầu và không có
 * nút tăng/giảm như `type="number"`. Con trỏ giữ đúng vị trí theo SỐ CHỮ SỐ đứng trước nó, nên chèn dấu phẩy
 * không làm con trỏ nhảy về cuối khi sửa ở giữa.
 *
 * Bộ gõ tiếng Việt dạng composition (bộ gõ Telex/VNI có sẵn của Windows, macOS…) soạn cả "từ" rồi mới chốt: nếu
 * chèn dấu phẩy giữa lúc đang soạn, bộ gõ ghi đè sai vị trí (gõ 12000 ra 11200 / 12,001,200,012,000). Nên trong
 * lúc soạn ô giữ nguyên chữ thô, soạn xong (`compositionend`) mới đọc số và định dạng.
 */
export function MoneyInput({ value, onChange, ref, ...rest }: MoneyInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const digitsBeforeCaret = useRef<number | null>(null);
  // Chữ thô trong lúc bộ gõ đang soạn — khác null thì hiện nguyên văn, chưa định dạng.
  const [composing, setComposing] = useState<string | null>(null);
  const display = composing ?? (value == null ? "" : formatMoneyInput(value));

  const commit = (raw: string, caret: number) => {
    const digits = raw
      .replace(/\D/g, "")
      .replace(/^0+(?=\d)/, "")
      .slice(0, MAX_DIGITS);
    const leadingZerosDropped = raw.replace(/\D/g, "").length - digits.length;
    digitsBeforeCaret.current = Math.max(
      0,
      raw.slice(0, caret).replace(/\D/g, "").length - leadingZerosDropped,
    );
    onChange(digits === "" ? null : Number(digits));
  };

  useLayoutEffect(() => {
    const input = inputRef.current;
    const wanted = digitsBeforeCaret.current;
    if (!input || wanted == null || document.activeElement !== input) return;
    digitsBeforeCaret.current = null;
    let position = 0;
    for (let seen = 0; position < display.length && seen < wanted; position++) {
      if (/\d/.test(display[position])) seen++;
    }
    input.setSelectionRange(position, position);
  }, [display]);

  return (
    <input
      {...rest}
      ref={(node) => {
        inputRef.current = node;
        if (typeof ref === "function") ref(node);
        else if (ref) ref.current = node;
      }}
      type="text"
      inputMode="numeric"
      autoComplete="off"
      value={display}
      onCompositionStart={(e) => setComposing(e.currentTarget.value)}
      onCompositionEnd={(e) => {
        const raw = e.currentTarget.value;
        setComposing(null);
        commit(raw, e.currentTarget.selectionStart ?? raw.length);
      }}
      onChange={(e: ChangeEvent<HTMLInputElement>) => {
        const raw = e.target.value;
        if (composing != null || (e.nativeEvent as InputEvent).isComposing) {
          setComposing(raw);
          return;
        }
        commit(raw, e.target.selectionStart ?? raw.length);
      }}
    />
  );
}
