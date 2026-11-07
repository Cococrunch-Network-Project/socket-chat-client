/**
 * ข้อจำกัดที่ตกลงกับฝั่ง Server — ต้องตรงกับ Server เสมอ
 * ถ้า Server เปลี่ยนค่า ให้แก้ที่ไฟล์นี้ไฟล์เดียว
 */

/** ชื่อผู้ใช้ 1–30 ตัวอักษร */
export const USERNAME_MAX = 30;

/** ชื่อกลุ่มไม่เกิน 94 ตัวอักษร */
export const GROUPNAME_MAX = 94;

/** ข้อความตัวอักษรไม่เกิน 4000 ตัว */
export const MESSAGE_MAX = 4000;

/**
 * ไฟล์/รูปไม่เกิน 7MB (ขนาดไฟล์จริงก่อนแปลง Base64)
 * Base64 ทำให้ใหญ่ขึ้น ~4/3 เท่า → 7 MiB กลายเป็น ~9.79MB
 * ยังต่ำกว่า maxHttpBufferSize 1e7 (10MB) ของ Server
 * ถ้าใหญ่กว่านี้ Socket จะถูกตัดการเชื่อมต่อทันที → ต้องเช็กก่อน emit เสมอ
 */
export const FILE_MAX_BYTES = 7 * 1024 * 1024;

/** Server ส่ง chat_history มาให้ล่าสุดไม่เกิน 50 ข้อความ */
export const HISTORY_LIMIT = 50;

/** ห้ามส่งไฟล์ HTML / JavaScript / SVG (เสี่ยง XSS) */
export const BLOCKED_EXTENSIONS = [
  'html', 'htm', 'xhtml', 'shtml',
  'js', 'mjs', 'cjs', 'jsx',
  'svg', 'svgz',
] as const;

export const BLOCKED_MIME_TYPES = [
  'text/html',
  'application/xhtml+xml',
  'text/javascript',
  'application/javascript',
  'application/x-javascript',
  'application/ecmascript',
  'text/ecmascript',
  'image/svg+xml',
] as const;
