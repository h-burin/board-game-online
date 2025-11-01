/**
 * User Analytics Firebase Functions
 * จัดการการเก็บข้อมูล analytics ของผู้ใช้ใน Firebase
 */

import {
  collection,
  addDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from './config';

export interface UserAnalytics {
  // Demographics
  ageRange: string; // เช่น "18-24", "25-34"

  // Device Information
  deviceType: 'mobile' | 'tablet' | 'desktop' | 'unknown';
  os: string; // iOS, Android, Windows, macOS, Linux
  browser: string; // Chrome, Safari, Firefox, Edge

  // Screen Information
  screenWidth: number;
  screenHeight: number;
  viewportWidth: number;
  viewportHeight: number;

  // Technical Details
  userAgent: string;
  platform: string;
  language: string;
  timezone: string;

  // Timestamp
  timestamp?: any; // serverTimestamp
}

/**
 * ตรวจสอบประเภทอุปกรณ์จาก userAgent
 */
function getDeviceType(userAgent: string): 'mobile' | 'tablet' | 'desktop' | 'unknown' {
  const ua = userAgent.toLowerCase();

  if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua)) {
    return 'tablet';
  }
  if (/Mobile|Android|iP(hone|od)|IEMobile|BlackBerry|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/.test(userAgent)) {
    return 'mobile';
  }
  if (ua.includes('windows') || ua.includes('mac') || ua.includes('linux')) {
    return 'desktop';
  }

  return 'unknown';
}

/**
 * ตรวจสอบ OS จาก userAgent
 */
function getOS(userAgent: string, platform: string): string {
  const ua = userAgent.toLowerCase();

  if (/iphone|ipad|ipod/.test(ua)) return 'iOS';
  if (/android/.test(ua)) return 'Android';
  if (/win/.test(ua) || platform.includes('Win')) return 'Windows';
  if (/mac/.test(ua) || platform.includes('Mac')) return 'macOS';
  if (/linux/.test(ua) || platform.includes('Linux')) return 'Linux';

  return 'Unknown';
}

/**
 * ตรวจสอบ Browser จาก userAgent
 */
function getBrowser(userAgent: string): string {
  const ua = userAgent;

  if (ua.includes('Edg/')) return 'Edge';
  if (ua.includes('Chrome/') && !ua.includes('Edg/')) return 'Chrome';
  if (ua.includes('Safari/') && !ua.includes('Chrome/')) return 'Safari';
  if (ua.includes('Firefox/')) return 'Firefox';
  if (ua.includes('Opera/') || ua.includes('OPR/')) return 'Opera';

  return 'Unknown';
}

/**
 * บันทึกข้อมูล user analytics ลง Firebase
 */
export async function saveUserAnalytics(ageRange: string): Promise<string> {
  try {
    const analyticsRef = collection(db, 'user_analytics');

    // เก็บข้อมูลจาก browser
    const userAgent = typeof window !== 'undefined' ? window.navigator.userAgent : 'unknown';
    const platform = typeof window !== 'undefined' ? window.navigator.platform : 'unknown';
    const language = typeof window !== 'undefined' ? window.navigator.language : 'unknown';
    const timezone = typeof window !== 'undefined' ? Intl.DateTimeFormat().resolvedOptions().timeZone : 'unknown';

    const screenWidth = typeof window !== 'undefined' ? window.screen.width : 0;
    const screenHeight = typeof window !== 'undefined' ? window.screen.height : 0;
    const viewportWidth = typeof window !== 'undefined' ? window.innerWidth : 0;
    const viewportHeight = typeof window !== 'undefined' ? window.innerHeight : 0;

    const analyticsData: Partial<UserAnalytics> = {
      ageRange,
      deviceType: getDeviceType(userAgent),
      os: getOS(userAgent, platform),
      browser: getBrowser(userAgent),
      screenWidth,
      screenHeight,
      viewportWidth,
      viewportHeight,
      userAgent,
      platform,
      language,
      timezone,
      timestamp: serverTimestamp(),
    };

    const docRef = await addDoc(analyticsRef, analyticsData);

    console.log('✅ User analytics saved to Firebase:', docRef.id);
    return docRef.id;
  } catch (error) {
    console.error('❌ Error saving user analytics to Firebase:', error);
    throw error;
  }
}

// Backward compatibility - alias ชื่อเดิม
export const saveAgeToFirebase = saveUserAnalytics;
