import { getPrivateRoomId } from '../../lib/rooms';
import { getInitial } from '../../lib/validation';
import UnreadBadge from './Badge';

interface Props {
  users: string[];
  me: string;
  activeRoomId: string | null;
  unread: Record<string, number>;
  onOpenPrivate: (peer: string) => void;
}

function Avatar({ name, self }: { name: string; self?: boolean }) {
  return (
    <span
      className={`relative flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-semibold text-white ${
        self ? 'bg-indigo-500' : 'bg-slate-500'
      }`}
    >
      {getInitial(name)}
      <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-slate-900 bg-green-500" />
    </span>
  );
}

/** Task 3.3 — รายชื่อผู้ใช้ออนไลน์ทั้งหมด (R4) คลิกเพื่อแชทส่วนตัว (R7) */
export default function UserList({ users, me, activeRoomId, unread, onOpenPrivate }: Props) {
  const others = users.filter((u) => u !== me).sort();

  return (
    <section>
      <h2 className="px-4 pb-1 pt-4 text-xs font-semibold uppercase tracking-wider text-slate-400">
        ออนไลน์ ({users.length})
      </h2>
      <ul className="space-y-0.5 px-2">
        {/* ตัวเอง — แสดงด้วยแต่คลิกไม่ได้ */}
        <li className="flex items-center gap-3 rounded-lg px-2 py-2 text-slate-300">
          <Avatar name={me} self />
          <span className="truncate">{me}</span>
          <span className="rounded bg-indigo-500/20 px-1.5 py-0.5 text-[10px] font-semibold text-indigo-300">
            คุณ
          </span>
        </li>

        {others.map((u) => {
          const roomId = getPrivateRoomId(me, u);
          const active = roomId === activeRoomId;
          return (
            <li key={u}>
              <button
                onClick={() => onOpenPrivate(u)}
                className={`flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left transition ${
                  active ? 'bg-indigo-600 text-white' : 'text-slate-200 hover:bg-slate-800'
                }`}
              >
                <Avatar name={u} />
                <span className="truncate">{u}</span>
                <UnreadBadge count={unread[roomId]} />
              </button>
            </li>
          );
        })}

        {others.length === 0 && (
          <li className="px-2 py-2 text-sm italic text-slate-500">ยังไม่มีคนอื่นออนไลน์</li>
        )}
      </ul>
    </section>
  );
}
