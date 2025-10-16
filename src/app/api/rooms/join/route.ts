/**
 * API Route: เข้าร่วมห้องเกม
 * POST /api/rooms/join
 * Body: { code: string, playerName: string }
 * Response: { success: true, roomId: string, playerId: string }
 */

import { NextRequest, NextResponse } from 'next/server';
import { collection, doc, setDoc, serverTimestamp, query, where, getDocs, updateDoc, increment } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { validateRoomCode } from '@/lib/utils/roomCode';

export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json();
    const { code, playerName } = body;

    // Validation - Room Code
    if (!code || typeof code !== 'string') {
      return NextResponse.json(
        { success: false, error: 'กรุณากรอกรหัสห้อง' },
        { status: 400 }
      );
    }

    if (!validateRoomCode(code)) {
      return NextResponse.json(
        { success: false, error: 'รหัสห้องไม่ถูกต้อง (ต้องเป็นตัวเลข 6 หลัก)' },
        { status: 400 }
      );
    }

    // Validation - Player Name
    if (!playerName || typeof playerName !== 'string') {
      return NextResponse.json(
        { success: false, error: 'กรุณากรอกชื่อผู้เล่น' },
        { status: 400 }
      );
    }

    if (playerName.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: 'ชื่อผู้เล่นไม่สามารถว่างได้' },
        { status: 400 }
      );
    }

    if (playerName.length > 20) {
      return NextResponse.json(
        { success: false, error: 'ชื่อผู้เล่นต้องไม่เกิน 20 ตัวอักษร' },
        { status: 400 }
      );
    }

    // Find room by code
    const roomsRef = collection(db, 'rooms');
    const q = query(roomsRef, where('code', '==', code));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      return NextResponse.json(
        { success: false, error: 'ไม่พบห้อง กรุณาตรวจสอบรหัสห้องอีกครั้ง' },
        { status: 404 }
      );
    }

    // Get room data
    const roomDoc = querySnapshot.docs[0];
    const roomData = roomDoc.data();
    const roomId = roomDoc.id;

    // Validate room status
    if (roomData.status !== 'waiting') {
      return NextResponse.json(
        { success: false, error: 'เกมเริ่มแล้ว ไม่สามารถเข้าร่วมได้' },
        { status: 400 }
      );
    }

    // Validate room capacity
    if (roomData.currentPlayers >= roomData.maxPlayers) {
      return NextResponse.json(
        { success: false, error: 'ห้องเต็มแล้ว ไม่สามารถเข้าร่วมได้' },
        { status: 400 }
      );
    }

    // Create new player
    const playersRef = collection(db, `rooms/${roomId}/players`);
    const playerDoc = doc(playersRef);
    const playerId = playerDoc.id;

    const playerData = {
      id: playerId,
      name: playerName.trim(),
      isHost: false,
      isReady: false,
      isOnline: true,
      joinedAt: serverTimestamp(),
    };

    // Save player to Firestore
    await setDoc(playerDoc, playerData);

    // Update room's currentPlayers count
    const roomDocRef = doc(db, 'rooms', roomId);
    await updateDoc(roomDocRef, {
      currentPlayers: increment(1),
      updatedAt: serverTimestamp(),
    });

    // Return success response
    return NextResponse.json({
      success: true,
      roomId: roomId,
      playerId: playerId,
      code: code,
    });

  } catch (error) {
    console.error('Error joining room:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'เกิดข้อผิดพลาดในการเข้าร่วมห้อง กรุณาลองใหม่อีกครั้ง',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
