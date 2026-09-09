import type {
  ElementCode,
  ProductElementRow,
  ScoreBreakdown,
} from "../types/recommendation";
import { ELEMENT_ORDER } from "../components/element-vector/constants";

/** Vector 5 hành dạng map — kiểu làm việc nội bộ, gọn hơn mảng row khi phải cộng/nhân. */
export type ElementMap = Record<ElementCode, number>;

const ZERO: ElementMap = { Kim: 0, Moc: 0, Thuy: 0, Hoa: 0, Tho: 0 };

export function toMap(rows: ProductElementRow[] | null | undefined): ElementMap {
  const out = { ...ZERO };
  for (const r of rows ?? []) out[r.element] = r.value;
  return out;
}

/**
 * Vector có thật sự có dữ liệu không.
 *
 * {@link toMap} biến `null`/`[]` thành vector 0 — một giá trị **trông hợp lệ**. Với công thức tổ hợp
 * lồi thì đó là bẫy: thiếu `personalVector` sẽ cho `T = (1−wp)·adjustedIdeal`, tức đa giác co đều lại
 * khi kéo `Wp` lên (Σ tụt còn 70%, rồi 50%) thay vì đổi hình — sai mà nhìn vẫn "chạy được".
 * Gọi hàm này để chặn trước, đừng vẽ một lớp dựng từ dữ liệu không có.
 */
export function hasValues(rows: ProductElementRow[] | null | undefined): boolean {
  return (rows?.length ?? 0) > 0 && rows!.some((r) => r.value !== 0);
}

export function toRows(map: ElementMap): ProductElementRow[] {
  return ELEMENT_ORDER.map((element) => ({ element, value: map[element] }));
}

/**
 * `d = (1−wp)·ĝ + wp·r` — vector hướng tổng hợp, chính là thứ engine nhân với vector sản phẩm.
 *
 * Đây là lý do BE trả cả `ĝ` lẫn `r` thay vì chỉ trả `d`: **kéo slider `Wp` là dựng lại được `d`
 * ngay tại client, không cần gọi lại API** (§10.3). Không có `r` (trục cá nhân tắt) thì `d ≡ ĝ`.
 */
export function combinedDirection(gHat: ElementMap, r: ElementMap | null, wp: number): ElementMap {
  if (!r) return { ...gHat };
  const out = { ...ZERO };
  for (const e of ELEMENT_ORDER) out[e] = (1 - wp) * gHat[e] + wp * r[e];
  return out;
}

/**
 * `priorityVector = normalize(max(d, 0))` — Σ=1, chồng được lên `adjustedIdeal`/`current` vì cùng thang.
 *
 * Ý nghĩa: *"sau khi tính bản mệnh của bạn, hệ thống đang ưu tiên bù hành nào"*. Phần âm của `d`
 * KHÔNG mất đi — nó hiện thành nhãn trục đỏ (xem {@link negativeAxes}), chứ không bị nuốt lặng lẽ.
 */
export function priorityVector(d: ElementMap): ElementMap {
  const positive = ELEMENT_ORDER.map((e) => Math.max(0, d[e]));
  const sum = positive.reduce((a, b) => a + b, 0);
  if (sum <= 0) return { ...ZERO };

  const out = { ...ZERO };
  ELEMENT_ORDER.forEach((e, i) => {
    out[e] = positive[i] / sum;
  });
  return out;
}

/** Các hành mà `d < 0`: hệ thống đang TRÁNH chứ không ưu tiên. Dùng cho tooltip, KHÔNG cho dấu trục. */
export function negativeAxes(d: ElementMap): ElementCode[] {
  return ELEMENT_ORDER.filter((e) => d[e] < 0);
}

/**
 * Phần đóng góp của CHỦ NHÂN phòng vào vector `Hiện tại`, đọc thẳng từ `contributions`.
 *
 * Chủ nhân là một nguồn phiếu trong `current`, nên phần của họ ở mỗi trục là một số hạng không âm của
 * chính tổng đó ⇒ đa giác này **luôn nằm trong** lớp "Hiện tại". Σ của nó = `sharePercent` của chủ
 * nhân (vd 18%), KHÔNG phải 1 — nó là một phần của phòng, không phải một mục tiêu.
 *
 * BE đã quy sẵn ra % của toàn vector (`elements[].percent`), nên ở đây chỉ đổi thang về 0..1.
 */
export function personContribution(
  contributions: { source: string; elements: { element: string; percent: number }[] }[],
): ElementMap | null {
  const person = contributions.find((c) => c.source === "Person");
  if (!person) return null;

  const out = { ...ZERO };
  for (const e of person.elements) {
    if (e.element in out) out[e.element as ElementCode] = e.percent / 100;
  }
  return ELEMENT_ORDER.some((e) => out[e] > 0) ? out : null;
}

/** Kết quả mô phỏng: cả hiện trạng phòng LẪN phần của chủ nhân ở mức phiếu giả định. */
export interface VoteSimulation {
  /** `current` mới, Σ=1. */
  current: ElementMap;
  /** Phần của chủ nhân trong `current` mới — Σ = share của họ, luôn ≤ `current` từng trục. */
  person: ElementMap;
  /** Tổng phiếu sau khi đổi. */
  totalVotes: number;
}

/**
 * Dựng lại `current` khi chủ nhân phòng nặng `simulatedVotes` phiếu thay vì `personVotes`.
 *
 * Chủ nhân là một **số hạng trong tổng** `current = normalize(Σᵢ vᵢ·wᵢ)`, không phải một lớp vẽ
 * chồng lên. Đổi phiếu của họ thì **cả hai** lớp phải đổi: phần của họ to lên, và phần của mọi
 * nguồn còn lại loãng đi vì mẫu số lớn hơn. Chỉ co giãn lớp vàng mà để yên lớp xanh là vẽ hai
 * căn phòng khác nhau trên cùng một hình.
 *
 * Tách nguồn ra khỏi tổng rồi ghép lại ở mức phiếu mới:
 * ```
 * khác[e]  = current[e]·totalVotes − personVotes·pv[e]     // Σ = totalVotes − personVotes
 * mới[e]   = (khác[e] + v'·pv[e]) / (khác + v')
 * ```
 * `v' = personVotes` trả về đúng `current` ban đầu — mô phỏng không làm trôi số gốc.
 *
 * `pv` là `personalDirection.personalVector`: BE dựng nguồn `Person` và trường này bằng **cùng một**
 * `BuildPersonalVector(dob, SELF/SUPPORT/CHILD_SHARE)`, nên thay thế được cho nhau.
 *
 * `null` khi không đủ dữ liệu để tách — thà không mô phỏng còn hơn vẽ một căn phòng không có thật.
 */
export function simulateVotes(
  current: ElementMap,
  personalVector: ElementMap,
  personVotes: number,
  totalVotes: number,
  simulatedVotes: number,
): VoteSimulation | null {
  const otherVotes = totalVotes - personVotes;
  const newTotal = otherVotes + simulatedVotes;
  if (!(totalVotes > 0) || !(otherVotes > 0) || !(newTotal > 0) || simulatedVotes < 0) return null;

  const current2 = { ...ZERO };
  const person2 = { ...ZERO };
  for (const e of ELEMENT_ORDER) {
    // clamp chỉ để nuốt sai số dấu phẩy động quanh 0, không để sửa dữ liệu lệch.
    const others = Math.max(0, current[e] * totalVotes - personVotes * personalVector[e]);
    const mine = simulatedVotes * personalVector[e];
    person2[e] = mine / newTotal;
    current2[e] = (others + mine) / newTotal;
  }
  return { current: current2, person: person2, totalVotes: newTotal };
}

/**
 * Vì sao một trục bị âm — ghép từ hai lực đã tạo ra nó thay vì nói chung chung "hành này không tốt".
 * Người dùng cần biết đây là chuyện của căn phòng, của bản mệnh, hay của cả hai.
 */
export function negativeAxisReason(
  element: ElementCode,
  gHat: ElementMap,
  r: ElementMap | null,
  destinyLabel: string | null,
): string | null {
  const roomExcess = gHat[element] < 0;
  const clashes = r !== null && r[element] < 0;
  const destiny = destinyLabel ?? "bản mệnh của bạn";

  // "Phòng đang thừa X" đã được khối dấu thừa/thiếu trên tooltip nói rồi — lặp lại ở đây là hai dòng
  // cùng nội dung. Chỉ nói phần mà khối kia KHÔNG biết: quan hệ với bản mệnh.
  if (roomExcess && clashes) return `${element} cũng không hợp ${destiny}.`;
  if (clashes) return `Phòng có cần ${element}, nhưng ${element} không hợp ${destiny}.`;
  return null;
}

/**
 * Điểm ở một mức `Wp` giả định = `productVector · d(wp)` trừ đi các penalty.
 *
 * Dùng cho slider: cho thấy điểm ĐỔI THEO trọng số, không chỉ hình radar đổi. Riêng
 * `USER_CONFLICT_PENALTY` phải nhân lại theo `wp` vì bản thân nó co giãn theo trọng số cá nhân (L2,
 * §14.2) — giữ nguyên mức phạt cũ khi kéo slider sẽ ra một con số không tồn tại trong hệ thống thật.
 */
export function simulateScore(breakdown: ScoreBreakdown, wp: number): number {
  const gHat = toMap(breakdown.vectors.normalizedGap);
  const r = breakdown.vectors.ruleScore ? toMap(breakdown.vectors.ruleScore) : null;
  const product = toMap(breakdown.vectors.product);
  const d = combinedDirection(gHat, r, wp);

  let score = ELEMENT_ORDER.reduce((sum, e) => sum + product[e] * d[e], 0);

  const baseWp = breakdown.personalWeight?.value ?? 0;
  for (const p of breakdown.penalties) {
    if (!p.applied) continue;
    if (p.code === "USER_CONFLICT_PENALTY" && baseWp > 0) {
      score -= (p.value / baseWp) * wp; // quy về mức phạt gốc rồi co lại theo wp mới
    } else {
      score -= p.value;
    }
  }

  return Math.max(-1, Math.min(1, score));
}

/** Quy đổi điểm [-1,1] → [0,100]%. Khớp `ScoreBreakdownMapping.DisplayPercentOf` của BE. */
export function scoreToPercent(score: number): number {
  return Math.round(((Math.max(-1, Math.min(1, score)) + 1) / 2) * 100);
}

/** Sản phẩm khắc bản mệnh — phạm trù kiêng kỵ, KHÔNG phải "điểm thấp". Xem {@link ClashBadge}. */
export function hasDestinyClash(breakdown: ScoreBreakdown | null): boolean {
  return (
    breakdown?.penalties.some((p) => p.code === "USER_CONFLICT_PENALTY" && p.applied) ?? false
  );
}

/**
 * Ba lý do khác nhau cùng dẫn tới `Wp = 0` (§10.7). Gộp chung thành một câu là lấy mất của user hành
 * động cần làm: người thiếu ngày sinh chỉ cần khai ngày sinh, còn phòng chung thì không làm gì được.
 */
export type PersonalAxisOffReason = "public-space" | "no-birthdate" | "disabled" | null;

export function personalAxisOffReason(breakdown: ScoreBreakdown | null): PersonalAxisOffReason {
  if (!breakdown || breakdown.target === "PersonalNeed") return null;

  const pw = breakdown.personalWeight;
  if (!pw || pw.value > 0) return null;

  if (pw.scope === "Public") return "public-space";
  if (breakdown.destinyElement === null) return "no-birthdate";
  return "disabled";
}
