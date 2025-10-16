/**
 * API Route: เริ่มเกม
 * POST /api/rooms/[roomId]/start
 * Body: { hostId: string }
 * Response: { success: true, gameId: string }
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp,
  collection,
  query,
  orderBy,
  getDocs,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';

interface StartGameRequest {
  hostId: string;
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ roomId: string }> }
) {
  try {
    // Await params (Next.js 15 requirement)
    const { roomId } = await context.params;

    // Parse request body
    const body: StartGameRequest = await request.json();
    const { hostId } = body;

    // Validation - hostId
    if (!hostId || typeof hostId !== 'string') {
      return NextResponse.json(
        { success: false, error: 'กรุณาระบุ hostId' },
        { status: 400 }
      );
    }

    // Get room document
    const roomRef = doc(db, 'rooms', roomId);
    const roomSnap = await getDoc(roomRef);

    if (!roomSnap.exists()) {
      return NextResponse.json(
        { success: false, error: 'ไม่พบห้อง' },
        { status: 404 }
      );
    }

    const roomData = roomSnap.data();

    // Validation - Check if requester is the host
    if (roomData.hostId !== hostId) {
      return NextResponse.json(
        { success: false, error: 'คุณไม่ใช่หัวหน้าห้อง' },
        { status: 403 }
      );
    }

    // Validation - Check if room already started
    if (roomData.status === 'playing') {
      return NextResponse.json(
        { success: false, error: 'เกมเริ่มแล้ว' },
        { status: 400 }
      );
    }

    // Validation - Check minimum players (at least 2)
    if (roomData.currentPlayers < 2) {
      return NextResponse.json(
        { success: false, error: 'ต้องมีผู้เล่นอย่างน้อย 2 คน' },
        { status: 400 }
      );
    }

    // Get all players (sorted by joinedAt)
    const playersRef = collection(db, `rooms/${roomId}/players`);
    const playersQuery = query(playersRef, orderBy('joinedAt', 'asc'));
    const playersSnap = await getDocs(playersQuery);

    if (playersSnap.empty || playersSnap.size < 2) {
      return NextResponse.json(
        { success: false, error: 'ต้องมีผู้เล่นอย่างน้อย 2 คน' },
        { status: 400 }
      );
    }

    // Get first player for currentTurn
    const firstPlayer = playersSnap.docs[0];
    const firstPlayerId = firstPlayer.id;

    // Create game document
    const gamesRef = collection(db, 'games');
    const gameDoc = doc(gamesRef);
    const gameId = gameDoc.id;

    const gameData = {
      id: gameId,
      roomId: roomId,
      gameType: 'mock-game',
      currentTurn: firstPlayerId,
      turnNumber: 0,
      state: {},
      startedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    // Save game document
    await setDoc(gameDoc, gameData);

    // Update room status to 'playing'
    await updateDoc(roomRef, {
      status: 'playing',
      gameId: gameId,
      updatedAt: serverTimestamp(),
    });

    // Return success response
    return NextResponse.json({
      success: true,
      gameId: gameId,
      message: 'เริ่มเกมสำเร็จ',
    });
  } catch (error) {
    console.error('Error starting game:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'เกิดข้อผิดพลาดในการเริ่มเกม กรุณาลองใหม่อีกครั้ง',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
