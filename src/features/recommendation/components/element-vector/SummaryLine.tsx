import { elementColor, elementVi } from "./constants";

interface SummaryLineProps {
  /** Hành trội của sản phẩm. */
  productDominant: string;
  /** Hành phòng đang cần nhất (gap dương lớn nhất). */
  roomNeed: string;
  /** true nếu sản phẩm bù đúng hành phòng cần. */
  matches: boolean;
}

/** Câu kết luận ngắn: "Sản phẩm này thuộc hành X trội — hợp/chưa hợp phòng đang thiếu Y." */
export default function SummaryLine({ productDominant, roomNeed, matches }: SummaryLineProps) {
  const productVi = elementVi(productDominant);
  const needVi = elementVi(roomNeed);

  return (
    <p className="text-xs text-gray-400">
      Sản phẩm này thuộc <b style={{ color: elementColor(productDominant) }}>hành {productVi}</b>{" "}
      trội —{" "}
      {matches ? (
        <>
          hợp phòng đang thiếu <b style={{ color: elementColor(roomNeed) }}>{needVi}</b>.
        </>
      ) : (
        <>
          phòng hiện đang thiếu <b style={{ color: elementColor(roomNeed) }}>{needVi}</b> hơn.
        </>
      )}
    </p>
  );
}
