/**
 * Mock Server สำหรับทดสอบฝั่ง Client เท่านั้น (ไม่ใช่ Server จริงของทีม)
 * จำลองพฤติกรรมตาม types.ts ให้ Frontend ทดสอบได้โดยไม่ต้องรอคนที่ 1
 *
 * พฤติกรรมเลียนแบบ Server จริง:
 * - register_user ตรวจชื่อด้วย isValidUsername() (กฎเดียวกับ models/User.ts)
 * - สำเร็จแล้วตั้ง socket.data.username และทุก handler ใช้ค่านี้
 *   ไม่เชื่อ username / creator / sender จาก payload (กันปลอมชื่อ)
 *
 * รัน: npm run mock   (พอร์ตเริ่มต้น 3001, เปลี่ยนด้วย PORT=xxxx)
 */
import { Server } from 'socket.io';
import { randomUUID } from 'node:crypto';

const PORT = Number(process.env.PORT ?? 3001);
const io = new Server(PORT, { cors: { origin: '*' }, maxHttpBufferSize: 1e7 });

// ---- เลียนแบบ models/User.ts ----
const USERNAME_MAX = 20;
/** รับภาษาไทยได้ ห้าม "_" (ใช้คั่นชื่อห้อง private) และห้ามช่องว่าง */
function isValidUsername(name) {
  return (
    typeof name === 'string' &&
    name.length > 0 &&
    name.length <= USERNAME_MAX &&
    !/[_\s]/.test(name)
  );
}

/** username -> socket.id */
const users = new Map();
/** groupName -> Set<username> */
const groups = new Map();
/** roomId -> Message[] */
const history = new Map();

const groupsPayload = () =>
  [...groups].map(([groupName, members]) => ({ groupName, members: [...members] }));
const broadcastUsers = () => io.emit('users_updated', [...users.keys()]);
const broadcastGroups = () => io.emit('groups_updated', groupsPayload());
const socketOf = (name) => io.sockets.sockets.get(users.get(name));

/** 'private_A_B' -> ['A', 'B'] */
const privateMembers = (roomId) => roomId.slice('private_'.length).split('_');

function canAccess(roomId, username) {
  if (typeof roomId !== 'string') return false;
  if (roomId.startsWith('private_')) return privateMembers(roomId).includes(username);
  if (roomId.startsWith('group_')) {
    return groups.get(roomId.slice('group_'.length))?.has(username) ?? false;
  }
  return false;
}

io.on('connection', (socket) => {
  console.log(`[connect] ${socket.id}`);
  /** ชื่อของ socket นี้ — แหล่งความจริงเดียว (ไม่ใช้ค่าจาก payload) */
  const me = () => socket.data.username;

  socket.on('register_user', (payload, cb) => {
    const reply = typeof cb === 'function' ? cb : () => {};
    const username = typeof payload?.username === 'string' ? payload.username.trim() : '';

    if (!isValidUsername(username)) {
      return reply({
        success: false,
        error: `ชื่อต้องยาว 1–${USERNAME_MAX} ตัวอักษร และห้ามมี _ หรือช่องว่าง`,
      });
    }
    if (me()) return reply({ success: false, error: 'การเชื่อมต่อนี้ลงทะเบียนชื่อไปแล้ว' });
    if (users.has(username)) return reply({ success: false, error: `ชื่อ "${username}" มีคนใช้แล้ว` });

    users.set(username, socket.id);
    socket.data.username = username;
    // กลับเข้าห้องกลุ่มเดิมที่เคยเป็นสมาชิก (กรณี reconnect / refresh)
    for (const [g, members] of groups) if (members.has(username)) socket.join(`group_${g}`);

    console.log(`[register] ${username}`);
    reply({ success: true });
    broadcastUsers();
    socket.emit('groups_updated', groupsPayload());
  });

  socket.on('create_group', (payload) => {
    const name = String(payload?.groupName ?? '').trim();
    if (!me() || !name || groups.has(name)) return;
    groups.set(name, new Set([me()])); // R8: คนสร้างเป็นสมาชิกคนเดียว (ไม่ใช้ payload.creator)
    socket.join(`group_${name}`);
    console.log(`[create_group] ${name} by ${me()}`);
    broadcastGroups();
  });

  socket.on('join_group', (payload) => {
    const groupName = payload?.groupName;
    const members = groups.get(groupName);
    if (!me() || !members) return;
    members.add(me()); // R10: เข้าได้เฉพาะตัวเอง (ไม่ใช้ payload.username)
    socket.join(`group_${groupName}`);
    console.log(`[join_group] ${me()} -> ${groupName}`);
    broadcastGroups();
  });

  socket.on('join_room', (payload) => {
    const roomId = payload?.roomId;
    if (!me() || !canAccess(roomId, me())) return;
    socket.join(roomId);
    socket.emit('chat_history', history.get(roomId) ?? []);
  });

  socket.on('send_message', (p) => {
    if (!me() || !canAccess(p?.roomId, me())) return;
    const msg = {
      id: randomUUID(),
      roomId: p.roomId,
      sender: me(), // ไม่ใช้ p.sender
      type: p.type ?? 'text',
      content: p.content ?? '',
      fileName: p.fileName,
      timestamp: new Date().toISOString(),
      readBy: [me()],
    };
    if (!history.has(msg.roomId)) history.set(msg.roomId, []);
    history.get(msg.roomId).push(msg);

    // ห้องส่วนตัว: พาอีกฝ่ายเข้าห้องด้วย เพื่อให้ได้รับข้อความแม้ยังไม่ได้เปิดห้อง
    if (msg.roomId.startsWith('private_')) {
      for (const u of privateMembers(msg.roomId)) socketOf(u)?.join(msg.roomId);
    }
    io.to(msg.roomId).emit('receive_message', msg);
  });

  socket.on('typing', (p) => {
    if (!me() || !canAccess(p?.roomId, me())) return;
    socket.to(p.roomId).emit('typing', { roomId: p.roomId, username: me(), isTyping: !!p.isTyping });
  });

  socket.on('mark_read', (payload) => {
    const roomId = payload?.roomId;
    if (!me() || !canAccess(roomId, me())) return;
    for (const m of history.get(roomId) ?? []) if (!m.readBy.includes(me())) m.readBy.push(me());
    io.to(roomId).emit('messages_read', { roomId, username: me() });
  });

  socket.on('disconnect', () => {
    const name = me();
    console.log(`[disconnect] ${name ?? socket.id}`);
    // ลบเฉพาะถ้า Map ยังชี้มาที่ socket นี้ (กันลบชื่อที่ socket ใหม่เพิ่งลงทะเบียน)
    if (name && users.get(name) === socket.id) {
      users.delete(name);
      broadcastUsers();
    }
  });
});

console.log(`Mock server listening on http://localhost:${PORT}`);
