/**
 * ข้อจำกัดฝั่ง Client — ต้องไม่เกินข้อจำกัดของ Server
 * ถ้า Server เปลี่ยนค่า ให้แก้ที่ไฟล์นี้ไฟล์เดียว
 */

/** ชื่อผู้ใช้ 1–30 ตัวอักษร */
export const USERNAME_MAX = 30;

/** ชื่อกลุ่มไม่เกิน 94 ตัวอักษร */
export const GROUPNAME_MAX = 94;

/** ข้อความตัวอักษรไม่เกิน 4000 ตัว */
export const MESSAGE_MAX = 4000;

/**
 * ไฟล์/รูปไม่เกิน 5 MB แบบฐานสิบ (ขนาดไฟล์จริงก่อนแปลง Base64)
 * 5,000,000 bytes → Base64 6,666,668 bytes โดยประมาณ
 * เหลือพื้นที่สำหรับ metadata ภายใน maxHttpBufferSize 7e6 ของ Server
 * ถ้าใหญ่กว่านี้ Socket จะถูกตัดการเชื่อมต่อทันที → ต้องเช็กก่อน emit เสมอ
 */
export const FILE_MAX_BYTES = 5_000_000;

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
