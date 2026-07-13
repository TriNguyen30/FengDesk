import { useCallback, useRef, useState } from "react";

const BAR_COUNT = 9;
const IDLE_LEVEL = 0.08;

/**
 * Đọc mức âm lượng mic THẬT (Web Audio API AnalyserNode) để vẽ audio visualizer — tách biệt hoàn
 * toàn với SpeechRecognition (API đó không lộ dữ liệu âm thanh thô). Gọi song song getUserMedia
 * riêng; cùng permission gốc nên không hỏi lại quyền lần 2. Dừng phải tự release track (stream.stop)
 * để tắt hẳn đèn mic của trình duyệt.
 */
export function useMicLevel() {
  const [levels, setLevels] = useState<number[]>(() => new Array(BAR_COUNT).fill(IDLE_LEVEL));
  const streamRef = useRef<MediaStream | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const rafRef = useRef<number | null>(null);

  const stop = useCallback(() => {
    if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    if (audioCtxRef.current) void audioCtxRef.current.close().catch(() => {});
    audioCtxRef.current = null;
    setLevels(new Array(BAR_COUNT).fill(IDLE_LEVEL));
  }, []);

  const start = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const ctx = new AudioContext();
      audioCtxRef.current = ctx;
      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 128;
      analyser.smoothingTimeConstant = 0.6;
      source.connect(analyser);

      const data = new Uint8Array(analyser.frequencyBinCount);

      // Bin tần số của AnalyserNode chia ĐỀU theo Hz (0 → Nyquist), nhưng năng lượng giọng nói dồn
      // gần hết ở dải thấp (~85-2000Hz) — chia bucket ĐỀU sẽ khiến các bar sau chỉ toàn im lặng.
      // Dùng bucket chia THEO LOG (như 1 EQ thật) để dồn độ phân giải vào đúng dải giọng nói, cho
      // cảm giác các bar "nhảy" đều nhau thay vì chỉ có vài bar đầu tiên phản ứng.
      const minBin = 2; // bỏ bin 0 (DC offset, không mang thông tin âm lượng)
      //const maxBin = data.length - 1;
      const maxBin = Math.floor(data.length / 4);
      const bucketEdges = Array.from({ length: BAR_COUNT + 1 }, (_, i) =>
        Math.round(minBin * Math.pow(maxBin / minBin, i / BAR_COUNT)),
      );

      const tick = () => {
        analyser.getByteFrequencyData(data);
        const next = new Array(BAR_COUNT).fill(0).map((_, i) => {
          const from = bucketEdges[i];
          const to = Math.max(from + 1, bucketEdges[i + 1]);
          let sum = 0;
          let count = 0;
          for (let j = from; j < to && j < data.length; j++) {
            sum += data[j];
            count++;
          }
          const avg = count > 0 ? sum / count : 0;
          // Bù nhẹ cho bar tần số cao (vốn dĩ ít năng lượng hơn) để cả dải nhảy cân đối hơn.
          const gain = 1 + i * 0.12;
          return Math.min(1, Math.max(IDLE_LEVEL, (avg * gain) / 320));
        });
        setLevels(next);
        rafRef.current = requestAnimationFrame(tick);
      };
      tick();
    } catch {
      // Không lấy được stream riêng (hiếm — vd trình duyệt chặn getUserMedia lần 2) — bỏ qua,
      // chỉ mất hiệu ứng visualizer, KHÔNG ảnh hưởng nhận diện giọng nói (dùng luồng riêng của nó).
    }
  }, []);

  return { levels, start, stop };
}
