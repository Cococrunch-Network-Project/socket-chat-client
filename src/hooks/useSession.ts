import { useCallback, useEffect, useRef, useState } from 'react';
import { socket } from '../lib/socket';
import type { RegisterUserResponse } from '../types';

/**
 * Task 3.2 — จัดการการ Login (register_user) และสถานะผู้ใช้
 *
 * - เก็บชื่อไว้ใน sessionStorage (แยกต่อแท็บ) → รีเฟรชแล้ว login ใหม่อัตโนมัติ
 *   แต่เปิดหลายแท็บทดสอบหลายคนในเบราว์เซอร์เดียวกันได้
 * - ถ้า Socket หลุดแล้วต่อใหม่ (Server รีสตาร์ท / เน็ตหลุด) จะ register ซ้ำให้อัตโนมัติ
 * - sessionVersion เพิ่มขึ้นทุกครั้งที่ register สำเร็จ → ใช้เป็นสัญญาณให้ join_room ใหม่
 */

const STORAGE_KEY = 'chat.username';
const TIMEOUT_MS = 5000;

function readSaved(): string | null {
  try {
    return sessionStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}
function writeSaved(name: string | null) {
  try {
    if (name) sessionStorage.setItem(STORAGE_KEY, name);
    else sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
}

/** เชื่อมต่อ Socket ถ้ายังไม่ได้เชื่อม แล้วรอจนสำเร็จหรือล้มเหลว */
function ensureConnected(): Promise<void> {
  if (socket.connected) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => done(new Error('timeout')), TIMEOUT_MS);
    const onConnect = () => done();
    const onError = (err: Error) => done(err);
    function done(err?: Error) {
      clearTimeout(timer);
      socket.off('connect', onConnect);
      socket.off('connect_error', onError);
      if (err) {
        socket.disconnect();
        reject(err);
      } else resolve();
    }
    socket.on('connect', onConnect);
    socket.on('connect_error', onError);
    socket.connect();
  });
}

function registerUser(username: string): Promise<RegisterUserResponse> {
  return new Promise((resolve) => {
    socket.timeout(TIMEOUT_MS).emit('register_user', { username }, (err, res) => {
      if (err) resolve({ success: false, error: 'Server ไม่ตอบสนอง กรุณาลองใหม่' });
      else resolve(res);
    });
  });
}

export function useSession() {
  const [username, setUsername] = useState<string | null>(null);
  const [sessionVersion, setSessionVersion] = useState(0);
  const [error, setError] = useState<string | null>(null);
  // มีชื่อที่บันทึกไว้ → กำลังจะ auto-login ให้ขึ้นสถานะ loading ตั้งแต่แรก
  const [loading, setLoading] = useState(() => readSaved() !== null);
  const usernameRef = useRef<string | null>(null);
  const autoLoginStarted = useRef(false);

  const login = useCallback(async (name: string) => {
    setLoading(true);
    setError(null);
    try {
      await ensureConnected();
    } catch {
      setError('เชื่อมต่อ Server ไม่ได้ กรุณาตรวจสอบว่า Server เปิดอยู่');
      setLoading(false);
      return;
    }

    const res = await registerUser(name);
    setLoading(false);
    if (res.success) {
      usernameRef.current = name;
      writeSaved(name);
      setUsername(name);
      setSessionVersion((v) => v + 1);
    } else {
      writeSaved(null);
      setError(res.error ?? 'ชื่อนี้มีคนใช้แล้ว กรุณาตั้งชื่อใหม่');
    }
  }, []);

  const logout = useCallback(() => {
    usernameRef.current = null;
    writeSaved(null);
    socket.disconnect();
    setUsername(null);
    setError(null);
  }, []);

  // รีเฟรชหน้า → login อัตโนมัติด้วยชื่อเดิม (ref กัน StrictMode ยิงซ้ำ)
  useEffect(() => {
    if (autoLoginStarted.current) return;
    autoLoginStarted.current = true;
    const saved = readSaved();
    if (saved) void login(saved);
  }, [login]);

  // Socket ต่อใหม่หลังหลุด → register ซ้ำ
  useEffect(() => {
    const onReconnect = async () => {
      const name = usernameRef.current;
      if (!name) return; // ยังไม่ login → การเชื่อมต่อนี้มาจาก login() เอง
      const res = await registerUser(name);
      if (res.success) setSessionVersion((v) => v + 1);
      else {
        usernameRef.current = null;
        writeSaved(null);
        setUsername(null);
        setError(res.error ?? 'เชื่อมต่อใหม่ไม่สำเร็จ กรุณา login อีกครั้ง');
      }
    };
    socket.on('connect', onReconnect);
    return () => {
      socket.off('connect', onReconnect);
    };
  }, []);

  return { username, sessionVersion, error, loading, login, logout, savedName: readSaved() };
}
