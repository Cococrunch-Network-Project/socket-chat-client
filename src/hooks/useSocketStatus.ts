import { useEffect, useState } from 'react';
import { socket } from '../lib/socket';

/** ติดตามว่า Socket ยังเชื่อมต่ออยู่หรือไม่ (ใช้แสดงจุดสถานะใน Sidebar) */
export function useSocketConnected(): boolean {
  const [connected, setConnected] = useState(socket.connected);

  useEffect(() => {
    const on = () => setConnected(true);
    const off = () => setConnected(false);
    socket.on('connect', on);
    socket.on('disconnect', off);
    return () => {
      socket.off('connect', on);
      socket.off('disconnect', off);
    };
  }, []);

  return connected;
}
