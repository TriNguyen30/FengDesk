import axios from "@/lib/axios.ts";

export const uploadFile = (file: File) => {
  const formData = new FormData();
  formData.append("file", file);

  return axios.post("/upload/image", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
};
