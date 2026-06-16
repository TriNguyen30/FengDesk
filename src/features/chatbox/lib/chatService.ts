import {
  addDoc,
  collection,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  doc,
} from "firebase/firestore";
import { getFirestoreDb, isFirebaseConfigured } from "@/lib/firebase";
import type {
  ChatMessage,
  MessageListener,
  SendMessageParams,
  Unsubscribe,
} from "@/features/chatbox/types/chatbox";

const LOCAL_STORAGE_PREFIX = "fengdesk_chat_messages_";
const BOT_REPLIES = [
  "Cảm ơn bạn đã liên hệ FengDesk! Nhân viên sẽ phản hồi trong giây lát.",
  "Bạn có thể cho mình biết thêm về không gian bàn làm việc (ánh sáng, diện tích) để được tư vấn cây phù hợp nhé!",
  "FengDesk hỗ trợ miễn phí vận chuyển đơn từ 500.000đ. Bạn cần tư vấn thêm sản phẩm nào không?",
];

function getLocalStorageKey(roomId: string): string {
  return `${LOCAL_STORAGE_PREFIX}${roomId}`;
}

function readLocalMessages(roomId: string): ChatMessage[] {
  try {
    const raw = localStorage.getItem(getLocalStorageKey(roomId));
    if (!raw) return [];
    const parsed = JSON.parse(raw) as ChatMessage[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeLocalMessages(roomId: string, messages: ChatMessage[]): void {
  localStorage.setItem(getLocalStorageKey(roomId), JSON.stringify(messages));
}

function createMessage(params: SendMessageParams): ChatMessage {
  return {
    id: crypto.randomUUID(),
    roomId: params.roomId,
    content: params.content.trim(),
    senderId: params.senderId,
    senderName: params.senderName,
    senderRole: params.senderRole,
    createdAt: new Date().toISOString(),
  };
}

function sortMessages(messages: ChatMessage[]): ChatMessage[] {
  return [...messages].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
  );
}

function subscribeLocal(roomId: string, listener: MessageListener): Unsubscribe {
  const channelName = `fengdesk-chat-${roomId}`;
  const channel =
    typeof BroadcastChannel !== "undefined" ? new BroadcastChannel(channelName) : null;

  const notify = () => listener(sortMessages(readLocalMessages(roomId)));

  const onStorage = (event: StorageEvent) => {
    if (event.key === getLocalStorageKey(roomId)) notify();
  };

  channel?.addEventListener("message", notify);
  window.addEventListener("storage", onStorage);
  notify();

  return () => {
    channel?.removeEventListener("message", notify);
    channel?.close();
    window.removeEventListener("storage", onStorage);
  };
}

async function sendLocalMessage(params: SendMessageParams): Promise<ChatMessage> {
  const message = createMessage(params);
  const messages = [...readLocalMessages(params.roomId), message];
  writeLocalMessages(params.roomId, messages);

  const channelName = `fengdesk-chat-${params.roomId}`;
  if (typeof BroadcastChannel !== "undefined") {
    new BroadcastChannel(channelName).postMessage({ type: "new_message" });
  }

  if (params.senderRole === "customer") {
    window.setTimeout(() => {
      const reply = BOT_REPLIES[Math.floor(Math.random() * BOT_REPLIES.length)];
      void sendLocalMessage({
        roomId: params.roomId,
        content: reply,
        senderId: "fengdesk-support",
        senderName: "FengDesk Support",
        senderRole: "bot",
      });
    }, 1200);
  }

  return message;
}

async function ensureFirestoreRoom(
  roomId: string,
  participantId: string,
  participantName: string,
): Promise<void> {
  const db = getFirestoreDb();
  if (!db) return;

  await setDoc(
    doc(db, "chatRooms", roomId),
    {
      participantId,
      participantName,
      lastMessageAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  );
}

function subscribeFirestore(roomId: string, listener: MessageListener): Unsubscribe {
  const db = getFirestoreDb();
  if (!db) {
    return subscribeLocal(roomId, listener);
  }

  const messagesRef = collection(db, "chatRooms", roomId, "messages");
  const messagesQuery = query(messagesRef, orderBy("createdAt", "asc"));

  return onSnapshot(
    messagesQuery,
    (snapshot) => {
      const messages: ChatMessage[] = snapshot.docs.map((docSnap) => {
        const data = docSnap.data();
        const createdAt =
          data.createdAt?.toDate?.()?.toISOString?.() ??
          (typeof data.createdAt === "string" ? data.createdAt : new Date().toISOString());

        return {
          id: docSnap.id,
          roomId,
          content: data.content ?? "",
          senderId: data.senderId ?? "",
          senderName: data.senderName ?? "Khách",
          senderRole: data.senderRole ?? "customer",
          createdAt,
        };
      });
      listener(messages);
    },
    () => {
      listener(readLocalMessages(roomId));
    },
  );
}

async function sendFirestoreMessage(params: SendMessageParams): Promise<ChatMessage> {
  const db = getFirestoreDb();
  if (!db) {
    return sendLocalMessage(params);
  }

  await ensureFirestoreRoom(params.roomId, params.senderId, params.senderName);

  const messagesRef = collection(db, "chatRooms", params.roomId, "messages");
  const docRef = await addDoc(messagesRef, {
    content: params.content.trim(),
    senderId: params.senderId,
    senderName: params.senderName,
    senderRole: params.senderRole,
    createdAt: serverTimestamp(),
  });

  await setDoc(
    doc(db, "chatRooms", params.roomId),
    { lastMessageAt: serverTimestamp(), updatedAt: serverTimestamp() },
    { merge: true },
  );

  if (params.senderRole === "customer") {
    window.setTimeout(async () => {
      const reply = BOT_REPLIES[Math.floor(Math.random() * BOT_REPLIES.length)];
      await addDoc(messagesRef, {
        content: reply,
        senderId: "fengdesk-support",
        senderName: "FengDesk Support",
        senderRole: "bot",
        createdAt: serverTimestamp(),
      });
    }, 1200);
  }

  return {
    id: docRef.id,
    roomId: params.roomId,
    content: params.content.trim(),
    senderId: params.senderId,
    senderName: params.senderName,
    senderRole: params.senderRole,
    createdAt: new Date().toISOString(),
  };
}

export const chatService = {
  isRealtimeEnabled: () => isFirebaseConfigured(),

  subscribe(roomId: string, listener: MessageListener): Unsubscribe {
    if (isFirebaseConfigured()) {
      return subscribeFirestore(roomId, listener);
    }
    return subscribeLocal(roomId, listener);
  },

  async sendMessage(params: SendMessageParams): Promise<ChatMessage> {
    if (isFirebaseConfigured()) {
      return sendFirestoreMessage(params);
    }
    return sendLocalMessage(params);
  },
};
