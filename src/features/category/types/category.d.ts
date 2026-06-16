export interface ApiResponse<T> {
  data: T;
  isSuccess: boolean;
  statusCode: number;
  message: string | null;
  errors: string[] | null;
}
export interface Category {
  id: string;
  name: string;
  description?: string;
  parentId?: string;
  isActive: boolean;
}
