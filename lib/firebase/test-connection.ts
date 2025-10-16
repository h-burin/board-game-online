/**
 * Test Firebase Connection
 * ไฟล์สำหรับทดสอบการเชื่อมต่อ Firebase
 */

import { db, realtimeDb } from './config';
import { collection, addDoc } from 'firebase/firestore';
import { ref, set } from 'firebase/database';

/**
 * ทดสอบ Firestore Connection
 */
export async function testFirestore() {
  try {
    const testRef = await addDoc(collection(db, 'test'), {
      message: 'Hello from Firestore!',
      timestamp: new Date(),
    });
    console.log('✅ Firestore connected! Document ID:', testRef.id);
    return true;
  } catch (error) {
    console.error('❌ Firestore connection failed:', error);
    return false;
  }
}

/**
 * ทดสอบ Realtime Database Connection
 */
export async function testRealtimeDatabase() {
  try {
    const testRef = ref(realtimeDb, 'test');
    await set(testRef, {
      message: 'Hello from Realtime Database!',
      timestamp: new Date().toISOString(),
    });
    console.log('✅ Realtime Database connected!');
    return true;
  } catch (error) {
    console.error('❌ Realtime Database connection failed:', error);
    return false;
  }
}

/**
 * ทดสอบทั้งหมด
 */
export async function testAllConnections() {
  console.log('🔥 Testing Firebase connections...\n');

  const firestoreOk = await testFirestore();
  const realtimeOk = await testRealtimeDatabase();

  console.log('\n📊 Results:');
  console.log('Firestore:', firestoreOk ? '✅' : '❌');
  console.log('Realtime Database:', realtimeOk ? '✅' : '❌');

  return firestoreOk && realtimeOk;
}
