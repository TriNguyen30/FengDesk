import { useCallback, useEffect, useRef, useState } from "react";

// Web Speech API chưa có trong lib.dom.d.ts chuẩn của TS — khai báo tối thiểu phần dùng tới.
interface SpeechRecognitionResultLike {
  isFinal: boolean;
  0: { transcript: string };
}
interface SpeechRecognitionEventLike extends Event {
  results: ArrayLike<SpeechRecognitionResultLike>;
}
interface SpeechRecognitionLike extends EventTarget {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  start(): void;
  stop(): void;
  onresult: ((e: SpeechRecognitionEventLike) => void) | null;
  onerror: ((e: Event) => void) | null;
  onend: (() => void) | null;
}
type SpeechRecognitionCtor = new () => SpeechRecognitionLike;

function getSpeechRecognitionCtor(): SpeechRecognitionCtor | null {
  const w = window as unknown as {
    SpeechRecognition?: SpeechRecognitionCtor;
    webkitSpeechRecognition?: SpeechRecognitionCtor;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

// Trình duyệt tự ngắt khi im lặng theo ngưỡng RIÊNG của nó (thường ngắn hơn mong muốn) — mình tự
// nới ra bằng cách: (1) tự canh giờ im lặng riêng (chỉ thật sự dừng sau ngần này kể từ kết quả cuối),
// (2) nếu trình duyệt tự ngắt SỚM hơn ngưỡng này (onend) mà user chưa chủ động dừng → âm thầm
// restart 1 recognition mới ngay, liền mạch, để user không cảm thấy bị cắt ngang.
const SILENCE_TIMEOUT_MS = 6000;

/**
 * Wrapper Web Speech API (giọng nói → text NGAY TRÊN BROWSER, audio không rời máy).
 * Safari/Firefox chưa hỗ trợ → isSupported=false, FE ẩn nút mic, chỉ còn gõ tay.
 */
export function useSpeechInput() {
  const [isSupported] = useState(() => getSpeechRecognitionCtor() !== null);
  const [isListening, setIsListening] = useState(false);

  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const userStoppedRef = useRef(false);
  const silenceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearSilenceTimer = () => {
    if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
    silenceTimerRef.current = null;
  };

  const finalize = useCallback(() => {
    clearSilenceTimer();
    recognitionRef.current?.stop();
    recognitionRef.current = null;
    setIsListening(false);
  }, []);

  const stop = useCallback(() => {
    userStoppedRef.current = true;
    finalize();
  }, [finalize]);

  const start = useCallback(
    (onTranscript: (text: string, isFinal: boolean) => void, lang: string = "vi-VN") => {
      const Ctor = getSpeechRecognitionCtor();
      if (!Ctor) return;

      userStoppedRef.current = false;
      let lastText = "";

      const resetSilenceTimer = () => {
        clearSilenceTimer();
        silenceTimerRef.current = setTimeout(() => {
          userStoppedRef.current = true; // im lặng đủ lâu — coi như user đã nói xong
          finalize();
        }, SILENCE_TIMEOUT_MS);
      };

      const launch = () => {
        const recognition = new Ctor();
        recognition.lang = lang;
        recognition.interimResults = true;
        recognition.continuous = true;

        recognition.onresult = (e) => {
          let text = "";
          let isFinal = false;
          for (let i = 0; i < e.results.length; i++) {
            text += e.results[i][0].transcript;
            if (i === e.results.length - 1) isFinal = e.results[i].isFinal;
          }
          // isFinal chỉ nghĩa là "câu này chốt xong", KHÔNG phải "user nói xong" — trong chế độ
          // continuous vẫn còn nghe tiếp cho câu sau, không tự dừng ở đây (caller cũng không nên
          // tự stop() khi thấy isFinal, kẻo cắt ngang phiên nghe liên tục).
          //
          // Chỉ reset giờ im lặng khi CHỮ THẬT SỰ THAY ĐỔI — tạp âm nền vẫn có thể khiến engine bắn
          // onresult liên tục với transcript giữ nguyên (không sinh chữ mới), nếu cứ reset vô điều
          // kiện thì bộ đếm 6s không bao giờ chạy tới. "Ngừng sinh chữ mới" mới là tín hiệu thật của
          // việc user đã nói xong, không phải "còn tiếng động".
          if (text !== lastText) {
            lastText = text;
            resetSilenceTimer();
          }
          onTranscript(text, isFinal);
        };
        recognition.onerror = () => {
          // Lỗi thật (mất quyền mic, không có thiết bị...) — không tự restart, dừng hẳn.
          userStoppedRef.current = true;
          finalize();
        };
        recognition.onend = () => {
          // Trình duyệt tự ngắt theo ngưỡng riêng của nó nhưng user CHƯA chủ động dừng và mình
          // CHƯA hết giờ im lặng riêng → ngắt "giả", tự khởi động lại ngay cho liền mạch.
          if (!userStoppedRef.current) launch();
        };

        recognitionRef.current = recognition;
        recognition.start();
        setIsListening(true);
      };

      launch();
      resetSilenceTimer();
    },
    [finalize],
  );

  // Dừng nghe khi component unmount (đổi bước, đóng modal...).
  useEffect(
    () => () => {
      userStoppedRef.current = true;
      clearSilenceTimer();
      recognitionRef.current?.stop();
    },
    [],
  );

  return { isSupported, isListening, start, stop };
}
