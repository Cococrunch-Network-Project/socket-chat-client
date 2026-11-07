import { useState, type FormEvent } from 'react';
import { SOCKET_URL } from '../lib/socket';
import { USERNAME_MAX } from '../lib/limits';
import { validateUsername } from '../lib/validation';

interface Props {
  onLogin: (username: string) => void;
  loading: boolean;
  /** error จาก Server เช่น ชื่อซ้ำ (R3) */
  serverError: string | null;
  initialName?: string | null;
}

/** Task 3.2 — หน้ากรอกชื่อผู้ใช้ (R3) */
export default function LoginScreen({ onLogin, loading, serverError, initialName }: Props) {
  const [name, setName] = useState(initialName ?? '');
  const [localError, setLocalError] = useState<string | null>(null);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const err = validateUsername(name);
    setLocalError(err);
    if (!err) onLogin(name.trim());
  };

  const error = localError ?? serverError;

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 p-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm rounded-2xl bg-white p-8 shadow-lg"
      >
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-600 text-2xl text-white">
            💬
          </div>
          <h1 className="text-2xl font-bold text-slate-800">Socket Chat</h1>
          <p className="mt-1 text-sm text-slate-500">ตั้งชื่อเพื่อเริ่มแชท</p>
        </div>

        <label htmlFor="username" className="mb-1 block text-sm font-medium text-slate-700">
          ชื่อผู้ใช้
        </label>
        <input
          id="username"
          autoFocus
          autoComplete="off"
          maxLength={USERNAME_MAX}
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            setLocalError(null);
          }}
          placeholder="เช่น บีม"
          aria-invalid={!!error}
          className={`w-full rounded-lg border px-3 py-2 outline-none transition focus:ring-2 ${
            error
              ? 'border-red-400 focus:ring-red-200'
              : 'border-slate-300 focus:border-indigo-500 focus:ring-indigo-200'
          }`}
        />

        {error && (
          <p role="alert" className="mt-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
            ⚠️ {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="mt-5 w-full rounded-lg bg-indigo-600 py-2.5 font-medium text-white transition hover:bg-indigo-700 disabled:cursor-wait disabled:bg-indigo-300"
        >
          {loading ? 'กำลังเชื่อมต่อ...' : 'เข้าสู่แชท'}
        </button>

        <p className="mt-4 break-all text-center font-mono text-[11px] text-slate-400">
          {SOCKET_URL}
        </p>
      </form>
    </main>
  );
}
