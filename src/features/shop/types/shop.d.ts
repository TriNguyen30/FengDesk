export interface ApiResponse<T> {
  data: T;
  isSuccess: boolean;
  statusCode: number;
  message: string | null;
  errors: string[] | null;
}

export interface Shop {
  id: string;
  ownerUserId: string;
  name: string;
  description: string;
  hotline: string;
  openingHours: string;
  isActive: boolean;
  address: string;
  createdAt: string;
  updatedAt: string;
}
