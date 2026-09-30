import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import {
  getReviewsRequest,
  getRatingSummaryRequest,
  getReviewEligibilityRequest,
  createReviewRequest,
  updateReviewRequest,
  deleteReviewRequest,
} from "../api/review.api";
import type { Review, RatingSummary, ReviewEligibility } from "../types/review";

const PAGE_SIZE = 10;
const EMPTY_SUMMARY: RatingSummary = { average: 0, count: 0, distribution: [0, 0, 0, 0, 0] };

/**
 * Đánh giá của một sản phẩm: danh sách phân trang + điểm tổng hợp (tính ở BE) + quyền đánh giá của user.
 * `isLoggedIn` = false thì bỏ qua gọi eligibility (endpoint cần đăng nhập).
 */
export function useReviews(productId: string | undefined, isLoggedIn = false) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [summary, setSummary] = useState<RatingSummary>(EMPTY_SUMMARY);
  const [eligibility, setEligibility] = useState<ReviewEligibility | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPage = useCallback(
    async (targetPage: number) => {
      if (!productId) return;
      setLoading(true);
      setError(null);
      try {
        const response = await getReviewsRequest({ productId, page: targetPage, pageSize: PAGE_SIZE });
        if (response.isSuccess && response.data) {
          const items = response.data.items ?? [];
          setReviews((prev) => (targetPage === 1 ? items : [...prev, ...items]));
          setPage(targetPage);
          setTotalPages(response.data.totalPages);
        } else {
          setError(response.message || "Không thể tải đánh giá");
        }
      } catch (err) {
        console.error(err);
        setError("Có lỗi xảy ra khi tải đánh giá");
      } finally {
        setLoading(false);
      }
    },
    [productId],
  );

  const fetchSummary = useCallback(async () => {
    if (!productId) return;
    try {
      const response = await getRatingSummaryRequest({ productId });
      if (response.isSuccess && response.data) setSummary(response.data);
    } catch (err) {
      console.error(err);
    }
  }, [productId]);

  const fetchEligibility = useCallback(async () => {
    if (!productId || !isLoggedIn) return;
    try {
      const response = await getReviewEligibilityRequest(productId);
      setEligibility(response.isSuccess ? response.data : null);
    } catch (err) {
      console.error(err);
      setEligibility(null);
    }
  }, [productId, isLoggedIn]);

  const refresh = useCallback(async () => {
    await Promise.all([fetchPage(1), fetchSummary(), fetchEligibility()]);
  }, [fetchPage, fetchSummary, fetchEligibility]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const loadMore = useCallback(() => {
    if (!loading && page < totalPages) fetchPage(page + 1);
  }, [loading, page, totalPages, fetchPage]);

  const createReview = useCallback(
    async (content: string, rating: number) => {
      if (!productId) return false;
      setSubmitting(true);
      try {
        // Có orderItemId từ eligibility thì gửi đúng dòng đơn; không thì để BE tự chọn theo productId.
        const response = await createReviewRequest(
          eligibility?.orderItemId
            ? { orderItemId: eligibility.orderItemId, content, rating }
            : { productId, content, rating },
        );
        if (response.isSuccess) {
          toast.success("Đánh giá sản phẩm thành công");
          await refresh();
          return true;
        }
        toast.error(response.message || "Không thể gửi đánh giá");
        return false;
      } catch (err) {
        console.error(err);
        toast.error("Có lỗi xảy ra khi gửi đánh giá");
        return false;
      } finally {
        setSubmitting(false);
      }
    },
    [productId, eligibility, refresh],
  );

  const updateReview = useCallback(
    async (reviewId: string, content: string, rating: number) => {
      setSubmitting(true);
      try {
        const response = await updateReviewRequest(reviewId, { content, rating });
        if (response.isSuccess) {
          toast.success("Cập nhật đánh giá thành công");
          await refresh();
          return true;
        }
        toast.error(response.message || "Không thể cập nhật đánh giá");
        return false;
      } catch (err) {
        console.error(err);
        toast.error("Có lỗi xảy ra khi cập nhật đánh giá");
        return false;
      } finally {
        setSubmitting(false);
      }
    },
    [refresh],
  );

  const deleteReview = useCallback(
    async (reviewId: string) => {
      setSubmitting(true);
      try {
        const response = await deleteReviewRequest(reviewId);
        if (response.isSuccess) {
          toast.success("Đã xóa đánh giá");
          await refresh();
          return true;
        }
        toast.error(response.message || "Không thể xóa đánh giá");
        return false;
      } catch (err) {
        console.error(err);
        toast.error("Có lỗi xảy ra khi xóa đánh giá");
        return false;
      } finally {
        setSubmitting(false);
      }
    },
    [refresh],
  );

  return {
    reviews,
    summary,
    // Đăng xuất thì bỏ kết quả cũ — tính khi render thay vì setState trong effect.
    eligibility: isLoggedIn ? eligibility : null,
    hasMore: page < totalPages,
    loading,
    submitting,
    error,
    refresh,
    loadMore,
    createReview,
    updateReview,
    deleteReview,
  };
}
