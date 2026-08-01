import { memo } from "react";
import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";

// Chỉ override <a> (mở tab mới + style); các thẻ khác style qua class .fd-md trong index.css
// để tránh phải destructure prop `node` của react-markdown (vướng no-unused-vars).
const COMPONENTS: Components = {
  a: (props) => (
    <a
      href={props.href}
      target="_blank"
      rel="noreferrer"
      className="font-medium text-primary underline underline-offset-2 hover:opacity-80"
    >
      {props.children}
    </a>
  ),
};

/**
 * Render nội dung tin nhắn AI dạng Markdown (đậm, tiêu đề, danh sách, link). An toàn — không innerHTML.
 *
 * `memo` là bắt buộc, không phải tối ưu vặt: khung chat re-render liên tục (animation suy luận, kéo
 * resize), mà mỗi lần render `ReactMarkdown` sẽ chạy lại cả pipeline remark/rehype cho TỪNG tin nhắn.
 * Prop chỉ có `text` nên so sánh nông là đủ và luôn đúng.
 */
function Markdown({ text }: { text: string }) {
  return (
    <div className="fd-md text-sm leading-relaxed break-words">
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={COMPONENTS}>
        {text}
      </ReactMarkdown>
    </div>
  );
}

export default memo(Markdown);
