// Khớp với BE (FengDeskAI.Application.Interfaces.External.AiActivityEvent).
// Dùng chung cho mọi khâu có AI (chat, workspace intake, recommendation explain…) — khóa định tuyến
// là operationId tự do, KHÔNG gắn cứng vào chatboxId.

export type AiActivityPhase = "thinking" | "calling_tool" | "writing" | "done" | "error";

export interface AiActivity {
  operationId: string;
  phase: AiActivityPhase;
  toolName?: string | null;
}
