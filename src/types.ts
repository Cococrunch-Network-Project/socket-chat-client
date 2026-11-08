/**
 * types.ts — สัญญา Socket Events กลางของทีม (API Contract)
 * อ้างอิง: Project Master Plan หัวข้อ 4
 *
 * ไฟล์นี้ต้อง "ตรงกันทุกตัวอักษร" กับ types.ts ฝั่ง /server
 * ถ้าจะแก้ ให้ตกลงกับคนที่ 1 (Backend) ก่อนเสมอ
 *
 * จุดที่ติด [TBD] = ยังไม่ได้ตกลงกับทีม ใช้ค่าร่างไปก่อน
 */

// ---------- Data Models ----------

export type MessageType = 'text' | 'image' | 'file' | 'ai';
/** AI replies are server-generated, never a client-sendable message type. */
export type UserMessageType = Exclude<MessageType, 'ai'>;

export interface Message {
  id: string;
  roomId: string;
  sender: string;
  type: MessageType;
  /** text = ข้อความ, image/file = Base64 Data URL */
  content: string;
  fileName?: string;
  /** ISO string หรือ epoch ms [TBD: ตกลงกับคนที่ 2] */
  timestamp: string | number;
  /** รายชื่อคนที่อ่านแล้ว */
  readBy: string[];
}

export interface Group {
  groupName: string;
  members: string[];
}

// ---------- Payloads (Client ➔ Server) ----------
// ⚠️ ฟิลด์ระบุตัวตนใน payload (creator, username, sender) Server จะ "ไม่เชื่อ"
//    Server ใช้ socket.data.username ที่ตั้งตอน register_user สำเร็จแทน (กันคนปลอมชื่อ)
//    Client ยังส่งไปตามสัญญาเดิมได้ แต่ห้ามพึ่งค่าพวกนี้ฝั่ง Server

export interface RegisterUserPayload {
  username: string;
}

/** [TBD] รูปแบบ callback ของ register_user — แผนไม่ได้ระบุ */
export interface RegisterUserResponse {
  success: boolean;
  message?: string;
  error?: string;
}

export interface CreateGroupPayload {
  groupName: string;
  creator: string;
}

export interface JoinGroupPayload {
  groupName: string;
  username: string;
}

export interface JoinRoomPayload {
  roomId: string;
}

export interface SendMessagePayload {
  roomId: string;
  sender: string;
  type: UserMessageType;
  content: string;
  fileName?: string;
}

export interface TypingPayload {
  roomId: string;
  username: string;
  isTyping: boolean;
}

export interface MarkReadPayload {
  roomId: string;
  username: string;
}

// ---------- Typed Socket.IO Event Maps ----------

/**
 * ข้อมูลที่ Server ผูกไว้กับแต่ละ socket (ใช้เฉพาะฝั่ง Server)
 * new Server<ClientToServerEvents, ServerToClientEvents, {}, SocketData>()
 */
export interface SocketData {
  /** ตั้งค่าเมื่อ register_user สำเร็จเท่านั้น — undefined = ยังไม่ login */
  username?: string;
}

/** Event ที่ Server ส่งมาหา Client */
export interface ServerToClientEvents {
  users_updated: (users: string[]) => void;
  groups_updated: (groups: Group[]) => void;
  /** [TBD] แผนมีทั้งแบบ callback และแบบ event — ร่างนี้ใช้แบบ event ตาม Task 2.2 */
  chat_history: (messages: Message[]) => void;
  receive_message: (message: Message) => void;
  typing: (payload: TypingPayload) => void;
  /** [TBD] payload ของ messages_read ยังไม่ได้กำหนดในแผน */
  messages_read: (payload: MarkReadPayload) => void;
}

/** Event ที่ Client ส่งไปหา Server */
export interface ClientToServerEvents {
  register_user: (
    payload: RegisterUserPayload,
    callback: (res: RegisterUserResponse) => void,
  ) => void;
  create_group: (payload: CreateGroupPayload) => void;
  join_group: (payload: JoinGroupPayload) => void;
  join_room: (payload: JoinRoomPayload) => void;
  send_message: (payload: SendMessagePayload) => void;
  typing: (payload: TypingPayload) => void;
  mark_read: (payload: MarkReadPayload) => void;
}

