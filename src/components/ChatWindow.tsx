import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react';
import { FILE_MAX_BYTES, HISTORY_LIMIT, MESSAGE_MAX } from '../lib/limits';
import { socket } from '../lib/socket';
import { getInitial, validateFile, validateMessageText } from '../lib/validation';
import { useSocketConnected } from '../hooks/useSocketStatus';
import type { Message, TypingPayload } from '../types';

interface Props { roomId: string; username: string; messages: Message[]; historyTruncated: boolean }
type Attachment = { file: File; content: string };

function Icon({ name }: { name: 'attach' | 'send' | 'file' | 'close' | 'check' }) {
  const paths = {
    attach: 'M21 11.5l-8.5 8.5a6 6 0 01-8.5-8.5l9-9a4 4 0 015.7 5.7l-9 9a2 2 0 01-2.8-2.8l8.5-8.5',
    send: 'M12 19V5m-6 6l6-6 6 6', file: 'M14 2H6v20h12V6l-4-4zm0 0v5h5M9 12h6m-6 4h6',
    close: 'M6 6l12 12M6 18L18 6', check: 'M4 12l4 4L20 4M12 16l8-8',
  };
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={paths[name]} /></svg>;
}
const formatSize = (bytes: number) => bytes >= 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`;
const dayLabel = (timestamp: Message['timestamp']) => new Date(timestamp).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' });

export default function ChatWindow({ roomId, username, messages, historyTruncated }: Props) {
  const connected = useSocketConnected();
  const [text, setText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [attachment, setAttachment] = useState<Attachment | null>(null);
  const [preparing, setPreparing] = useState(false);
  const [away, setAway] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const readerRef = useRef<FileReader | null>(null);
  const nearBottom = useRef(true);
  const typingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastTyping = useRef(0);
  const lastRead = useRef('');
  const latestId = messages.at(-1)?.id ?? '';

  const stopTyping = useCallback(() => {
    if (typingTimer.current) clearTimeout(typingTimer.current);
    if (lastTyping.current && socket.connected) socket.emit('typing', { roomId, username, isTyping: false });
    lastTyping.current = 0;
  }, [roomId, username]);
  const updateTyping = (value: string) => {
    if (!value.trim() || !socket.connected) { stopTyping(); return; }
    if (!lastTyping.current || Date.now() - lastTyping.current > 1500) {
      socket.emit('typing', { roomId, username, isTyping: true });
      lastTyping.current = Date.now();
    }
    if (typingTimer.current) clearTimeout(typingTimer.current);
    typingTimer.current = setTimeout(stopTyping, 2500);
  };
  const markVisibleRead = useCallback(() => {
    if (latestId && socket.connected && document.visibilityState === 'visible' && document.hasFocus() && nearBottom.current && lastRead.current !== latestId) {
      socket.emit('mark_read', { roomId, username });
      lastRead.current = latestId;
    }
  }, [latestId, roomId, username]);
  const toBottom = useCallback(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
    nearBottom.current = true;
    setAway(false);
    markVisibleRead();
  }, [markVisibleRead]);

  const latestSender = messages.at(-1)?.sender;
  useEffect(() => {
    if (nearBottom.current || latestSender === username) toBottom();
    else setAway(true);
  }, [latestId, latestSender, username, toBottom]);


  useEffect(() => {
    markVisibleRead();
    window.addEventListener('focus', markVisibleRead);
    document.addEventListener('visibilitychange', markVisibleRead);
    return () => {
      window.removeEventListener('focus', markVisibleRead);
      document.removeEventListener('visibilitychange', markVisibleRead);
    };
  }, [connected, markVisibleRead]);

  useEffect(() => {
    const timers = new Map<string, ReturnType<typeof setTimeout>>();
    const onTyping = (payload: TypingPayload) => {
      if (payload.roomId !== roomId || payload.username === username) return;
      clearTimeout(timers.get(payload.username));
      const remove = () => {
        timers.delete(payload.username);
        setTypingUsers((prev) => prev.filter((name) => name !== payload.username));
      };
      if (!payload.isTyping) { remove(); return; }
      setTypingUsers((prev) => prev.includes(payload.username) ? prev : [...prev, payload.username]);
      timers.set(payload.username, setTimeout(remove, 4500));
    };
    const onDisconnect = () => { setTypingUsers([]); lastRead.current = ''; lastTyping.current = 0; };
    const onBlur = () => stopTyping();
    socket.on('typing', onTyping);
    socket.on('disconnect', onDisconnect);
    window.addEventListener('blur', onBlur);
    return () => {
      stopTyping();
      timers.forEach(clearTimeout);
      readerRef.current?.abort();
      socket.off('typing', onTyping);
      socket.off('disconnect', onDisconnect);
      window.removeEventListener('blur', onBlur);
    };
  }, [roomId, username, stopTyping]);

  useEffect(() => {
    const el = inputRef.current;
    if (!el) return;
    const resize = () => {
      el.style.overflowY = 'hidden';
      el.style.height = 'auto';
      // Allow for fractional line-height rounding without a one-pixel scrollbar.
      const height = el.scrollHeight + 1;
      el.style.height = `${Math.min(height, 144)}px`;
      el.style.overflowY = height > 144 ? 'auto' : 'hidden';
    };
    resize();
    // Re-measure wrapping when the chat pane changes width, too.
    let width = el.getBoundingClientRect().width;
    const observer = new ResizeObserver(() => {
      const nextWidth = el.getBoundingClientRect().width;
      if (nextWidth !== width) { width = nextWidth; resize(); }
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [text]);

  const selectFile = (file?: File) => {
    if (!file) return;
    const invalid = validateFile(file);
    if (invalid) { setError(invalid); return; }
    readerRef.current?.abort();
    setAttachment(null);
    setPreparing(true);
    setError(null);
    const reader = new FileReader();
    readerRef.current = reader;
    reader.onload = () => { setAttachment({ file, content: String(reader.result) }); setPreparing(false); inputRef.current?.focus(); };
    reader.onerror = () => { setPreparing(false); setError('อ่านไฟล์ไม่สำเร็จ กรุณาลองอีกครั้ง'); };
    reader.readAsDataURL(file);
  };
  const send = (event: FormEvent) => {
    event.preventDefault();
    if (!socket.connected || preparing) return;
    if (text.trim() || !attachment) {
      const invalid = validateMessageText(text);
      if (invalid) { setError(invalid); return; }
    }
    if (attachment) socket.emit('send_message', { roomId, sender: username, type: attachment.file.type.startsWith('image/') ? 'image' : 'file', content: attachment.content, fileName: attachment.file.name });
    if (text.trim()) socket.emit('send_message', { roomId, sender: username, type: 'text', content: text.trim() });
    nearBottom.current = true;
    setAttachment(null); setText(''); setError(null); stopTyping(); inputRef.current?.focus();
  };

  return (
    <div className="chat-window">
      <div ref={scrollRef} className="chat-timeline" role="region" aria-label="ข้อความในห้องแชท" tabIndex={0} onScroll={() => {
        const el = scrollRef.current!;
        nearBottom.current = el.scrollHeight - el.scrollTop - el.clientHeight < 64;
        if (nearBottom.current) { setAway(false); markVisibleRead(); }
      }}>
        <div className="timeline-content">
          {historyTruncated && <p className="history-note">แสดง {HISTORY_LIMIT} ข้อความล่าสุด</p>}
          {!messages.length && <div className="chat-empty"><span className="empty-symbol">✦</span><h3>เริ่มบทสนทนาดี ๆ ที่นี่</h3><p>ส่งข้อความ แชร์ไฟล์ หรือพิมพ์ @ai เพื่อถามผู้ช่วย</p></div>}
          {messages.map((message, index) => {
            const previous = messages[index - 1];
            const newDay = !previous || dayLabel(previous.timestamp) !== dayLabel(message.timestamp);
            const mine = message.sender === username;
            const ai = message.type === 'ai' || message.sender === 'AI Assistant';
            const readers = (message.readBy ?? []).filter((name) => name !== username && name !== message.sender);
            const grouped = !newDay && previous?.sender === message.sender && Number(new Date(message.timestamp)) - Number(new Date(previous.timestamp)) < 300000;
            const image = message.type === 'image' && /^data:image\/(png|jpe?g|gif|webp|avif|bmp);base64,/i.test(message.content);
            return <div key={message.id}>
              {newDay && <div className="date-divider"><span>{dayLabel(message.timestamp)}</span></div>}
              <article className={`message-row ${mine ? 'mine' : ''} ${ai ? 'ai-message' : ''} ${grouped ? 'grouped' : ''}`}>
                {!mine && <span className={`message-avatar ${grouped ? 'avatar-hidden' : ''}`} aria-hidden="true">{ai ? '✦' : getInitial(message.sender)}</span>}
                <div className="message-stack">
                  {!mine && !grouped && <div className="message-author">{message.sender}{ai && <span className="ai-tag">AI</span>}</div>}
                  <div className="message-bubble">
                    {message.type === 'text' || message.type === 'ai' ? <p>{message.content}</p> : <>
                      {image && <img className="message-image" src={message.content} alt={message.fileName ?? 'รูปภาพที่แชร์'} onLoad={() => { if (nearBottom.current) toBottom(); }} />}
                      {message.content.startsWith('data:') && <a className="file-card" href={message.content} download={message.fileName ?? 'download'}><Icon name="file" /><span><strong>{message.fileName ?? 'ไฟล์แนบ'}</strong><small>ดาวน์โหลด{image ? 'รูปภาพ' : 'ไฟล์'} ↓</small></span></a>}
                    </>}
                  </div>
                  <div className="message-meta">
                    <time dateTime={new Date(message.timestamp).toISOString()}>{new Date(message.timestamp).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}</time>
                    {mine && <span className={readers.length ? 'receipt is-read' : 'receipt'} title={readers.length ? `อ่านแล้วโดย ${readers.join(', ')}` : 'เซิร์ฟเวอร์ได้รับข้อความแล้ว'}><Icon name="check" />{readers.length ? `อ่านแล้ว${readers.length > 1 ? ` ${readers.length}` : ''}` : 'ส่งแล้ว'}</span>}
                  </div>
                </div>
              </article>
            </div>;
          })}
        </div>
      </div>
      {away && <button className="jump-latest" onClick={toBottom}>ข้อความล่าสุด ↓</button>}
      <form onSubmit={send} className="composer-area">
        {!connected && <p className="connection-note" role="status">กำลังเชื่อมต่อใหม่… ข้อความร่างของคุณยังอยู่</p>}
        {error && <p className="composer-error" role="alert">{error}<button type="button" aria-label="ปิดข้อความแจ้งเตือน" onClick={() => setError(null)}><Icon name="close" /></button></p>}
        {(attachment || preparing) && <div className="attachment-preview" role="status">
          {attachment?.file.type.startsWith('image/') ? <img src={attachment.content} alt="ตัวอย่างรูปภาพก่อนส่ง" /> : <Icon name="file" />}
          <div><strong>{attachment?.file.name ?? 'กำลังเตรียมไฟล์…'}</strong><small>{attachment ? `${formatSize(attachment.file.size)} · พร้อมส่ง` : 'กำลังอ่านไฟล์'}</small></div>
          <button type="button" className="icon-button" aria-label="นำไฟล์แนบออก" onClick={() => { readerRef.current?.abort(); setPreparing(false); setAttachment(null); }}><Icon name="close" /></button>
        </div>}
        <div className="typing-slot" role="status" aria-live="polite">{typingUsers.length > 0 && <><span className="typing-dots" aria-hidden="true"><i /><i /><i /></span><span>{typingUsers.slice(0, 2).join(', ')}{typingUsers.length > 2 ? ` และอีก ${typingUsers.length - 2} คน` : ''} กำลังพิมพ์</span></>}</div>
        <div className="composer">
          <input ref={fileRef} type="file" hidden onChange={(event) => { selectFile(event.target.files?.[0]); event.target.value = ''; }} />
          <button type="button" className="icon-button attach-button" aria-label="แนบรูปภาพหรือไฟล์" title={`แนบรูปภาพหรือไฟล์ · สูงสุด ${formatSize(FILE_MAX_BYTES)}`} disabled={preparing} onClick={() => fileRef.current?.click()}><Icon name="attach" /></button>
          <textarea ref={inputRef} rows={1} value={text} aria-label="ข้อความ" placeholder="พิมพ์ข้อความ หรือ @ai เพื่อถามผู้ช่วย…" onChange={(event) => { setText(event.target.value); setError(null); updateTyping(event.target.value); }} onBlur={stopTyping} onKeyDown={(event) => { if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) { event.preventDefault(); event.currentTarget.form?.requestSubmit(); } }} />
          <button type="submit" className="send-button" aria-label="ส่งข้อความ" title="ส่งข้อความ" disabled={!connected || preparing || (!text.trim() && !attachment) || text.length > MESSAGE_MAX}><Icon name="send" /></button>
        </div>
        <div className="composer-hint"><span>Shift + Enter ขึ้นบรรทัดใหม่ <span className="file-limit">· ไฟล์สูงสุด 7 MB</span></span><span className={text.length > MESSAGE_MAX ? 'over-limit' : ''}>{text.length > MESSAGE_MAX * .9 ? `${text.length.toLocaleString()} / ${MESSAGE_MAX.toLocaleString()}` : '✦ @ai'}</span></div>
      </form>
    </div>
  );
}

