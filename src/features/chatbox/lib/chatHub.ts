import {
  HubConnection,
  HubConnectionBuilder,
  HubConnectionState,
  LogLevel,
} from "@microsoft/signalr";
import { API_BASE_URL } from "@/config/env";
import { getAccessToken } from "@/utils";

/** Hub nằm ở gốc server (không dưới /api). Bỏ hậu tố "/api" của base URL rồi gắn "/hubs/chat". */
function resolveHubUrl(): string {
  const base = (API_BASE_URL ?? "").replace(/\/api\/?$/i, "").replace(/\/+$/, "");
  return `${base}/hubs/chat`;
}

type HubEvent = "messageReceived" | "chatboxRead" | "userJoined" | "userLeft" | "aiStatus" | "error";

/**
 * Quản lý 1 kết nối SignalR dùng chung cho toàn app (singleton).
 * BE đọc token qua query "access_token" cho đường /hubs (xem cấu hình JwtBearer),
 * nên truyền accessTokenFactory là đủ.
 */
class ChatHubClient {
  private connection: HubConnection | null = null;
  private starting: Promise<void> | null = null;
  private token: string | null = null;

  private build(): HubConnection {
    const connection = new HubConnectionBuilder()
      .withUrl(resolveHubUrl(), {
        accessTokenFactory: () => getAccessToken() ?? "",
        // Dùng bearer token (không cookie) → tắt credentials để tương thích CORS AllowAnyOrigin ("*").
        // Nếu bật credentials, browser chặn negotiate khi server trả Access-Control-Allow-Origin: *.
        withCredentials: false,
      })
      .withAutomaticReconnect()
      .configureLogging(LogLevel.Warning)
      .build();
    return connection;
  }

  /**
   * Khởi tạo + start kết nối (idempotent, dùng chung toàn app). Nếu token đổi (đăng nhập tài khoản
   * khác) → reset kết nối để negotiate lại với token mới. Consumers gọi connect() và KHÔNG tự disconnect.
   */
  async connect(): Promise<void> {
    const token = getAccessToken() ?? "";
    if (this.connection && this.token !== token) {
      await this.disconnect();
    }
    this.token = token;

    if (this.connection?.state === HubConnectionState.Connected) return;
    if (!this.connection) this.connection = this.build();
    if (this.starting) return this.starting;

    if (this.connection.state === HubConnectionState.Disconnected) {
      this.starting = this.connection
        .start()
        .finally(() => {
          this.starting = null;
        });
      return this.starting;
    }
  }

  async disconnect(): Promise<void> {
    const conn = this.connection;
    this.connection = null;
    this.starting = null;
    this.token = null;
    if (conn) await conn.stop();
  }

  get state(): HubConnectionState {
    return this.connection?.state ?? HubConnectionState.Disconnected;
  }

  // ----- Hub method invocations -----

  async joinChatbox(chatboxId: string): Promise<void> {
    await this.connect();
    await this.connection?.invoke("JoinChatbox", chatboxId);
  }

  async leaveChatbox(chatboxId: string): Promise<void> {
    if (this.connection?.state === HubConnectionState.Connected) {
      await this.connection.invoke("LeaveChatbox", chatboxId);
    }
  }

  async markChatboxRead(chatboxId: string): Promise<void> {
    if (this.connection?.state === HubConnectionState.Connected) {
      await this.connection.invoke("MarkChatboxRead", chatboxId);
    }
  }

  // ----- Event subscription -----

  on<T = unknown>(event: HubEvent, handler: (payload: T) => void): void {
    this.connection?.on(event, handler as (...args: unknown[]) => void);
  }

  off(event: HubEvent, handler?: (...args: unknown[]) => void): void {
    if (handler) this.connection?.off(event, handler);
    else this.connection?.off(event);
  }

  /** Đăng ký callback vòng đời để cập nhật trạng thái UI. */
  onReconnecting(cb: () => void): void {
    this.connection?.onreconnecting(cb);
  }
  onReconnected(cb: () => void): void {
    this.connection?.onreconnected(cb);
  }
  onClose(cb: () => void): void {
    this.connection?.onclose(cb);
  }
}

export const chatHub = new ChatHubClient();
