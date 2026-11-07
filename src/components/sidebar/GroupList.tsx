import { getGroupRoomId } from '../../lib/rooms';
import type { Group } from '../../types';
import UnreadBadge from './Badge';
import CreateGroupForm from './CreateGroupForm';

interface Props {
  groups: Group[];
  me: string;
  activeRoomId: string | null;
  unread: Record<string, number>;
  onCreate: (groupName: string) => void;
  onJoin: (groupName: string) => void;
  onOpen: (groupName: string) => void;
}

/**
 * Task 3.4 — รายการกลุ่มทั้งหมด + สมาชิก (R9)
 * ยังไม่ได้เป็นสมาชิก → ปุ่ม Join (R10: ต้องกดเข้าเองเท่านั้น)
 * เป็นสมาชิกแล้ว → คลิกเข้าห้องแชทได้
 */
export default function GroupList({
  groups,
  me,
  activeRoomId,
  unread,
  onCreate,
  onJoin,
  onOpen,
}: Props) {
  return (
    <section>
      <h2 className="px-4 pb-2 pt-4 text-xs font-semibold uppercase tracking-wider text-slate-400">
        กลุ่ม ({groups.length})
      </h2>

      <CreateGroupForm existingNames={groups.map((g) => g.groupName)} onCreate={onCreate} />

      <ul className="space-y-0.5 px-2">
        {groups.map((g) => {
          const roomId = getGroupRoomId(g.groupName);
          const isMember = g.members.includes(me);
          const active = roomId === activeRoomId;

          const body = (
            <>
              <div className="flex items-center gap-2">
                <span className="text-slate-400">#</span>
                <span className="truncate font-medium">{g.groupName}</span>
                {isMember ? (
                  <UnreadBadge count={unread[roomId]} />
                ) : (
                  <span className="ml-auto text-xs text-slate-400">{g.members.length} คน</span>
                )}
              </div>
              <p
                className={`mt-0.5 truncate pl-4 text-xs ${
                  active ? 'text-indigo-200' : 'text-slate-400'
                }`}
                title={g.members.join(', ')}
              >
                {g.members.map((m) => (m === me ? `${m} (คุณ)` : m)).join(', ')}
              </p>
            </>
          );

          return (
            <li key={g.groupName}>
              {isMember ? (
                <button
                  onClick={() => onOpen(g.groupName)}
                  className={`w-full rounded-lg px-2 py-2 text-left transition ${
                    active ? 'bg-indigo-600 text-white' : 'text-slate-200 hover:bg-slate-800'
                  }`}
                >
                  {body}
                </button>
              ) : (
                <div className="rounded-lg px-2 py-2 text-slate-400">
                  {body}
                  <button
                    onClick={() => onJoin(g.groupName)}
                    className="ml-4 mt-1.5 rounded-md bg-emerald-600 px-3 py-0.5 text-xs font-semibold text-white transition hover:bg-emerald-500"
                  >
                    Join
                  </button>
                </div>
              )}
            </li>
          );
        })}

        {groups.length === 0 && (
          <li className="px-2 py-2 text-sm italic text-slate-500">ยังไม่มีกลุ่ม</li>
        )}
      </ul>
    </section>
  );
}
