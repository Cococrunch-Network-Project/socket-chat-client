import {
  BLOCKED_EXTENSIONS,
  BLOCKED_MIME_TYPES,
  FILE_MAX_BYTES,
  GROUPNAME_MAX,
  MESSAGE_MAX,
  USERNAME_MAX,
} from './limits';

/** ตัวอักษรในวงกลม Avatar — ข้ามสระนำภาษาไทย (เ แ โ ใ ไ) เช่น "เมล" -> "ม" */
export function getInitial(name: string): string {
  return (name.replace(/^[เแโใไ]+/, '').charAt(0) || name.charAt(0)).toUpperCase();
}

// ---------- ชื่อผู้ใช้ ----------

/** อักขระที่อนุญาต: ไทย (ไม่รวม ฿ และเครื่องหมายพิเศษ) / อังกฤษ / ตัวเลข / . / - */
const ALLOWED_CHARS = /^[\u0E01-\u0E3A\u0E40-\u0E4E\u0E50-\u0E59A-Za-z0-9.-]+$/;
/** ต้องมีตัวอักษรหรือตัวเลขอย่างน้อย 1 ตัว (กันชื่อแบบ "..." หรือ "-") */
const HAS_LETTER_OR_DIGIT = /[\p{L}\p{N}]/u;
/**
 * ห้ามขึ้นต้นด้วยสระ/วรรณยุกต์ที่ต้องเกาะพยัญชนะ:
 * ะ ั า ำ ิ ี ึ ื ุ ู ฺ ๅ ็ ่ ้ ๊ ๋ ์ ํ ๎
 * (สระหน้า เ แ โ ใ ไ ขึ้นต้นได้ เช่น "เมล")
 */
// oxlint-disable-next-line no-misleading-character-class -- ตั้งใจจับสระ/วรรณยุกต์ "ตัวเดียว" ที่ขึ้นต้นชื่อ
const BAD_FIRST_CHAR = /^[\u0E30-\u0E3A\u0E45\u0E47-\u0E4E]/;

/**
 * ตรวจชื่อผู้ใช้ — กฎเดียวกับ isValidUsername() ใน models/User.ts ฝั่ง Server
 * - 1–30 ตัวอักษร
 * - ไทย / อังกฤษ / ตัวเลข / . / - เท่านั้น
 * - ห้าม "_" (ใช้คั่นชื่อห้อง private_A_B) และห้ามช่องว่าง
 * - ต้องมีตัวอักษรหรือตัวเลข และห้ามขึ้นต้นด้วยสระ/วรรณยุกต์
 * คืนข้อความ error ภาษาไทย หรือ null ถ้าผ่าน (ช่องว่างหัว/ท้ายจะถูก trim ก่อน)
 */
export function validateUsername(raw: string): string | null {
  const name = raw.trim();
  if (!name) return 'กรุณากรอกชื่อ';
  if (name.length > USERNAME_MAX) return `ชื่อยาวได้ไม่เกิน ${USERNAME_MAX} ตัวอักษร`;
  if (name.includes('_')) return 'ชื่อห้ามมีเครื่องหมาย _';
  if (/\s/.test(name)) return 'ชื่อห้ามมีช่องว่าง';
  if (!ALLOWED_CHARS.test(name)) return 'ใช้ได้เฉพาะภาษาไทย อังกฤษ ตัวเลข . และ -';
  if (!HAS_LETTER_OR_DIGIT.test(name)) return 'ชื่อต้องมีตัวอักษรหรือตัวเลขอย่างน้อย 1 ตัว';
  if (BAD_FIRST_CHAR.test(name)) return 'ชื่อห้ามขึ้นต้นด้วยสระหรือวรรณยุกต์';
  return null;
}

// ---------- ชื่อกลุ่ม ----------

export function validateGroupName(raw: string, existing: string[]): string | null {
  const name = raw.trim();
  if (!name) return 'กรุณากรอกชื่อกลุ่ม';
  if (name.length > GROUPNAME_MAX) return `ชื่อกลุ่มยาวได้ไม่เกิน ${GROUPNAME_MAX} ตัวอักษร`;
  if (existing.includes(name)) return 'มีกลุ่มชื่อนี้แล้ว';
  return null;
}

// ---------- ข้อความ / ไฟล์ (สำหรับคนที่ 4: ChatInput / ปุ่มแนบไฟล์) ----------

export function validateMessageText(text: string): string | null {
  if (!text.trim()) return 'กรุณาพิมพ์ข้อความ';
  if (text.length > MESSAGE_MAX) {
    return `ข้อความยาวเกิน ${MESSAGE_MAX.toLocaleString()} ตัวอักษร (ตอนนี้ ${text.length.toLocaleString()})`;
  }
  return null;
}

/**
 * เช็กไฟล์ก่อนอ่านเป็น Base64 และก่อน emit ทุกครั้ง
 * (ไฟล์ใหญ่เกิน → Socket หลุด, ไฟล์ HTML/JS/SVG → Server ปฏิเสธ)
 */
export function validateFile(file: Pick<File, 'name' | 'size' | 'type'>): string | null {
  const ext = file.name.split('.').pop()?.toLowerCase() ?? '';
  const mime = file.type.toLowerCase();
  if (
    (BLOCKED_EXTENSIONS as readonly string[]).includes(ext) ||
    (BLOCKED_MIME_TYPES as readonly string[]).includes(mime)
  ) {
    return 'ไม่อนุญาตให้ส่งไฟล์ HTML, JavaScript หรือ SVG';
  }
  if (file.size === 0) return 'ไฟล์ว่างเปล่า';
  if (file.size > FILE_MAX_BYTES) {
    const mb = (file.size / 1024 / 1024).toFixed(1);
    return `ไฟล์ใหญ่เกิน 7MB (ไฟล์นี้ ${mb}MB)`;
  }
  return null;
}
