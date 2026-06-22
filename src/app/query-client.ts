import { QueryClient } from "@tanstack/react-query";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // Cache "tươi" 5 phút
      gcTime: 10 * 60 * 1000, // Giữ cache thêm 10 phút nếu không dùng
      refetchOnWindowFocus: false, // Không tự refetch khi quay lại tab
      retry: 1, // Thử lại 1 lần nếu lỗi
    },
  },
});
