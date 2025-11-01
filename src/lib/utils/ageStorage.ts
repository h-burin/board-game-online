/**
 * Age Storage Utilities
 * จัดการการเก็บและตรวจสอบอายุผู้ใช้ใน localStorage
 */

const AGE_STORAGE_KEY = 'user_age';
const AGE_TIMESTAMP_KEY = 'user_age_timestamp';
const AGE_VALIDITY_DAYS = 30; // อายุข้อมูลหมดอายุใน 30 วัน

export interface AgeData {
  age: number;
  timestamp: number;
}

/**
 * บันทึกอายุลง localStorage
 */
export function saveAge(age: number): void {
  if (age < 1 || age > 120) {
    throw new Error('อายุไม่ถูกต้อง');
  }

  const data: AgeData = {
    age,
    timestamp: Date.now(),
  };

  localStorage.setItem(AGE_STORAGE_KEY, age.toString());
  localStorage.setItem(AGE_TIMESTAMP_KEY, data.timestamp.toString());
}

/**
 * ดึงข้อมูลอายุจาก localStorage
 */
export function getAge(): number | null {
  const ageStr = localStorage.getItem(AGE_STORAGE_KEY);
  if (!ageStr) return null;

  const age = parseInt(ageStr, 10);
  if (isNaN(age)) return null;

  return age;
}

/**
 * ดึงวันที่บันทึกล่าสุด
 */
export function getAgeTimestamp(): number | null {
  const timestampStr = localStorage.getItem(AGE_TIMESTAMP_KEY);
  if (!timestampStr) return null;

  const timestamp = parseInt(timestampStr, 10);
  if (isNaN(timestamp)) return null;

  return timestamp;
}

/**
 * ตรวจสอบว่าข้อมูลอายุยังใช้ได้หรือไม่ (ไม่เกิน 30 วัน)
 */
export function isAgeValid(): boolean {
  const age = getAge();
  const timestamp = getAgeTimestamp();

  if (age === null || timestamp === null) return false;

  const now = Date.now();
  const daysSinceLastUpdate = (now - timestamp) / (1000 * 60 * 60 * 24);

  return daysSinceLastUpdate <= AGE_VALIDITY_DAYS;
}

/**
 * ตรวจสอบว่าต้องถามอายุหรือไม่
 */
export function shouldAskAge(): boolean {
  return !isAgeValid();
}

/**
 * ลบข้อมูลอายุ (สำหรับทดสอบหรือ reset)
 */
export function clearAge(): void {
  localStorage.removeItem(AGE_STORAGE_KEY);
  localStorage.removeItem(AGE_TIMESTAMP_KEY);
}

/**
 * ดึงข้อมูลอายุพร้อมข้อมูลเพิ่มเติม
 */
export function getAgeData(): AgeData | null {
  const age = getAge();
  const timestamp = getAgeTimestamp();

  if (age === null || timestamp === null) return null;

  return { age, timestamp };
}
