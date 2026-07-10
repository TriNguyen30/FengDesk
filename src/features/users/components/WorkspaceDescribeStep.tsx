import { useState } from "react";
import { Mic, MicOff, Sparkles } from "lucide-react";
import { useSpeechInput } from "../hooks/useSpeechInput";

interface WorkspaceDescribeStepProps {
  onAnalyze: (description: string) => void;
  onSkip: () => void;
  isAnalyzing: boolean;
}

const MIN_LENGTH = 10;
const MAX_LENGTH = 2000;

/** Bước 1 luồng "Add Workspace": mô tả bằng lời (gõ hoặc nói) → AI phân tích thành draft. */
export default function WorkspaceDescribeStep({
  onAnalyze,
  onSkip,
  isAnalyzing,
}: WorkspaceDescribeStepProps) {
  const [description, setDescription] = useState("");
  const { isSupported, isListening, start, stop } = useSpeechInput();

  const toggleMic = () => {
    if (isListening) {
      stop();
      return;
    }
    start((text, isFinal) => {
      setDescription(text);
      if (isFinal) stop();
    });
  };

  const trimmed = description.trim();
  const canAnalyze = trimmed.length >= MIN_LENGTH && trimmed.length <= MAX_LENGTH && !isAnalyzing;

  return (
    <div className="p-6">
      <p className="mb-3 text-sm text-gray-600">
        Mô tả không gian làm việc bằng lời — vị trí, ánh sáng, bàn, màu/vật liệu, mục đích sử dụng.
        AI sẽ điền sẵn form, bạn chỉ cần kiểm tra lại.
      </p>

      <div className="relative">
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={5}
          maxLength={MAX_LENGTH}
          placeholder='Vd: "Bàn làm việc ở nhà cạnh cửa sổ hướng đông, nhiều nắng sáng, bàn gỗ màu nâu, tôi hay ngồi học bài"'
          className="w-full resize-none rounded-xl border border-gray-300 px-3 py-2.5 pr-12 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
        />
        {isSupported && (
          <button
            type="button"
            onClick={toggleMic}
            aria-pressed={isListening}
            title={isListening ? "Đang nghe — bấm để dừng" : "Nói để mô tả"}
            className={`absolute right-2.5 top-2.5 flex h-8 w-8 items-center justify-center rounded-full transition-colors cursor-pointer ${
              isListening
                ? "animate-pulse bg-red-500 text-white"
                : "bg-primary/10 text-primary hover:bg-primary/20"
            }`}
          >
            {isListening ? <MicOff size={16} /> : <Mic size={16} />}
          </button>
        )}
      </div>

      <div className="mt-1 flex items-center justify-between text-xs text-gray-400">
        <span>{isListening ? "Đang nghe..." : " "}</span>
        <span>
          {trimmed.length}/{MAX_LENGTH}
        </span>
      </div>

      <div className="mt-5 flex gap-3">
        <button
          type="button"
          onClick={onSkip}
          className="flex-1 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer"
        >
          Bỏ qua, điền thủ công
        </button>
        <button
          type="button"
          onClick={() => onAnalyze(trimmed)}
          disabled={!canAnalyze}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-white hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50 transition-colors cursor-pointer"
        >
          <Sparkles size={16} />
          {isAnalyzing ? "Đang phân tích..." : "Để AI điền giúp"}
        </button>
      </div>
    </div>
  );
}
