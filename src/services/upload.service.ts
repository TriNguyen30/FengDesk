import axios from "@/lib/axios.ts";
import { normalizeImageForUpload } from "@/utils/imageResize";

/**
 * Upload ảnh dùng chung (chưa gắn vào entity nào) → trả URL công khai.
 * Ảnh được chuẩn hoá trước khi gửi: backend chỉ nhận JPG/PNG/BMP/GIF nên .webp phải đổi sang JPEG.
 */
export const uploadFile = async (file: File) => {
  const normalized = await normalizeImageForUpload(file);
  const formData = new FormData();
  formData.append("file", normalized);

  return axios.post("/uploads", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
};
