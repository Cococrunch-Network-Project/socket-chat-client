import { useSocketConnected } from '../../hooks/useSocketStatus';
import type { Group } from '../../types';
import GroupList from './GroupList';
import UserList from './UserList';

interface Props {
  me: string;
  users: string[];
  groups: Group[];
  activeRoomId: string | null;
  unread: Record<string, number>;
  onOpenPrivate: (peer: string) => void;
  onOpenGroup: (groupName: string) => void;
  onCreateGroup: (groupName: string) => void;
  onJoinGroup: (groupName: string) => void;
  onLogout: () => void;
}

/** แถบด้านซ้าย: ผู้ใช้ออนไลน์ (Task 3.3) + กลุ่ม (Task 3.4) */
export default function Sidebar(props: Props) {
  const connected = useSocketConnected();

  return (
    <aside className="flex h-full w-72 shrink-0 flex-col bg-slate-900 text-slate-100">
      <header className="flex items-center justify-between border-b border-slate-800 px-4 py-3">
        <div className="min-w-0">
          <h1 className="font-bold">Socket Chat</h1>
          <p className="flex items-center gap-1.5 text-xs text-slate-400">
            <span
              className={`h-2 w-2 rounded-full ${connected ? 'bg-green-500' : 'animate-pulse bg-red-500'}`}
            />
            {connected ? 'เชื่อมต่อแล้ว' : 'กำลังเชื่อมต่อใหม่...'}
          </p>
        </div>
        <button
          onClick={props.onLogout}
          className="rounded-md px-2 py-1 text-xs text-slate-400 transition hover:bg-slate-800 hover:text-white"
        >
          ออกจากระบบ
        </button>
      </header>

      <div className="flex-1 overflow-y-auto pb-4">
        <UserList
          users={props.users}
          me={props.me}
          activeRoomId={props.activeRoomId}
          unread={props.unread}
          onOpenPrivate={props.onOpenPrivate}
        />
        <GroupList
          groups={props.groups}
          me={props.me}
          activeRoomId={props.activeRoomId}
          unread={props.unread}
          onCreate={props.onCreateGroup}
          onJoin={props.onJoinGroup}
          onOpen={props.onOpenGroup}
        />
      </div>
    </aside>
  );
}
