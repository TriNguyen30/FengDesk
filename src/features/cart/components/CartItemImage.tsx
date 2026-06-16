import { Leaf } from "lucide-react";

interface CartItemImageProps {
  imageUrl?: string;
  alt: string;
  className?: string;
  iconSize?: number;
}

export default function CartItemImage({
  imageUrl,
  alt,
  className = "h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-gray-50 ring-1 ring-gray-100",
  iconSize = 24,
}: CartItemImageProps) {
  return (
    <div className={`flex items-center justify-center text-gray-400 ${className}`}>
      {imageUrl ? (
        <img src={imageUrl} alt={alt} className="h-full w-full object-cover" />
      ) : (
        <Leaf size={iconSize} />
      )}
    </div>
  );
}
