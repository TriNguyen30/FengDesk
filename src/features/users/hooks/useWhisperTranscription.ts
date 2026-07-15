import { useCallback, useRef, useState } from "react";
import fetchHttpClient from "@/lib/httpClient";
import type { ApiResponse } from "@/types/api";

/**
 * Cờ bật/tắt Whisper LẤY TỪ BE (GET /workspace/speech-config → { enabled }). BE là nguồn điều khiển
 * duy nhất: đổi Speech:Enabled ở BE là FE tự theo, không cần build lại FE. Cache 1 lần/lần tải trang.
 * Lỗi mạng khi hỏi cờ → coi như TẮT (an toàn: chỉ dùng Web Speech).
 */
let whisperEnabledCache: Promise<boolean> | null = null;
function isWhisperEnabled(): Promise<boolean> {
  if (!whisperEnabledCache) {
    whisperEnabledCache = fetchHttpClient
      .get<ApiResponse<{ enabled: boolean }>>("/workspace/speech-config")
      .then((res) => res.data?.data?.enabled === true)
      .catch(() => false);
  }
  return whisperEnabledCache;
}

/**
 * Ghi âm bằng MediaRecorder → gửi BE /workspace/transcriptions (Whisper) → text.
 * Whisper tự nhận diện tiếng Việt / Anh / nói trộn — không cần chọn ngôn ngữ.
 * Dùng KẾT HỢP với useSpeechInput (Web Speech): Web Speech cho preview live + fallback khi
 * Whisper lỗi/down (giữ flow cũ); Whisper cho kết quả chốt chính xác hơn.
 */
export function useWhisperTranscription() {
  const [isTranscribing, setIsTranscribing] = useState(false);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);

  /** Bắt đầu ghi âm. Trả false nếu Whisper tắt (BE) hoặc không xin được mic (caller vẫn chạy Web Speech). */
  const startRecording = useCallback(async (): Promise<boolean> => {
    if (!(await isWhisperEnabled())) return false; // BE tắt STT → bỏ qua, để Web Speech gánh
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      chunksRef.current = [];
      const mimeType = MediaRecorder.isTypeSupported("audio/webm") ? "audio/webm" : "";
      const recorder = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorder.start(1000); // gom chunk mỗi giây — không mất dữ liệu nếu stop đột ngột
      recorderRef.current = recorder;
      return true;
    } catch {
      return false; // không có mic / user từ chối — Web Speech (nếu có) vẫn tự chạy phần của nó
    }
  }, []);

  /**
   * Dừng ghi và gửi Whisper. Trả text chốt, hoặc null nếu lỗi (caller giữ text Web Speech làm fallback).
   */
  const stopAndTranscribe = useCallback(async (): Promise<string | null> => {
    const recorder = recorderRef.current;
    recorderRef.current = null;
    if (!recorder) return null; // không có bản ghi (BE tắt hoặc không xin được mic) → dùng text Web Speech

    const blob = await new Promise<Blob>((resolve) => {
      recorder.onstop = () => resolve(new Blob(chunksRef.current, { type: recorder.mimeType || "audio/webm" }));
      recorder.stop();
    });
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;

    if (blob.size < 1000) return null; // quá ngắn/rỗng — không đáng gửi

    setIsTranscribing(true);
    try {
      const formData = new FormD