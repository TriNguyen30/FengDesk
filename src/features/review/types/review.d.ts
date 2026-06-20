export interface UserReviewInfo {
  id: string;
  email: string;
  fullName?: string;
}

export interface Review {
  id: string;
  content: string;
  rating: number;
  createdAt: string;
  updatedAt: string;
  userId: string;
  productId: string;
  user?: UserReviewInfo;
}

export interface CreateReviewRequest {
  productId: string;
  content: string;
  rating: number;
}

export interface UpdateReviewRequest {
  content: string;
  rating: number;
}

export interface GetReviewsParams {
  productId?: string;
  page?: number;
  pageSize?: number;
}
