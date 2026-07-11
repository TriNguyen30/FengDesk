// Khớp với BE (FengDeskAI.Application.Interfaces.External.AiActivityEvent).
// Dùng chung cho mọi khâu có AI (chat, workspace intake, recommendation explain…) — khóa định tuyến
// là operationId tự do, KHÔNG gắn cứng vào chatboxId.

export type AiActivityPhase =
  | "thinking"
  | "calling_tool"
  | "writing"
  | "narration"
  | "done"
  | "error";

export interface AiActivity {
  operationId: string;
  phase: AiActivityPhase;
  toolName?: string | null;
  /** phase="narration": lời dẫn trung gian của model (ephemeral — BE không lưu DB). */
  note?: string | null;
}
