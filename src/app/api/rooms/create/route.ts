/**
 * API Route: สร้างห้องเกมใหม่
 * POST /api/rooms/create
 * Body: { playerName: string, gameId: string, maxPlayers: number }
 * Response: { success: true, roomId: string, code: string, playerId: string }
 */

import { NextRequest, NextResponse } from 'next/server';
import { collection, doc, setDoc, serverTimestamp, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { generateRoomCode } from '@/lib/utils/roomCode';

export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json();
    const { playerName, gameId, maxPlayers, timeLimit } = body;

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

    // Validation - Game ID
    if (!gameId || typeof gameId !== 'string') {
      return NextResponse.json(
        { success: false, error: 'กรุณาเลือกเกม' },
        { status: 400 }
      );
    }

    // Fetch game details to validate maxPlayers
    const gameRef = doc(db, 'games', gameId);
    const gameSnap = await getDoc(gameRef);

    if (!gameSnap.exists()) {
      return NextResponse.json(
        { success: false, error: 'ไม่พบเกมที่เลือก' },
        { status: 404 }
      );
    }

    const gameData = gameSnap.data();
    const minPlayers = gameData.minPlayer || 2;
    const maxPlayersAllowed = gameData.maxPlayer || 8;
    const enableCustomTime = gameData.enableCustomTime || false;
    const defaultTimeMinutes = gameData.defaultTimeMinutes;

    // Validation - Max Players
    if (!maxPlayers || typeof maxPlayers !== 'number') {
      return NextResponse.json(
        { success: false, error: 'กรุณาระบุจำนวนผู้เล่นสูงสุด' },
        { status: 400 }
      );
    }

    if (maxPlayers < minPlayers || maxPlayers > maxPlayersAllowed) {
      return NextResponse.json(
        {
          success: false,
          error: `จำนวนผู้เล่นต้องอยู่ระหว่าง ${minPlayers}-${maxPlayersAllowed} คน สำหรับเกมนี้`
        },
        { status: 400 }
      );
    }

    // Validation - Time Limit (if provided)
    let finalTimeLimit: number | undefined = undefined;
    if (timeLimit !== undefined && timeLimit !== null) {
      // Only validate if game supports custom time
      if (!enableCustomTime) {
        return NextResponse.json(
          { success: false, error: 'เกมนี้ไม่รองรับการกำหนดเวลาเอง' },
          { status: 400 }
        );
      }

      if (typeof timeLimit !== 'number' || timeLimit < 1 || timeLimit > 120) {
        return NextResponse.json(
          { success: false, error: 'เวลาเล่นต้องอยู่ระหว่าง 1-120 นาที' },
          { status: 400 }
        );
      }

      finalTimeLimit = timeLimit;
    } else if (enableCustomTime && defaultTimeMinutes) {
      // Use default time if game supports custom time but none provided
      finalTimeLimit = defaultTimeMinutes;
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
      gameId: gameId, // Store selected game ID
      gameType: gameData.name || 'Unknown Game', // Store game name for display
      hostId: playerId,
      status: 'waiting',
      maxPlayers: maxPlayers,
      currentPlayers: 1,
      ...(finalTimeLimit !== undefined && { timeLimit: finalTimeLimit }), // Add timeLimit only if defined
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
