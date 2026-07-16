import { useEffect, useRef, useState } from "react";
import { Brain, ImagePlus, Info, Loader2, Mic, MicOff, Sparkles } from "lucide-react";
import AttachmentPreviewRow from "@/features/chatbox/components/AttachmentPreviewRow";
import { useImageAttachments } from "@/features/chatbox/hooks/useImageAttachments";
import { uploadWorkspaceImage } from "../api/workspace.api";
import { useMicLevel } from "../hooks/useMicLevel";
import { useSpeechInput } from "../hooks/useSpeechInput";
import { useWhisperTranscription } from "../hooks/useWhisperTranscription";
import VoiceListeningOverlay from "./VoiceListeningOverlay";

interface WorkspaceDescribeStepProps {
  onAnalyze: (description: string, imageUrls?: string[], think?: boolean) => void;
  onSkip: () => void;
  isAnalyzing: boolean;
}

const MIN_LENGTH = 10;
const MAX_LENGTH = 2000;
const MAX_IMAGES = 3;

/** Bước 1 luồng "Add Workspace": mô tả bằng lời (gõ/nói) + ảnh tùy chọn → AI phân tích thành draft. */
export default function WorkspaceDescribeStep({
  onAnalyze,
  onSkip,
  isAnalyzing,
}: WorkspaceDescribeStepProps) {
  const [description, setDescription] = useState("");
  // Công tắc "suy nghĩ kỹ": bật thinking cho model → kỹ hơn nhưng CHẬM hơn nhiều (mặc định tắt cho nhanh).
  const [deepThink, setDeepThink] = useState(false);
  const [speechLang, setSpeechLang] = useState<"vi-VN" | "en-US">("vi-VN");
  const { isSupported, isListening, start, stop } = useSpeechInput();
  // Whisper (BE) chốt chính xác hơn, tự nhận diện vi/en/nói trộn. Web Speech vẫn chạy song song cho
  // preview live + fallback khi Whisper tắt/down (giữ flow cũ). Bật/tắt điều khiển từ BE (Speech:Enabled).
  const { isTranscribing, startRecording, stopAndTranscribe, cancelRecording } = useWhisperTranscription();
  const micLevel = useMicLevel();
  const att = useImageAttachments(uploadWorkspaceImage);
  const fileRef = useRef<HTMLInputElement>(null);
  // Chữ đã có TRƯỚC khi bấm mic (gõ tay hoặc lượt nói trước) — giữ lại để nói tiếp không đè mất.
  const voiceBaseRef = useRef("");

  // micLevel (audio visualizer) đi theo isListening bất kể lý do dừng là gì — kể cả khi
  // useSpeechInput tự dừng ngầm sau 6s im lặng (không có callback riêng cho case đó).
  useEffect(() => {
    if (isListening) void micLevel.start();
    else micLevel.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isListening]);

  // Hủy ghi âm Whisper nếu component unmount giữa chừng.
  useEffect(() => cancelRecording, [cancelRecording]);

  // Text preview live từ Web Speech trong lượt nói — fallback nếu Whisper lỗi.
  const livePreviewRef = useRef("");

  const toggleMic = async () => {
    if (isListening) {
      // Dừng: chốt bằng Whisper; nếu lỗi/tắt → giữ text Web Speech (flow cũ).
      stop();
      const base = voiceBaseRef.current;
      const whisperText = await stopAndTranscribe();
      const finalText = whisperText ?? livePreviewRef.current;
      if (finalText) setDescription(base ? `${base} ${finalText}` : finalText);
      return;
    }
    voiceBaseRef.current = description.trim();
    livePreviewRef.current = "";
    void startRecording();
    start((text) => {
      // Lưu ý: KHÔNG tự stop() khi isFinal — isFinal chỉ nghĩa "câu này chốt xong", không phải
      // "user nói xong". Ở continuous mode, tự stop() ở đây sẽ cắt ngang phiên nghe liên tục
      // ngay khi engine chốt câu đầu tiên (đây từng là nguyên nhân mic tự ngắt giữa chừng).
      livePreviewRef.current = text;
      const base = voiceBaseRef.current;
      setDescription(base && text ? `${base} ${text}` : base || text);
    }, speechLang);
  };

  const trimmed = description.trim();
  // Mic khả dụng nếu có MediaRecorder (Whisper) HOẶC Web Speech → Safari/Firefox vẫn ghi âm gửi Whisper.
  const micAvailable =
    isSupported || (typeof window !== "undefined" && "MediaRecorder" in window && !!navigator.mediaDevices);
  // Có ảnh rồi thì mô tả chữ không bắt buộc — ảnh cũng là bằng chứng để AI phân tích.
  const canAnalyze =
    (trimmed.length >= MIN_LENGTH || att.urls.length > 0) &&
    trimmed.length <= MAX_LENGTH &&
    !isAnalyzing &&
    !att.uploading;

  return (
    <div className="p-6">
      <p className="mb-3 text-sm text-gray-600">
        Mô tả không gian làm việc bằng lời và/hoặc đính kèm ảnh chụp phòng — vị trí, ánh sáng, bàn,
        màu/vật liệu, mục đích sử dụng. AI sẽ điền sẵn form, bạn chỉ cần kiểm tra lại.
      </p>

      <AttachmentPreviewRow items={att.items} onRemove={att.remove} />

      <div className="relative">
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={5}
          maxLength={MAX_LENGTH}
          placeholder='Vd: "Bàn làm việc ở nhà cạnh cửa sổ hướng đông, nhiều nắng sáng, bàn gỗ màu nâu, tôi hay ngồi học bài"'
          className="min-h-[160px] w-full resize-none rounded-xl border border-gray-300 px-3 py-2.5 pr-20 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
        />
        <div className="absolute right-2.5 top-2.5 flex flex-col gap-1.5">
          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png,image/bmp,image/gif"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) att.add(file);
              e.target.value = "";
            }}
          />
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={att.items.length >= MAX_IMAGES}
            title={
              att.items.length >= MAX_IMAGES ? `Tối đa ${MAX_IMAGES} ảnh` : "Đính kèm ảnh phòng"
            }
            className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary transition-colors hover:bg-primary/20 disabled:cursor-not-allowed disabled:opacity-40 cursor-pointer"
          >
            <ImagePlus size={16} />
          </button>
          {micAvailable && (
            <button
              type="button"
              onClick={toggleMic}
              disabled={isTranscribing}
              aria-pressed={isListening}
              title={
                isTranscribing
                  ? "Đang chuyển giọng nói thành chữ..."
                  : isListening
                    ? "Đang nghe — bấm để dừng"
                    : "Nói để mô tả"
              }
              className={`flex h-8 w-8 items-center justify-center rounded-full transition-colors cursor-pointer disabled:cursor-wait ${
                isListening
                  ? "animate-pulse bg-red-500 text-white"
                  : "bg-primary/10 text-primary hover:bg-primary/20"
              }`}
            >
              {isTranscribing ? (
                <Loader2 size={16} className="animate-spin" />
              ) : isListening ? (
                <MicOff size={16} />
              ) : (
                <Mic size={16} />
              )}
            </button>
          )}
          {isSupported && !isListening && !isTranscribing && (
            <button
              type="button"
              onClick={() => setSpeechLang((l) => (l === "vi-VN" ? "en-US" : "vi-VN"))}
              title="Ngôn ngữ nhận diện giọng nói"
              className="flex h-8 w-8 items-center justify-center rounded-full border border-gray-300 text-[10px] font-semibold text-gray-500 transition-colors hover:border-primary hover:text-primary cursor-pointer"
            >
              {speechLang === "vi-VN" ? "VI" : "EN"}
            </button>
          )}
        </div>

        <VoiceListeningOverlay active={isListening} levels={micLevel.levels} />
      </div>

      <div className="mt-1 flex items-center justify-between text-xs text-gray-400">
        <span>{isTranscribing ? "Đang chuyển thành chữ..." : isListening ? "Đang nghe..." : " "}</span>
        <span>
          {trimmed.length}/{MAX_LENGTH}
        </span>
      </div>

      {/* Công tắc suy nghĩ kỹ — mặc định tắt (nhanh). Bật để model phân tích sâu hơn, đổi lại chậm hơn nhiều. */}
      <div className="group relative mt-4">
        <label className="flex cursor-pointer items-start gap-2.5 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 transition-colors duration-200 group-hover:border-primary/40 group-hover:bg-gray-100">
          <input
            type="checkbox"
            checked={deepThink}
            onChange={(e) => setDeepThink(e.target.checked)}
            disabled={isAnalyzing}
            className="mt-0.5 h-4 w-4 shrink-0 cursor-pointer accent-primary disabled:cursor-not-allowed"
          />
          <span className="flex flex-col">
            <span className="flex items-center gap-1.5 text-sm font-medium text-gray-800">
              <Brain size={14} className="text-primary" />
              Cho AI suy nghĩ kỹ hơn
            </span>
          </span>
        </label>

        <div className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-2 hidden w-64 -translate-x-1/2 rounded-lg border border-gray-200 bg-gray-100 px-3 py-2 text-xs leading-5 text-gray-600 shadow-sm opacity-0 transition-all duration-200 ease-out group-hover:block group-hover:translate-y-[-4px] group-hover:opacity-100">
          <div className="mb-1 flex items-center gap-1.5 font-medium text-gray-700">
            <Info size={12} className="shrink-0" />
            <span>Thông tin</span>
          </div>
          <div>
            Phân tích sâu & chính xác hơn, nhưng chậm hơn đáng kể (có thể lâu gấp nhiều lần).
          </div>
        </div>
      </div>

      <div className="mt-4 flex gap-3">
        <button
          type="button"
          onClick={onSkip}
          className="flex-1 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer"
        >
          Bỏ qua, điền thủ công
        </button>
        <button
          type="button"
          onClick={() => onAnalyze(trimmed, att.urls.length > 0 ? att.urls : undefined, deepThink)}
          disabled={!canAnalyze}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-white hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50 transition-colors cursor-pointer"
        >
          <Sparkles size={16} />
          {isAnalyzing
            ? "Đang phân tích..."
            : att.uploading
              ? "Đang tải ảnh..."
              : "Để AI điền giúp"}
        </button>
      </div>
    </div>
  );
}