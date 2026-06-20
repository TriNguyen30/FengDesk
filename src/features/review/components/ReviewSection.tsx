import { useState } from "react";
import { Star, MessageSquare, Trash2, Edit2, Loader2, Check, X, User } from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/app/store";
import { setAuthModal } from "@/features/auth/store/authSlice";
import { useReviews } from "../hooks/useReviews";
import type { Review } from "../types/review";

interface ReviewSectionProps {
  productId: string;
}

export default function ReviewSection({ productId }: ReviewSectionProps) {
  const dispatch = useAppDispatch();
  const currentUser = useAppSelector((state) => state.auth.user);
  const {
    reviews,
    loading,
    submitting,
    createReview,
    updateReview,
    deleteReview,
  } = useReviews(productId);

  // Form states for creating review
  const [newContent, setNewContent] = useState("");
  const [newRating, setNewRating] = useState(0);
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [formError, setFormError] = useState("");

  // Edit review states
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");
  const [editRating, setEditRating] = useState(0);
  const [editHoverRating, setEditHoverRating] = useState<number | null>(null);
  const [editError, setEditError] = useState("");

  // Delete confirmation states
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Aggregate ratings
  const totalReviews = reviews.length;
  const averageRating =
    totalReviews > 0
      ? Number((reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews).toFixed(1))
      : 0;

  const ratingCounts = [0, 0, 0, 0, 0]; // Index 0 -> 1 star, ..., Index 4 -> 5 stars
  reviews.forEach((r) => {
    const idx = Math.min(Math.max(1, Math.round(r.rating)), 5) - 1;
    ratingCounts[idx]++;
  });

  const getRatingPercentage = (stars: number) => {
    if (totalReviews === 0) return 0;
    return Math.round((ratingCounts[stars - 1] / totalReviews) * 100);
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");

    if (newRating === 0) {
      setFormError("Vui lòng chọn số sao đánh giá.");
      return;
    }
    if (newContent.trim().length < 5) {
      setFormError("Nội dung đánh giá phải có ít nhất 5 ký tự.");
      return;
    }

    const success = await createReview(newContent, newRating);
    if (success) {
      setNewContent("");
      setNewRating(0);
      setHoverRating(null);
    }
  };

  const handleEditSubmit = async (reviewId: string) => {
    setEditError("");

    if (editRating === 0) {
      setEditError("Vui lòng chọn số sao đánh giá.");
      return;
    }
    if (editContent.trim().length < 5) {
      setEditError("Nội dung đánh giá phải có ít nhất 5 ký tự.");
      return;
    }

    const success = await updateReview(reviewId, editContent, editRating);
    if (success) {
      setEditingId(null);
    }
  };

  const startEditing = (review: Review) => {
    setEditingId(review.id);
    setEditContent(review.content);
    setEditRating(review.rating);
    setEditHoverRating(null);
    setEditError("");
  };

  const handleDelete = async (reviewId: string) => {
    const success = await deleteReview(reviewId);
    if (success) {
      setDeletingId(null);
    }
  };

  const renderStars = (
    rating: number,
    size = "h-5 w-5",
    interactive = false,
    onStarClick?: (r: number) => void,
    hoverVal?: number | null,
    onHoverChange?: (r: number | null) => void,
  ) => {
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => {
          const isFilled = interactive
            ? star <= (hoverVal ?? rating)
            : star <= rating;
          return (
            <Star
              key={star}
              onClick={() => interactive && onStarClick?.(star)}
              onMouseEnter={() => interactive && onHoverChange?.(star)}
              onMouseLeave={() => interactive && onHoverChange?.(null)}
              className={`${size} ${
                interactive ? "cursor-pointer transition-all hover:scale-110 duration-100" : ""
              } ${isFilled ? "fill-amber-400 text-amber-400" : "text-gray-200"}`}
            />
          );
        })}
      </div>
    );
  };

  const getRatingLabel = (rating: number) => {
    switch (rating) {
      case 1:
        return "Rất tệ";
      case 2:
        return "Không hài lòng";
      case 3:
        return "Bình thường";
      case 4:
        return "Hài lòng";
      case 5:
        return "Tuyệt vời";
      default:
        return "Chọn đánh giá";
    }
  };

  return (
    <div className="mt-8 rounded-2xl bg-white shadow-sm ring-1 ring-gray-100 p-4 sm:p-6">
      {/* Title */}
      <div className="flex items-center gap-2 border-b border-gray-100 pb-4 mb-6">
        <MessageSquare className="h-5 w-5 text-primary" />
        <h2 className="text-lg font-bold text-gray-900">Đánh giá sản phẩm ({totalReviews})</h2>
      </div>

      {/* ── Grid: Summary & Stats ─────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 border-b border-gray-100 pb-6">
        {/* Average score */}
        <div className="flex flex-col items-center justify-center text-center p-4 bg-gray-50/50 rounded-xl">
          <div className="text-4xl font-extrabold text-gray-900 leading-tight">
            {averageRating}
            <span className="text-lg text-gray-500 font-medium">/5</span>
          </div>
          <div className="mt-2">
            {renderStars(averageRating, "h-5 w-5")}
          </div>
          <p className="mt-1 text-xs text-gray-400">{totalReviews} lượt đánh giá</p>
        </div>

        {/* Rating Bars */}
        <div className="md:col-span-2 flex flex-col gap-2.5 justify-center">
          {[5, 4, 3, 2, 1].map((stars) => {
            const pct = getRatingPercentage(stars);
            return (
              <div key={stars} className="flex items-center gap-3 text-sm">
                <span className="w-12 text-gray-500 font-medium text-right flex items-center justify-end gap-1">
                  {stars} <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400 inline" />
                </span>
                <div className="flex-1 h-2.5 rounded-full bg-gray-100 overflow-hidden">
                  <div
                    style={{ width: `${pct}%` }}
                    className="h-full rounded-full bg-amber-400 transition-all duration-500"
                  />
                </div>
                <span className="w-10 text-gray-400 text-right">{pct}%</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Review Form Section ───────────────────────────────────────────── */}
      <div className="mb-8">
        {currentUser ? (
          <form onSubmit={handleCreateSubmit} className="bg-gray-50/30 border border-gray-100 rounded-xl p-4 sm:p-5">
            <h3 className="text-sm font-semibold text-gray-800 mb-3">Viết đánh giá của bạn</h3>

            {/* Stars selection */}
            <div className="flex flex-wrap items-center gap-3 mb-4">
              <span className="text-xs text-gray-500 font-medium">Đánh giá của bạn:</span>
              <div className="flex items-center gap-2">
                {renderStars(
                  newRating,
                  "h-7 w-7",
                  true,
                  setNewRating,
                  hoverRating,
                  setHoverRating,
                )}
                {(hoverRating !== null || newRating > 0) && (
                  <span className="text-xs font-semibold text-amber-600 bg-amber-50 px-2.5 py-0.5 rounded-full">
                    {getRatingLabel(hoverRating ?? newRating)}
                  </span>
                )}
              </div>
            </div>

            {/* Content Input */}
            <div className="relative">
              <textarea
                value={newContent}
                onChange={(e) => setNewContent(e.target.value)}
                placeholder="Chia sẻ cảm nhận của bạn về sản phẩm (chất lượng, đóng gói, giao hàng...)"
                rows={3}
                className="w-full rounded-lg border border-gray-200 bg-white p-3 text-sm text-gray-800 placeholder-gray-400 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/20 transition-all"
              />
            </div>

            {/* Error Message */}
            {formError && (
              <p className="mt-2 text-xs font-medium text-red-500 flex items-center gap-1">
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-red-500" />
                {formError}
              </p>
            )}

            {/* Submit Button */}
            <div className="mt-4 flex justify-end">
              <button
                type="submit"
                disabled={submitting}
                className="flex items-center gap-2 rounded-lg bg-primary px-5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary-dark transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                Gửi đánh giá
              </button>
            </div>
          </form>
        ) : (
          <div className="border border-dashed border-gray-200 rounded-xl p-6 text-center bg-gray-50/20">
            <p className="text-sm text-gray-500 mb-3">Bạn đã mua sản phẩm này? Đăng nhập để chia sẻ cảm nghĩ của bạn.</p>
            <button
              type="button"
              onClick={() => dispatch(setAuthModal("login"))}
              className="inline-flex items-center justify-center rounded-lg border border-primary text-primary px-4 py-2 text-xs font-semibold hover:bg-primary/5 transition-all cursor-pointer"
            >
              Đăng nhập ngay
            </button>
          </div>
        )}
      </div>

      {/* ── Review List ───────────────────────────────────────────────────── */}
      <div className="space-y-4">
        {loading && reviews.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 gap-2">
            <Loader2 className="h-8 w-8 text-primary animate-spin" />
            <p className="text-sm text-gray-400">Đang tải các đánh giá...</p>
          </div>
        ) : reviews.length === 0 ? (
          <div className="text-center py-10 text-gray-400 text-sm">
            Chưa có đánh giá nào cho sản phẩm này. Hãy là người đầu tiên đánh giá!
          </div>
        ) : (
          reviews.map((review) => {
            const isOwnReview = currentUser && review.userId === currentUser.id;
            const isEditing = editingId === review.id;
            const isDeleting = deletingId === review.id;

            const reviewerName =
              review.user?.fullName || review.user?.email || "Người dùng ẩn danh";

            return (
              <div
                key={review.id}
                className="group relative border-b border-gray-100 last:border-b-0 pb-5 mb-5 last:pb-0 last:mb-0 transition-all"
              >
                {/* ── VIEW MODE ────────────────────────────────────────────── */}
                {!isEditing && (
                  <div className="flex gap-4">
                    {/* User Avatar */}
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gray-100 text-gray-500">
                      <User className="h-5 w-5" />
                    </div>

                    {/* Review content & details */}
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-1 mb-1.5">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-gray-900">
                            {reviewerName}
                          </span>
                          {isOwnReview && (
                            <span className="text-[10px] font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                              Bạn
                            </span>
                          )}
                        </div>
                        <span className="text-xs text-gray-400">
                          {new Date(review.createdAt).toLocaleDateString("vi-VN", {
                            year: "numeric",
                            month: "2-digit",
                            day: "2-digit",
                          })}
                        </span>
                      </div>

                      {/* Stars */}
                      <div className="mb-2">
                        {renderStars(review.rating, "h-4 w-4")}
                      </div>

                      {/* Review Comment */}
                      <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">
                        {review.content}
                      </p>

                      {/* Actions for Own Review */}
                      {isOwnReview && !isDeleting && (
                        <div className="mt-3 flex items-center gap-3 text-xs">
                          <button
                            onClick={() => startEditing(review)}
                            className="flex items-center gap-1.5 font-medium text-gray-500 hover:text-primary transition-colors cursor-pointer"
                          >
                            <Edit2 size={12} /> Sửa
                          </button>
                          <button
                            onClick={() => setDeletingId(review.id)}
                            className="flex items-center gap-1.5 font-medium text-gray-500 hover:text-red-500 transition-colors cursor-pointer"
                          >
                            <Trash2 size={12} /> Xóa
                          </button>
                        </div>
                      )}

                      {/* Confirm Delete */}
                      {isOwnReview && isDeleting && (
                        <div className="mt-3 flex items-center gap-3 text-xs bg-red-50/50 p-2.5 rounded-lg border border-red-100 max-w-sm">
                          <span className="font-medium text-red-700">Xác nhận xóa đánh giá này?</span>
                          <button
                            onClick={() => handleDelete(review.id)}
                            disabled={submitting}
                            className="font-bold text-red-600 hover:text-red-800 transition-colors disabled:opacity-50 cursor-pointer"
                          >
                            Xóa
                          </button>
                          <button
                            onClick={() => setDeletingId(null)}
                            className="font-bold text-gray-500 hover:text-gray-700 transition-colors cursor-pointer"
                          >
                            Hủy
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* ── EDIT INLINE MODE ─────────────────────────────────────── */}
                {isEditing && (
                  <div className="flex gap-4">
                    {/* User Avatar */}
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                      <User className="h-5 w-5" />
                    </div>

                    <div className="flex-1 bg-primary/5 border border-primary/10 rounded-xl p-4">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-xs font-semibold text-primary">Chỉnh sửa đánh giá của bạn</span>
                        <button
                          onClick={() => setEditingId(null)}
                          className="text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
                        >
                          <X size={16} />
                        </button>
                      </div>

                      {/* Edit Stars */}
                      <div className="flex items-center gap-3 mb-3">
                        <span className="text-xs text-gray-500 font-medium">Đánh giá:</span>
                        <div className="flex items-center gap-2">
                          {renderStars(
                            editRating,
                            "h-5 w-5",
                            true,
                            setEditRating,
                            editHoverRating,
                            setEditHoverRating,
                          )}
                          {(editHoverRating !== null || editRating > 0) && (
                            <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
                              {getRatingLabel(editHoverRating ?? editRating)}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Edit Content Textarea */}
                      <textarea
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        rows={2}
                        className="w-full rounded-lg border border-gray-200 bg-white p-2.5 text-sm text-gray-800 placeholder-gray-400 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/20 transition-all"
                      />

                      {/* Edit Error message */}
                      {editError && (
                        <p className="mt-1.5 text-xs font-semibold text-red-500">
                          {editError}
                        </p>
                      )}

                      {/* Save/Cancel Actions */}
                      <div className="mt-3.5 flex justify-end gap-2 text-xs">
                        <button
                          type="button"
                          onClick={() => setEditingId(null)}
                          className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-1.5 font-semibold text-gray-600 bg-white hover:bg-gray-50 cursor-pointer transition-colors"
                        >
                          <X size={12} /> Hủy
                        </button>
                        <button
                          type="button"
                          onClick={() => handleEditSubmit(review.id)}
                          disabled={submitting}
                          className="inline-flex items-center gap-1 rounded-lg bg-primary px-3.5 py-1.5 font-semibold text-white hover:bg-primary-dark cursor-pointer transition-colors disabled:opacity-50"
                        >
                          {submitting ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <Check size={12} />
                          )}
                          Lưu thay đổi
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
