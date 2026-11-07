import ChatApp from './components/ChatApp';
import LoginScreen from './components/LoginScreen';
import { useLobby } from './hooks/useLobby';
import { useSession } from './hooks/useSession';

export default function App() {
  const session = useSession();
  // ฟัง users_updated / groups_updated ตั้งแต่ก่อน login เพื่อไม่พลาด broadcast แรก
  const { users, groups } = useLobby();

  if (!session.username) {
    return (
      <LoginScreen
        onLogin={session.login}
        loading={session.loading}
        serverError={session.error}
        initialName={session.savedName}
      />
    );
  }

  return (
    // key={username} → logout / เปลี่ยนชื่อแล้ว state ห้องแชททั้งหมดรีเซ็ตใหม่
    <ChatApp
      key={session.username}
      username={session.username}
      sessionVersion={session.sessionVersion}
      users={users}
      groups={groups}
      onLogout={session.logout}
    />
  );
}
