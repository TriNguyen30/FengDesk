import type { WorkspaceImage } from "../types/workspace";

interface WorkspaceCoverBackdropProps {
  images: WorkspaceImage[];
  /** Ảnh đang hiện (từ useSlideshow). */
  index: number;
  /** Chiều cao cố định của lớp ảnh — KHÔNG theo nội dung, nên Chi tiết/Thu gọn không kéo giãn ảnh. */
  heightClass?: string;
  /** Bo góc khớp khung cha (lớp ảnh có overflow-hidden). */
  roundedClass?: string;
}

/**
 * Lớp ảnh NỀN của phần tổng quan phòng (thẻ workspace, khung "độ phù hợp" ở trang sản phẩm): nằm tuyệt đối
 * ở đầu khung cha (cha phải `relative`), mờ dần từ chân lên (fd-cover-fade) và phủ scrim theo theme. Nhiều
 * ảnh → xếp chồng, ảnh đang hiện mờ vào / ảnh cũ mờ ra (crossfade).
 */
export default function WorkspaceCoverBackdrop({
  images,
  index,
  heightClass = "h-[26rem]",
  roundedClass = "rounded-t-xl",
}: WorkspaceCoverBackdropProps) {
  if (images.length === 0) return null;
  return (
    <div
      aria-hidden
      className={`fd-cover-fade pointer-events-none absolute inset-x-0 top-0 overflow-hidden ${heightClass} ${roundedClass}`}
    >
      {images.map((image, i) => (
        <img
          key={image.id}
          src={image.url}
          alt=""
          loading={i === 0 ? "eager" : "lazy"}
          className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-1000 ease-in-out ${
            i === index ? "opacity-100" : "opacity-0"
          }`}
        />
      ))}
      <div className="fd-cover-scrim absolute inset-0" />
    </div>
  );
}
