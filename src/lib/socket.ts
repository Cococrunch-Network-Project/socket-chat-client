import { io, type Socket } from 'socket.io-client';
import type { ClientToServerEvents, ServerToClientEvents } from '../types';

export const SOCKET_URL: string =
  import.meta.env.VITE_SOCKET_URL ?? 'http://localhost:3001';

/**
 * Socket ตัวเดียวที่ใช้ร่วมกันทั้งแอป (singleton)
 * - autoConnect: false → เชื่อมต่อเองตอนกด Login (Task 3.2)
 * - transports: ['websocket'] → บังคับใช้ WebSocket ล้วน ไม่ fallback ไป HTTP long-polling
 *   (สอดคล้องกับกฎ R2 และอธิบายในสไลด์ได้ง่าย)
 */
export const socket: Socket<ServerToClientEvents, ClientToServerEvents> = io(
  SOCKET_URL,
  {
    autoConnect: false,
    transports: ['websocket'],
  },
);
