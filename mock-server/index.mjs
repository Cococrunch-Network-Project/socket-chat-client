/**
 * Mock Server สำหรับทดสอบฝั่ง Client เท่านั้น (ไม่ใช่ Server จริงของทีม)
 * จำลองพฤติกรรมตาม types.ts ให้ Frontend ทดสอบได้โดยไม่ต้องรอคนที่ 1
 *
 * รัน: npm run mock   (พอร์ตเริ่มต้น 3001, เปลี่ยนด้วย PORT=xxxx)
 */
import { Server } from 'socket.io';
import { randomUUID } from 'node:crypto';

const PORT = Number(process.env.PORT ?? 3001);
const io = new Server(PORT, { cors: { origin: '*' }, maxHttpBufferSize: 1e7 });

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
  if (roomId.startsWith('private_')) return privateMembers(roomId).includes(username);
  if (roomId.startsWith('group_')) {
    return groups.get(roomId.slice('group_'.length))?.has(username) ?? false;
  }
  return false;
}

io.on('connection', (socket) => {
  let me = null;
  console.log(`[connect] ${socket.id}`);

  socket.on('register_user', ({ username } = {}, cb) => {
    const name = String(username ?? '').trim();
    if (!name) return cb?.({ success: false, error: 'กรุณากรอกชื่อ' });
    if (users.has(name)) return cb?.({ success: false, error: `ชื่อ "${name}" มีคนใช้แล้ว` });

    if (me) users.delete(me);
    me = name;
    users.set(name, socket.id);
    // กลับเข้าห้องกลุ่มเดิมที่เคยเป็นสมาชิก (กรณี reconnect / refresh)
    for (const [g, members] of groups) if (members.has(name)) socket.join(`group_${g}`);

    console.log(`[register] ${name}`);
    cb?.({ success: true });
    broadcastUsers();
    socket.emit('groups_updated', groupsPayload());
  });

  socket.on('create_group', ({ groupName } = {}) => {
    const name = String(groupName ?? '').trim();
    if (!me || !name || groups.has(name)) return;
    groups.set(name, new Set([me])); // R8: คนสร้างเป็นสมาชิกคนเดียว
    socket.join(`group_${name}`);
    console.log(`[create_group] ${name} by ${me}`);
    broadcastGroups();
  });

  socket.on('join_group', ({ groupName } = {}) => {
    const members = groups.get(groupName);
    if (!me || !members) return;
    members.add(me); // R10: เข้าได้เฉพาะตัวเอง
    socket.join(`group_${groupName}`);
    console.log(`[join_group] ${me} -> ${groupName}`);
    broadcastGroups();
  });

  socket.on('join_room', ({ roomId } = {}) => {
    if (!me || !canAccess(roomId, me)) return;
    socket.join(roomId);
    socket.emit('chat_history', history.get(roomId) ?? []);
  });

  socket.on('send_message', (p = {}) => {
    if (!me || !canAccess(p.roomId, me)) return;
    const msg = {
      id: randomUUID(),
      roomId: p.roomId,
      sender: me,
      type: p.type ?? 'text',
      content: p.content ?? '',
      fileName: p.fileName,
      timestamp: new Date().toISOString(),
      readBy: [me],
    };
    if (!history.has(msg.roomId)) history.set(msg.roomId, []);
    history.get(msg.roomId).push(msg);

    // ห้องส่วนตัว: พาอีกฝ่ายเข้าห้องด้วย เพื่อให้ได้รับข้อความแม้ยังไม่ได้เปิดห้อง
    if (msg.roomId.startsWith('private_')) {
      for (const u of privateMembers(msg.roomId)) socketOf(u)?.join(msg.roomId);
    }
    io.to(msg.roomId).emit('receive_message', msg);
  });

  socket.on('typing', (p = {}) => {
    if (me && canAccess(p.roomId, me)) socket.to(p.roomId).emit('typing', p);
  });

  socket.on('mark_read', ({ roomId } = {}) => {
    if (!me || !canAccess(roomId, me)) return;
    for (const m of history.get(roomId) ?? []) if (!m.readBy.includes(me)) m.readBy.push(me);
    io.to(roomId).emit('messages_read', { roomId, username: me });
  });

  socket.on('disconnect', () => {
    console.log(`[disconnect] ${me ?? socket.id}`);
    if (me && users.get(me) === socket.id) {
      users.delete(me);
      broadcastUsers();
    }
  });
});

console.log(`Mock server listening on http://localhost:${PORT}`);
