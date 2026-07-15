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
  // Whisper (BE) chốt kết quả chính xác hơn, tự nhận diện vi/en/nói trộn. Web Speech vẫn chạy song song
  // cho preview live + fallback khi Whisper down (giữ flow cũ).
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

  // Hủy ghi âm Whisper nếu component unmount giữa chừng (đổi bước, đóng modal).
  useEffect(() => cancelRecording, [cancelRecording]);

  // Text preview live từ Web Speech trong lượt nói hiện tại — dùng làm fallback nếu Whisper lỗi.
  const livePreviewRef = useRef("");

  const toggleMic = async () => {
    if (isListening) {
      // Dừng: chốt bằng Whisper. Trong lúc chờ, giữ nguyên preview Web Speech (đỡ trống màn hình).
      stop();
      const base = voiceBaseRef.current;
      const whisperText = await stopAndTranscribe();
      // Whisper OK → thay preview bằng bản chính xác; lỗi/null → giữ text Web Speech (flow cũ).
      const finalText = whisperText ?? livePreviewRef.current;
      if (finalText) setDescription(base ? `${base} ${finalText}` : finalText);
      return;
    }

    voiceBaseRef.current = description.trim();
    livePreviewRef.current = "";
    // Ghi âm cho Whisper (fire-and-forget — thất bại thì Web Speech vẫn gánh).
    void startRecording();
    // Web Speech: preview live trong lúc nói.
    start((text) => {
      // Lưu ý: KHÔNG tự stop() khi isFinal — isFinal chỉ nghĩa "câu này chốt xong", không phải
      // "user nói xong". Ở continuous mode, tự stop() ở đây sẽ cắt ngang phiên nghe liên tục
      // ngay khi engine chốt câu đầu tiên (đây từng là nguyên nhân mic tự ngắt giữa chừng).
      livePreviewRef.current = text;
      const base = voiceBaseRef.current;
      setDescription(base && text ? `${base} ${text}` : base || text);
    }, speechLang);
  };

  // Mic khả dụng nếu browser có MediaRecorder (Whisper) HOẶC Web Speech. Rộng hơn isSupported cũ →
  // Safari/Firefox (không có Web Speech) vẫn ghi âm gửi Whisper được.
  const micAvailable =
    isSupported || (typeof window !== "undefined" && "MediaRecorder" in window && !!navigator.mediaDevices);

  const trimmed = description.trim();
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
            title={att.items.length >= MAX_IMAGES ? `Tối đa ${MAX_IMAGES} ảnh` : "Đính kèm ảnh phòng"}
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
          {/* Toggle ngôn ngữ chỉ ảnh hưởng preview Web Speech — Whisper tự nhận diện vi/en/nói trộn. */}
          {isSupported && !isListening && !isTranscribing && (
            <button
              type="button"
              onClick={() => setSpeechLang((l) => (l === "vi-VN" ? "en-US" : "vi-VN"))}
              title="Ngôn ngữ preview khi đang nói (Whisper tự nhận diện, không cần chọn)"
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
        <label className="flex cursor-pointer items-s