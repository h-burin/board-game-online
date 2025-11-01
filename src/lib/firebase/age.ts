/**
 * Age Data Firebase Functions
 * จัดการการเก็บข้อมูลอายุผู้ใช้ใน Firebase
 */

import {
  collection,
  addDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from './config';

export interface AgeSubmission {
  age: number;
  timestamp?: any; // serverTimestamp
  userAgent?: string;
  platform?: string;
}

/**
 * บันทึกข้อมูลอายุลง Firebase
 */
export async function saveAgeToFirebase(age: number): Promise<string> {
  try {
    if (age < 1 || age > 100) {
      throw new Error('อายุไม่ถูกต้อง (ต้องอยู่ระหว่าง 1-100)');
    }

    const ageRef = collection(db, 'user_ages');

    // เพิ่มข้อมูล user agent และ platform
    const userAgent = typeof window !== 'undefined' ? window.navigator.userAgent : 'unknown';
    const platform = typeof window !== 'undefined' ? window.navigator.platform : 'unknown';

    const docRef = await addDoc(ageRef, {
      age,
      timestamp: serverTimestamp(),
      userAgent,
      platform,
    });

    console.log('✅ Age data saved to Firebase:', docRef.id);
    return docRef.id;
  } catch (error) {
    console.error('❌ Error saving age to Firebase:', error);
    throw error;
  }
}
