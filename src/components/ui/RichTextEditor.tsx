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
        const editor = quillRef.current?.getEditor?.();
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

  // Support paste / drop of image files directly into the editor + sanitize text paste
  useEffect(() => {
    const editor = quillRef.current?.getEditor?.();
    if (!editor || !editor.root) return;

    // Register clipboard matcher to automatically clean pasted white/gray backgrounds & dark colors
    if (editor.clipboard && editor.clipboard.addMatcher) {
      editor.clipboard.addMatcher(Node.ELEMENT_NODE, (_node: HTMLElement, delta: any) => {
        if (delta && delta.ops) {
          delta.ops.forEach((op: any) => {
            if (op.attributes) {
              const bg = typeof op.attributes.background === "string" ? op.attributes.background.toLowerCase() : "";
              if (
                bg &&
                (bg === "#ffffff" ||
                  bg === "#fff" ||
                  bg === "white" ||
                  bg.includes("255, 255, 255") ||
                  bg.includes("255,255,255") ||
                  bg === "#fafafa" ||
                  bg === "#f8f9fa" ||
                  bg === "#f5f5f5" ||
                  bg === "transparent" ||
                  bg === "initial" ||
                  bg === "inherit")
              ) {
                delete op.attributes.background;
              }

              // Also clean dark/black text colors from pasted websites so editor font color applies naturally
              const color = typeof op.attributes.color === "string" ? op.attributes.color.toLowerCase() : "";
              if (
                color &&
                (color === "#000000" ||
                  color === "#000" ||
                  color === "black" ||
                  color === "#111827" ||
                  color === "#1f2937" ||
                  color === "#222222" ||
                  color === "#222" ||
                  color === "#333333" ||
                  color === "#333" ||
                  color === "#444444" ||
                  color === "#444" ||
                  color === "#555555" ||
                  color === "#555" ||
                  color.includes("34, 34, 34") ||
                  color.includes("34,34,34") ||
                  color.includes("51, 51, 51") ||
                  color.includes("51,51,51") ||
                  color.includes("0, 0, 0") ||
                  color.includes("0,0,0"))
              ) {
                delete op.attributes.color;
              }

              if (op.attributes.font) {
                delete op.attributes.font;
              }
            }
          });
        }
        return delta;
      });
    }

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
          [{ size: ['small', false, 'large', 'huge'] }],
          ["bold", "italic", "underline", "strike"],
          [{ align: [] }],
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
      className={`rich-text-editor-container rounded-xl overflow-hidden border border-gray-200 bg-white transition-all focus-within:border-primary focus-within:ring-1 focus-within:ring-primary/30 dark:border-gray-700/60 dark:bg-[#1e2219] ${
        disabled ? "opacity-60 pointer-events-none" : ""
      } ${className}`}
      style={{
        ["--editor-min-height" as any]: minHeight,
      }}
    >
      <ReactQuill
        ref={quillRef}
        theme="snow"
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        readOnly={disabled}
        modules={modules}
        className="[&_.ql-toolbar]:border-none [&_.ql-toolbar]:border-b [&_.ql-toolbar]:border-gray-200 [&_.ql-toolbar]:bg-gray-50/80 dark:[&_.ql-toolbar]:bg-[#242821] dark:[&_.ql-toolbar]:border-[#333a2e] [&_.ql-container]:border-none [&_.ql-container]:text-sm [&_.ql-container]:text-gray-700 dark:[&_.ql-container]:text-[#dadfd0]"
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
        /* Strip hardcoded white/near-white backgrounds from pasted HTML in both light & dark themes */
        .rich-text-editor-container .ql-editor [style*="background-color: rgb(255, 255, 255)"],
        .rich-text-editor-container .ql-editor [style*="background-color:rgb(255,255,255)"],
        .rich-text-editor-container .ql-editor [style*="background-color: #ffffff"],
        .rich-text-editor-container .ql-editor [style*="background-color:#ffffff"],
        .rich-text-editor-container .ql-editor [style*="background-color: #fff"],
        .rich-text-editor-container .ql-editor [style*="background-color:#fff"],
        .rich-text-editor-container .ql-editor [style*="background-color: white"],
        .rich-text-editor-container .ql-editor [style*="background-color:white"],
        .rich-text-editor-container .ql-editor [style*="background: rgb(255, 255, 255)"],
        .rich-text-editor-container .ql-editor [style*="background:rgb(255,255,255)"],
        .rich-text-editor-container .ql-editor [style*="background: #ffffff"],
        .rich-text-editor-container .ql-editor [style*="background:#ffffff"],
        .rich-text-editor-container .ql-editor [style*="background: #fff"],
        .rich-text-editor-container .ql-editor [style*="background:#fff"],
        .rich-text-editor-container .ql-editor [style*="background: white"],
        .rich-text-editor-container .ql-editor [style*="background:white"],
        .rich-text-editor-container .ql-editor [style*="background-color: initial"],
        .rich-text-editor-container .ql-editor [style*="background-color: inherit"] {
          background: transparent !important;
          background-color: transparent !important;
        }

        /* In Dark Mode: completely eliminate unwanted inline backgrounds on every element inside ql-editor */
        :root[data-theme="dark"] .rich-text-editor-container .ql-editor *:not([class*="ql-bg-"]) {
          background: transparent !important;
          background-color: transparent !important;
        }
        :root[data-theme="dark"] .rich-text-editor-container .ql-editor span,
        :root[data-theme="dark"] .rich-text-editor-container .ql-editor p,
        :root[data-theme="dark"] .rich-text-editor-container .ql-editor div,
        :root[data-theme="dark"] .rich-text-editor-container .ql-editor font,
        :root[data-theme="dark"] .rich-text-editor-container .ql-editor strong,
        :root[data-theme="dark"] .rich-text-editor-container .ql-editor b,
        :root[data-theme="dark"] .rich-text-editor-container .ql-editor em,
        :root[data-theme="dark"] .rich-text-editor-container .ql-editor i,
        :root[data-theme="dark"] .rich-text-editor-container .ql-editor u,
        :root[data-theme="dark"] .rich-text-editor-container .ql-editor li {
          color: #f3f4f6 !important;
          background: transparent !important;
          background-color: transparent !important;
        }
        :root[data-theme="dark"] .rich-text-editor-container .ql-editor [style]:not([class*="ql-bg-"]) {
          background: transparent !important;
          background-color: transparent !important;
        }
        :root[data-theme="dark"] .rich-text-editor-container .ql-editor [style]:not([class*="ql-color-"]) {
          color: #f3f4f6 !important;
        }
        :root[data-theme="dark"] .rich-text-editor-container .ql-editor strong,
        :root[data-theme="dark"] .rich-text-editor-container .ql-editor b,
        :root[data-theme="dark"] .rich-text-editor-container .ql-editor h1,
        :root[data-theme="dark"] .rich-text-editor-container .ql-editor h2,
        :root[data-theme="dark"] .rich-text-editor-container .ql-editor h3 {
          color: #ffffff !important;
        }
      `}</style>
    </div>
  );
};

export default RichTextEditor;

