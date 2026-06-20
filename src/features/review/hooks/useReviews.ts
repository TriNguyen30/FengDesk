import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import {
  getReviewsRequest,
  createReviewRequest,
  updateReviewRequest,
  deleteReviewRequest,
} from "../api/review.api";
import type { Review } from "../types/review";

export function useReviews(productId: string | undefined) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchReviews = useCallback(async () => {
    if (!productId) return;
    setLoading(true);
    setError(null);
    try {
      const response = await getReviewsRequest({ productId });
      if (response.isSuccess) {
        if (Array.isArray(response.data)) {
          setReviews(response.data);
        } else if (response.data && Array.isArray((response.data as any).items)) {
          setReviews((response.data as any).items);
        } else {
          setReviews([]);
        }
      } else {
        setError(response.message || "Không thể tải đánh giá");
      }
    } catch (err) {
      console.error(err);
      setError("Có lỗi xảy ra khi tải đánh giá");
    } finally {
      setLoading(false);
    }
  }, [productId]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  const createReview = useCallback(async (content: string, rating: number) => {
    if (!productId) return false;
    setSubmitting(true);
    try {
      const response = await createReviewRequest({ productId, content, rating });
      if (response.isSuccess) {
        toast.success("Đánh giá sản phẩm thành công");
        await fetchReviews();
        return true;
      } else {
        toast.error(response.message || "Không thể gửi đánh giá");
        return false;
      }
    } catch (err) {
      console.error(err);
      toast.error("Có lỗi xảy ra khi gửi đánh giá");
      return false;
    } finally {
      setSubmitting(false);
    }
  }, [productId, fetchReviews]);

  const updateReview = useCallback(async (reviewId: string, content: string, rating: number) => {
    setSubmitting(true);
    try {
      const response = await updateReviewRequest(reviewId, { content, rating });
      if (response.isSuccess) {
        toast.success("Cập nhật đánh giá thành công");
        await fetchReviews();
        return true;
      } else {
        toast.error(response.message || "Không thể cập nhật đánh giá");
        return false;
      }
    } catch (err) {
      console.error(err);
      toast.error("Có lỗi xảy ra khi cập nhật đánh giá");
      return false;
    } finally {
      setSubmitting(false);
    }
  }, [fetchReviews]);

  const deleteReview = useCallback(async (reviewId: string) => {
    setSubmitting(true);
    try {
      const response = await deleteReviewRequest(reviewId);
      if (response.isSuccess) {
        toast.success("Đã xóa đánh giá");
        await fetchReviews();
        return true;
      } else {
        toast.error(response.message || "Không thể xóa đánh giá");
        return false;
      }
    } catch (err) {
      console.error(err);
      toast.error("Có lỗi xảy ra khi xóa đánh giá");
      return false;
    } finally {
      setSubmitting(false);
    }
  }, [fetchReviews]);

  return {
    reviews,
    loading,
    submitting,
    error,
    refresh: fetchReviews,
    createReview,
    updateReview,
    deleteReview,
  };
}
