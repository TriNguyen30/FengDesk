export interface ApiResponse<T> {
  data: T;
  isSuccess: boolean;
  message: string;
  errors: string[] | null;
  statusCode: number;
}
