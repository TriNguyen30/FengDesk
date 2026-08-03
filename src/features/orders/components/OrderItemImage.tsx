import { useState } from "react";
import { Package } from "lucide-react";

interface OrderItemImageProps {
  /** BE trả kèm trong OrderItemResponse.imageUrl. Null = sản phẩm chưa có ảnh. */
  imageUrl?: string | null;
  alt: string;
  /** Kích thước khung (vd "h-20 w-20"). Bo góc + nền do component tự lo. */
  className?: string;
  iconClassName?: string;
}

/**
 * Ảnh sản phẩm trong đơn hàng, rơi về icon khi thiếu ảnh HOẶC khi URL hỏng
 * (ảnh cũ bị xóa khỏi storage vẫn còn trong đơn — snapshot đơn không xóa theo).
 */
export default function OrderItemImage({
  imageUrl,
  alt,
  className = "h-14 w-14",
  iconClassName = "h-5 w-5",
}: OrderItemImageProps) {
  const [failed, setFailed] = useState(false);
  const showImage = Boolean(imageUrl) && !failed;

  return (
    <div
      className={`flex shrink-0 items-center justify-center overflow-hidden rounded-lg border border-gray-100 bg-gray-50 ${className}`}
    >
      {showImage ? (
        <img
          src={imageUrl!}
          alt={alt}
          loading="lazy"
          onError={() => setFailed(true)}
          className="h-full w-full object-cover"
        />
      ) : (
        <Package className={`${iconClassName} text-gray-300`} />
      )}
    </div>
  );
}
