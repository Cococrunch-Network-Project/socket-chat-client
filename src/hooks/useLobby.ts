import { useEffect, useState } from 'react';
import { socket } from '../lib/socket';
import type { Group } from '../types';

/** Task 3.3 / 3.4 — รับรายชื่อคนออนไลน์ (R4) และรายการกลุ่ม (R9) แบบ real-time */
export function useLobby() {
  const [users, setUsers] = useState<string[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);

  useEffect(() => {
    const onUsers = (list: string[]) => setUsers(list);
    const onGroups = (list: Group[]) => setGroups(list);
    // ล้างข้อมูลเก่าเมื่อหลุด เพื่อไม่ให้แสดงรายชื่อค้าง
    const onDisconnect = () => {
      setUsers([]);
      setGroups([]);
    };

    socket.on('users_updated', onUsers);
    socket.on('groups_updated', onGroups);
    socket.on('disconnect', onDisconnect);
    return () => {
      socket.off('users_updated', onUsers);
      socket.off('groups_updated', onGroups);
      socket.off('disconnect', onDisconnect);
    };
  }, []);

  return { users, groups };
}
