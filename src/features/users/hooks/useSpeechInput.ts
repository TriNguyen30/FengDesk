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

/**
 * Wrapper Web Speech API (giọng nói → text NGAY TRÊN BROWSER, audio không rời máy).
 * Safari/Firefox chưa hỗ trợ → isSupported=false, FE ẩn nút mic, chỉ còn gõ tay.
 */
export function useSpeechInput() {
  const [isSupported] = useState(() => getSpeechRecognitionCtor() !== null);
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);

  const stop = useCallback(() => {
    recognitionRef.current?.stop();
    setIsListening(false);
  }, []);

  const start = useCallback((onTranscript: (text: string, isFinal: boolean) => void) => {
    const Ctor = getSpeechRecognitionCtor();
    if (!Ctor) return;

    const recognition = new Ctor();
    recognition.lang = "vi-VN";
    recognition.interimResults = true;
    recognition.continuous = true;

    recognition.onresult = (e) => {
      let text = "";
      let isFinal = false;
      for (let i = 0; i < e.results.length; i++) {
        text += e.results[i][0].transcript;
        if (i === e.results.length - 1) isFinal = e.results[i].isFinal;
      }
      onTranscript(text, isFinal);
    };
    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);

    recognitionRef.current = recognition;
    recognition.start();
    setIsListening(true);
  }, []);

  // Dừng nghe khi component unmount (đổi bước, đóng modal...).
  useEffect(() => () => recognitionRef.current?.stop(), []);

  return { isSupported, isListening, start, stop };
}
