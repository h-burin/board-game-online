/**
 * API Route: สร้างห้องเกมใหม่
 * POST /api/rooms/create
 * Body: { playerName: string, maxPlayers: number }
 * Response: { success: true, roomId: string, code: string, playerId: string }
 */

import { NextRequest, NextResponse } from 'next/server';
import { collection, doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { generateRoomCode } from '@/lib/utils/roomCode';

export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json();
    const { playerName, maxPlayers } = body;

    // Validation
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

    if (!maxPlayers || typeof maxPlayers !== 'number') {
      return NextResponse.json(
        { success: false, error: 'กรุณาระบุจำนวนผู้เล่นสูงสุด' },
        { status: 400 }
      );
    }

    if (maxPlayers < 2 || maxPlayers > 8) {
      return NextResponse.json(
        { success: false, error: 'จำนวนผู้เล่นต้องอยู่ระหว่าง 2-8 คน' },
        { status: 400 }
      );
    }

    // Generate unique room code
    const code = generateRoomCode();

    // Create room document
    const roomsRef = collection(db, 'rooms');
    const roomDoc = doc(roomsRef);
    const roomId = roomDoc.id;

    // Create player document
    const playersRef = collection(db, `rooms/${roomId}/players`);
    const playerDoc = doc(playersRef);
    const playerId = playerDoc.id;

    // Room data
    const roomData = {
      id: roomId,
      code: code,
      gameType: 'mock-game',
      hostId: playerId,
      status: 'waiting',
      maxPlayers: maxPlayers,
      currentPlayers: 1,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    // Player data
    const playerData = {
      id: playerId,
      name: playerName.trim(),
      isHost: true,
      isReady: false,
      isOnline: true,
      joinedAt: serverTimestamp(),
    };

    // Save to Firestore
    await setDoc(roomDoc, roomData);
    await setDoc(playerDoc, playerData);

    // Return success response
    return NextResponse.json({
      success: true,
      roomId: roomId,
      code: code,
      playerId: playerId,
    });

  } catch (error) {
    console.error('Error creating room:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'เกิดข้อผิดพลาดในการสร้างห้อง กรุณาลองใหม่อีกครั้ง',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
