/**
 * Player Name Utilities
 * ฟังก์ชันสำหรับตรวจสอบชื่อผู้เล่น
 */

/**
 * ตรวจสอบความถูกต้องของชื่อผู้เล่น
 */
export function validatePlayerName(name: string): boolean {
  return name.trim().length >= 2 && name.trim().length <= 20;
}
