import React, { useMemo, useRef, useEffect, useCallback } from "react";
import ReactQuill from "react-quill-new";
import "react-quill-new/dist/quill.snow.css";
import { uploadFile } from "@/services/upload.service";
import { toast } from "sonner";

export interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  minHeight?: string;
  disabled?: boolean;
}

export const RichTextEditor: React.FC<RichTextEditorProps> = ({
  value,
  onChange,
  placeholder = "Nhập nội dung mô tả chi tiết...",
  className = "",
  minHeight = "160px",
  disabled = false,
}) => {
  const quillRef = useRef<any>(null);

  // Upload an image file and insert its URL into Quill editor
  const uploadAndInsertImage = useCallback(async (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error("Vui lòng chỉ chọn tệp hình ảnh");
      return;
    }

    // Limit size if needed (e.g. 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error("Kích thước ảnh không được vượt quá 10MB");
      return;
    }

    const toastId = toast.loading(`Đang tải ảnh "${file.name}" lên...`);
    try {
      const res = await uploadFile(file);
      const imageUrl =
        (res.data as any)?.data || (res.data as any)?.url || res.data;

      if (imageUrl && typeof imageUrl === "string") {
        const editor = quillRef.current?.getEditor();
        if (editor) {
          const range = editor.getSelection(true) || { index: editor.getLength(), length: 0 };
          editor.insertEmbed(range.index, "image", imageUrl, "user");
          editor.setSelection(range.index + 1, 0, "silent");
        }
        toast.success("Tải ảnh lên thành công", { id: toastId });
      } else {
        throw new Error("Không nhận được URL hình ảnh từ máy chủ");
      }
    } catch (err) {
      console.error("Lỗi tải ảnh trong trình soạn thảo:", err);
      toast.error(`Tải ảnh thất bại: ${file.name}`, { id: toastId });
    }
  }, []);

  // Custom Image button click handler in toolbar
  const handleImageUpload = useCallback(() => {
    const input = document.createElement("input");
    input.setAttribute("type", "file");
    input.setAttribute("accept", "image/*");
    input.click();

    input.onchange = async () => {
      const file = input.files?.[0];
      if (file) {
        await uploadAndInsertImage(file);
      }
    };
  }, [uploadAndInsertImage]);

  // Support paste / drop of image files directly into the editor
  useEffect(() => {
    const editor = quillRef.current?.getEditor();
    if (!editor || !editor.root) return;

    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf("image") !== -1) {
          const file = items[i].getAsFile();
          if (file) {
            e.preventDefault();
            uploadAndInsertImage(file);
            break;
          }
        }
      }
    };

    const handleDrop = (e: DragEvent) => {
      const files = e.dataTransfer?.files;
      if (files && files.length > 0) {
        const file = files[0];
        if (file.type.startsWith("image/")) {
          e.preventDefault();
          uploadAndInsertImage(file);
        }
      }
    };

    const rootEl = editor.root as HTMLElement;
    rootEl.addEventListener("paste", handlePaste);
    rootEl.addEventListener("drop", handleDrop);

    return () => {
      rootEl.removeEventListener("paste", handlePaste);
      rootEl.removeEventListener("drop", handleDrop);
    };
  }, [uploadAndInsertImage]);

  // Memoize modules to avoid Quill re-creation on every render
  const modules = useMemo(
    () => ({
      toolbar: {
        container: [
          [{ header: [1, 2, 3, false] }],
          ["bold", "italic", "underline", "strike"],
          [{ list: "ordered" }, { list: "bullet" }],
          [{ color: [] }, { background: [] }],
          ["blockquote", "link", "image"],
          ["clean"],
        ],
        handlers: {
          image: handleImageUpload,
        },
      },
    }),
    [handleImageUpload]
  );

  return (
    <div
      className={`rich-text-editor-container rounded-xl overflow-hidden border border-gray-200 bg-white transition-all focus-within:border-primary focus-within:ring-1 focus-within:ring-primary/30 ${
        disabled ? "opacity-60 pointer-events-none" : ""
      } ${className}`}
    >
      <ReactQuill
        ref={quillRef}
        theme="snow"
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        readOnly={disabled}
        modules={modules}
        className="[&_.ql-toolbar]:border-none [&_.ql-toolbar]:border-b [&_.ql-toolbar]:border-gray-200 [&_.ql-toolbar]:bg-gray-50/80 [&_.ql-container]:border-none [&_.ql-container]:text-sm [&_.ql-container]:text-gray-700"
        style={{
          minHeight,
        }}
      />
      <style>{`
        .rich-text-editor-container .ql-editor {
          min-height: ${minHeight};
          font-size: 0.875rem;
          line-height: 1.6;
        }
        .rich-text-editor-container .ql-editor.ql-blank::before {
          color: #9ca3af;
          font-style: normal;
        }
        .rich-text-editor-container .ql-editor img {
          max-width: 100%;
          height: auto;
          border-radius: 0.5rem;
          margin: 0.75rem auto;
          display: block;
        }
      `}</style>
    </div>
  );
};

export default RichTextEditor;
