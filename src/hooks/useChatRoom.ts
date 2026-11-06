import { useCallback, useEffect, useRef, useState } from 'react';
import { socket } from '../lib/socket';
import type { Message } from '../types';

/**
 * Task 3.5 — Room State Switcher
 * - เมื่อ activeRoomId เปลี่ยน → ยิง join_room เพื่อขอประวัติห้องใหม่
 *   และหน้าจอจะว่างทันที เพราะข้อความถูกผูกกับ roomId (ไม่แสดงข้อความของห้องเก่า)
 * - รับ chat_history / receive_message เฉพาะของห้องที่เปิดอยู่
 * - นับข้อความที่ยังไม่อ่านของห้องอื่น (unread) ไว้แสดงใน Sidebar
 *
 * sessionVersion: เพิ่มเมื่อ register สำเร็จ (รวมถึง reconnect) → join_room ใหม่อัตโนมัติ
 * hook นี้ถูกใช้ใน ChatApp ที่มี key={username} → logout แล้ว state รีเซ็ตเอง
 */
export function useChatRoom(activeRoomId: string | null, username: string, sessionVersion: number) {
  const [room, setRoom] = useState<{ roomId: string | null; messages: Message[] }>({
    roomId: null,
    messages: [],
  });
  const [unread, setUnread] = useState<Record<string, number>>({});
  const activeRef = useRef(activeRoomId);

  useEffect(() => {
    activeRef.current = activeRoomId;
    if (activeRoomId) socket.emit('join_room', { roomId: activeRoomId });
  }, [activeRoomId, sessionVersion]);

  useEffect(() => {
    const onHistory = (history: Message[]) => {
      const roomId = activeRef.current;
      // กันประวัติของห้องก่อนหน้าที่ตอบกลับมาช้า
      if (history.length > 0 && history[0].roomId !== roomId) return;
      setRoom({ roomId, messages: history });
    };

    const onReceive = (msg: Message) => {
      if (msg.roomId === activeRef.current) {
        setRoom((prev) =>
          prev.roomId !== msg.roomId
            ? { roomId: msg.roomId, messages: [msg] }
            : prev.messages.some((m) => m.id === msg.id)
              ? prev
              : { ...prev, messages: [...prev.messages, msg] },
        );
      } else if (msg.sender !== username) {
        setUnread((u) => ({ ...u, [msg.roomId]: (u[msg.roomId] ?? 0) + 1 }));
      }
    };

    socket.on('chat_history', onHistory);
    socket.on('receive_message', onReceive);
    return () => {
      socket.off('chat_history', onHistory);
      socket.off('receive_message', onReceive);
    };
  }, [username]);

  /** เรียกตอนเปิดห้อง เพื่อเคลียร์ตัวเลขยังไม่อ่าน */
  const clearUnread = useCallback((roomId: string) => {
    setUnread((u) => {
      if (!u[roomId]) return u;
      const next = { ...u };
      delete next[roomId];
      return next;
    });
  }, []);

  const messages = room.roomId === activeRoomId ? room.messages : [];
  return { messages, unread, clearUnread };
}
