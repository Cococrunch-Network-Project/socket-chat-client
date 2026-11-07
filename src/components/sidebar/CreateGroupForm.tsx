import { useState, type FormEvent } from 'react';
import { GROUPNAME_MAX } from '../../lib/limits';
import { validateGroupName } from '../../lib/validation';

interface Props {
  existingNames: string[];
  onCreate: (groupName: string) => void;
}

/** Task 3.4 — ปุ่ม "+ สร้างกลุ่มใหม่" (R8) */
export default function CreateGroupForm({ existingNames, onCreate }: Props) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);

  const close = () => {
    setOpen(false);
    setName('');
    setError(null);
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const err = validateGroupName(name, existingNames);
    if (err) return setError(err);
    onCreate(name.trim());
    close();
  };

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="mx-2 mb-1 w-[calc(100%-1rem)] rounded-lg border border-dashed border-slate-600 py-2 text-sm text-slate-300 transition hover:border-indigo-400 hover:text-indigo-300"
      >
        + สร้างกลุ่มใหม่
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="mx-2 mb-2 rounded-lg bg-slate-800 p-2">
      <input
        autoFocus
        maxLength={GROUPNAME_MAX}
        value={name}
        onChange={(e) => {
          setName(e.target.value);
          setError(null);
        }}
        onKeyDown={(e) => e.key === 'Escape' && close()}
        placeholder="ชื่อกลุ่ม"
        className="w-full rounded-md bg-slate-700 px-2 py-1.5 text-sm text-white outline-none placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-400"
      />
      {error && <p className="mt-1 text-xs text-red-400">{error}</p>}
      <div className="mt-2 flex gap-2">
        <button
          type="submit"
          className="flex-1 rounded-md bg-indigo-600 py-1 text-sm font-medium text-white hover:bg-indigo-700"
        >
          สร้าง
        </button>
        <button
          type="button"
          onClick={close}
          className="flex-1 rounded-md bg-slate-700 py-1 text-sm text-slate-300 hover:bg-slate-600"
        >
          ยกเลิก
        </button>
      </div>
    </form>
  );
}
