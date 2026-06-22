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

/** Render nội dung tin nhắn AI dạng Markdown (đậm, tiêu đề, danh sách, link). An toàn — không innerHTML. */
export default function Markdown({ text }: { text: string }) {
  return (
    <div className="fd-md text-sm leading-relaxed break-words">
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={COMPONENTS}>
        {text}
      </ReactMarkdown>
    </div>
  );
}
