/**
 * Room Code Utilities
 * ฟังก์ชันสำหรับสร้างและตรวจสอบรหัสห้อง
 */

/**
 * สร้างรหัสห้องแบบสุ่ม 6 หลัก (ตัวเลขเท่านั้น)
 * @returns รหัสห้อง 6 หลัก เช่น "123456"
 */
export function generateRoomCode(): string {
  // สร้างเลข 6 หลัก (100000-999999)
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  return code;
}

/**
 * ตรวจสอบความถูกต้องของรหัสห้อง
 * @param code - รหัสห้องที่ต้องการตรวจสอบ
 * @returns true ถ้ารหัสห้องถูกต้อง (6 หลัก ตัวเลขเท่านั้น)
 */
export function validateRoomCode(code: string): boolean {
  // ตรวจสอบว่าเป็นตัวเลข 6 หลัก
  const regex = /^\d{6}$/;
  return regex.test(code);
}
