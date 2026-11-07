import { useState } from 'react';
import { useChatRoom } from '../hooks/useChatRoom';
import { getGroupRoomId, getPrivateRoomId, type ActiveRoom } from '../lib/rooms';
import { socket } from '../lib/socket';
import type { Group } from '../types';
import ChatWindow from './ChatWindow';
import RoomHeader from './RoomHeader';
import Sidebar from './sidebar/Sidebar';

interface Props {
  username: string;
  sessionVersion: number;
  users: string[];
  groups: Group[];
  onLogout: () => void;
}

/** หน้าหลักหลัง Login: Sidebar + ห้องแชทที่เปิดอยู่ */
export default function ChatApp({ username, sessionVersion, users, groups, onLogout }: Props) {
  // Task 3.5 — ห้องที่กำลังเปิดอยู่
  const [activeRoom, setActiveRoom] = useState<ActiveRoom | null>(null);
  const activeRoomId = activeRoom?.id ?? null;
  const { messages, historyTruncated, unread, clearUnread } = useChatRoom(
    activeRoomId,
    username,
    sessionVersion,
  );

  const openRoom = (room: ActiveRoom) => {
    setActiveRoom(room);
    clearUnread(room.id);
  };

  const openPrivate = (peer: string) =>
    openRoom({ kind: 'private', id: getPrivateRoomId(username, peer), peer });

  const openGroup = (groupName: string) =>
    openRoom({ kind: 'group', id: getGroupRoomId(groupName), groupName });

  // Socket.IO ส่ง event ตามลำดับบน connection เดียวกัน → Server ได้ create/join ก่อน join_room เสมอ
  const createGroup = (groupName: string) => {
    socket.emit('create_group', { groupName, creator: username });
    openGroup(groupName);
  };

  // R10: ส่งเฉพาะชื่อตัวเองเท่านั้น ไม่มีทางดึงคนอื่นเข้ากลุ่ม
  const joinGroup = (groupName: string) => {
    socket.emit('join_group', { groupName, username });
    openGroup(groupName);
  };

  return (
    <div className={`chat-shell flex overflow-hidden ${activeRoom ? 'room-open' : ''}`}>
      <Sidebar
        me={username}
        users={users}
        groups={groups}
        activeRoomId={activeRoomId}
        unread={unread}
        onOpenPrivate={openPrivate}
        onOpenGroup={openGroup}
        onCreateGroup={createGroup}
        onJoinGroup={joinGroup}
        onLogout={onLogout}
      />

      <main className="flex min-w-0 flex-1 flex-col bg-slate-100">
        {activeRoom ? (
          <>
            <button type="button" className="bg-white px-4 pt-3 text-left text-sm text-indigo-600 md:hidden" onClick={() => setActiveRoom(null)}>← กลับไปที่แชททั้งหมด</button>
            <RoomHeader room={activeRoom} users={users} groups={groups} me={username} />
            <ChatWindow
              key={activeRoom.id}
              roomId={activeRoom.id}
              username={username}
              messages={messages}
              historyTruncated={historyTruncated}
            />
          </>
        ) : (
          <div className="flex flex-1 flex-col items-center justify-center text-slate-400">
            <span className="mb-2 text-5xl">💬</span>
            <p>สวัสดี {username}!</p>
            <p className="text-sm">เลือกเพื่อนหรือกลุ่มจากแถบด้านซ้ายเพื่อเริ่มแชท</p>
          </div>
        )}
      </main>
    </div>
  );
}

