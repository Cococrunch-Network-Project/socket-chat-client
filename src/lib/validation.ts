/** ตัวอักษรในวงกลม Avatar — ข้ามสระนำภาษาไทย (เ แ โ ใ ไ) เช่น "เมล" -> "ม" */
export function getInitial(name: string): string {
  return (name.replace(/^[เแโใไ]+/, '').charAt(0) || name.charAt(0)).toUpperCase();
}

export const USERNAME_MAX = 20;
export const GROUPNAME_MAX = 30;

/**
 * ตรวจชื่อผู้ใช้ฝั่ง Client — กฎต้องตรงกับ isValidUsername() ใน models/User.ts ฝั่ง Server
 * - รับภาษาไทยได้
 * - ห้ามมี "_" เพราะชื่อห้อง private_A_B ใช้ "_" คั่น
 *   (เช่น "a_b" + "c" กับ "a" + "b_c" จะได้ห้อง private_a_b_c เหมือนกัน)
 * - ห้ามมีช่องว่าง (หัว/ท้ายจะถูก trim ให้ก่อนส่ง)
 */
export function validateUsername(raw: string): string | null {
  const name = raw.trim();
  if (!name) return 'กรุณากรอกชื่อ';
  if (name.length > USERNAME_MAX) return `ชื่อยาวได้ไม่เกิน ${USERNAME_MAX} ตัวอักษร`;
  if (name.includes('_')) return 'ชื่อห้ามมีเครื่องหมาย _';
  if (/\s/.test(name)) return 'ชื่อห้ามมีช่องว่าง';
  return null;
}

export function validateGroupName(raw: string, existing: string[]): string | null {
  const name = raw.trim();
  if (!name) return 'กรุณากรอกชื่อกลุ่ม';
  if (name.length > GROUPNAME_MAX) return `ชื่อกลุ่มยาวได้ไม่เกิน ${GROUPNAME_MAX} ตัวอักษร`;
  if (existing.includes(name)) return 'มีกลุ่มชื่อนี้แล้ว';
  return null;
}
