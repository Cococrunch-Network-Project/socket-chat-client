import { useEffect, useRef, useState, type FormEvent } from 'react';
import { socket } from '../lib/socket';
import type { Message } from '../types';

interface Props {
  roomId: string;
  username: string;
  messages: Message[];
}

/**
 * ⚠️ PLACEHOLDER — หน้าต่างแชทแบบง่ายสำหรับทดสอบ Task 3.x เท่านั้น
 * คนที่ 4 จะแทนที่ด้วย ChatWindow ของจริง (Task 4.1–4.5) โดยรับ props ชุดเดียวกันนี้
 */
export default function ChatPlaceholder({ roomId, username, messages }: Props) {
  const [text, setText] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const send = (e: FormEvent) => {
    e.preventDefault();
    const content = text.trim();
    if (!content) return;
    socket.emit('send_message', { roomId, sender: username, type: 'text', content });
    setText('');
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex-1 space-y-2 overflow-y-auto p-5">
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

      <form onSubmit={send} className="flex gap-2 border-t border-slate-200 bg-white p-3">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="พิมพ์ข้อความ... (placeholder ของคนที่ 4)"
          className="flex-1 rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
        />
        <button className="rounded-lg bg-indigo-600 px-4 font-medium text-white hover:bg-indigo-700">
          ส่ง
        </button>
      </form>
    </div>
  );
}
