import { useEffect, useRef, useState, type FormEvent } from 'react';
import { HISTORY_LIMIT, MESSAGE_MAX } from '../lib/limits';
import { socket } from '../lib/socket';
import { validateMessageText } from '../lib/validation';
import type { Message } from '../types';

interface Props {
  roomId: string;
  username: string;
  messages: Message[];
  /** true = Server ส่งประวัติมาครบ HISTORY_LIMIT (อาจมีข้อความเก่ากว่านี้) */
  historyTruncated: boolean;
}

/**
 * ⚠️ PLACEHOLDER — หน้าต่างแชทแบบง่ายสำหรับทดสอบ Task 3.x เท่านั้น
 * คนที่ 4 จะแทนที่ด้วย ChatWindow ของจริง (Task 4.1–4.5) โดยรับ props ชุดเดียวกันนี้
 * ข้อจำกัดที่ต้องเช็กก่อน emit: ดู src/lib/limits.ts + validateMessageText / validateFile
 */
export default function ChatPlaceholder({ roomId, username, messages, historyTruncated }: Props) {
  const [text, setText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const send = (e: FormEvent) => {
    e.preventDefault();
    const err = validateMessageText(text);
    if (err) return setError(err);
    socket.emit('send_message', { roomId, sender: username, type: 'text', content: text.trim() });
    setText('');
    setError(null);
  };

  const nearLimit = text.length > MESSAGE_MAX * 0.9;

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex-1 space-y-2 overflow-y-auto p-5">
        {historyTruncated && (
          <p className="text-center text-xs text-slate-400">
            แสดงเฉพาะ {HISTORY_LIMIT} ข้อความล่าสุด
          </p>
        )}
        {messages.length === 0 && (
          <p className="text-center text-sm text-slate-400">ยังไม่มีข้อความในห้องนี้</p>
        )}
        {messages.map((m) => {
          const mine = m.sender === username;
          return (
            <div key={m.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-[70%] rounded-2xl px-3 py-2 text-sm ${
                  mine ? 'bg-indigo-600 text-white' : 'bg-white text-slate-800 shadow-sm'
                }`}
              >
                {!mine && <p className="text-xs font-semibold text-indigo-600">{m.sender}</p>}
                <p className="whitespace-pre-wrap break-words">
                  {m.type === 'text' ? m.content : `[${m.type}] ${m.fileName ?? ''}`}
                </p>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={send} className="border-t border-slate-200 bg-white p-3">
        {error && <p className="mb-2 text-xs text-red-600">{error}</p>}
        <div className="flex gap-2">
          <input
            value={text}
            onChange={(e) => {
              setText(e.target.value);
              setError(null);
            }}
            placeholder="พิมพ์ข้อความ... (placeholder ของคนที่ 4)"
            className="flex-1 rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
          />
          <button className="rounded-lg bg-indigo-600 px-4 font-medium text-white hover:bg-indigo-700">
            ส่ง
          </button>
        </div>
        {nearLimit && (
          <p
            className={`mt-1 text-right text-xs ${text.length > MESSAGE_MAX ? 'text-red-600' : 'text-slate-400'}`}
          >
            {text.length.toLocaleString()} / {MESSAGE_MAX.toLocaleString()}
          </p>
        )}
      </form>
    </div>
  );
}
