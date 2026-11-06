/**
 * มาตรฐานชื่อห้อง (Master Plan หัวข้อ 4)
 * ⚠️ ฝั่ง Server ต้องใช้วิธีเรียงแบบเดียวกัน คือ [a, b].sort() (เรียงตาม UTF-16 code unit)
 *    ห้ามใช้ localeCompare ฝั่งใดฝั่งหนึ่ง ไม่งั้นชื่อห้องภาษาไทยอาจไม่ตรงกัน
 */

/** ห้องที่กำลังเปิดอยู่ (Task 3.5) */
export type ActiveRoom =
  | { kind: 'private'; id: string; peer: string }
  | { kind: 'group'; id: string; groupName: string };

export const PRIVATE_PREFIX = 'private_';
export const GROUP_PREFIX = 'group_';

/** ['เมล', 'บีม'] -> 'private_บีม_เมล' */
export function getPrivateRoomId(userA: string, userB: string): string {
  return PRIVATE_PREFIX + [userA, userB].sort().join('_');
}

/** 'NetworkProject' -> 'group_NetworkProject' */
export function getGroupRoomId(groupName: string): string {
  return GROUP_PREFIX + groupName;
}

export function isPrivateRoom(roomId: string): boolean {
  return roomId.startsWith(PRIVATE_PREFIX);
}

export function isGroupRoom(roomId: string): boolean {
  return roomId.startsWith(GROUP_PREFIX);
}
