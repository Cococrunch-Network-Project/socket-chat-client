import type { ActiveRoom } from '../lib/rooms';
import { getInitial } from '../lib/validation';
import type { Group } from '../types';

interface Props {
  room: ActiveRoom;
  users: string[];
  groups: Group[];
  me: string;
}

/** หัวห้องแชท: บอกชัดว่าเป็นแชทส่วนตัวหรือกลุ่ม (R5) */
export default function RoomHeader({ room, users, groups, me }: Props) {
  if (room.kind === 'private') {
    const online = users.includes(room.peer);
    return (
      <header className="flex items-center gap-3 border-b border-slate-200 bg-white px-5 py-3">
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-500 font-semibold text-white">
          {getInitial(room.peer)}
        </span>
        <div>
          <h2 className="font-semibold text-slate-800">{room.peer}</h2>
          <p className="text-xs text-slate-500">
            แชทส่วนตัว ·{' '}
            <span className={online ? 'text-green-600' : 'text-slate-400'}>
              {online ? 'ออนไลน์' : 'ออฟไลน์'}
            </span>
          </p>
        </div>
      </header>
    );
  }

  const members = groups.find((g) => g.groupName === room.groupName)?.members ?? [];
  return (
    <header className="flex items-center gap-3 border-b border-slate-200 bg-white px-5 py-3">
      <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-600 font-bold text-white">
        #
      </span>
      <div className="min-w-0">
        <h2 className="truncate font-semibold text-slate-800" title={room.groupName}>
          {room.groupName}
        </h2>
        <p className="truncate text-xs text-slate-500" title={members.join(', ')}>
          กลุ่ม · {members.length} สมาชิก:{' '}
          {members.map((m) => (m === me ? 'คุณ' : m)).join(', ')}
        </p>
      </div>
    </header>
  );
}
