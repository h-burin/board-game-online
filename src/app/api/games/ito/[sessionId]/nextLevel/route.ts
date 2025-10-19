/**
 * API Route: Start Next Level in ITO Game
 * POST /api/games/ito/[sessionId]/nextLevel
 */

import { NextRequest, NextResponse } from 'next/server';
import { startNextLevel } from '@/lib/firebase/ito';
import { getDoc, doc, collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ sessionId: string }> }
) {
  try {
    const { sessionId } = await context.params;

    console.log('🎮 Starting next level for session:', sessionId);

    // 1. Get current game state
    const sessionRef = doc(db, 'game_sessions', sessionId);
    const sessionSnap = await getDoc(sessionRef);

    if (!sessionSnap.exists()) {
      return NextResponse.json(
        { success: false, error: 'Game not found' },
        { status: 404 }
      );
    }

    const gameState = sessionSnap.data();
    console.log('Current level:', gameState.currentLevel);
    console.log('Current hearts:', gameState.hearts);
    console.log('Current phase:', gameState.phase);

    // คำนวณ level ถัดไป
    const nextLevel = gameState.currentLevel + 1;

    // Guard: ตรวจสอบว่าเกินจำนวน level แล้วหรือไม่
    if (nextLevel > 3) {
      console.log('⚠️ All levels completed');
      return NextResponse.json(
        { success: false, error: 'All levels completed' },
        { status: 400 }
      );
    }

    // Guard: ตรวจสอบว่า phase ถูกต้องหรือไม่ (ต้องเป็น levelComplete)
    if (gameState.phase !== 'levelComplete') {
      console.log('⚠️ Cannot start next level, current phase:', gameState.phase);
      return NextResponse.json(
        { success: false, error: `Cannot start next level from phase: ${gameState.phase}` },
        { status: 400 }
      );
    }

    // 2. Get player list from existing answers
    const answersRef = collection(db, `game_sessions/${sessionId}/player_answers`);
    const answersSnap = await getDocs(answersRef);

    const playerIds: string[] = [];
    const playerNames: { [key: string]: string } = {};

    answersSnap.docs.forEach((doc) => {
      const data = doc.data();
      if (!playerIds.includes(data.playerId)) {
        playerIds.push(data.playerId);
        playerNames[data.playerId] = data.playerName;
      }
    });

    console.log('Players:', playerIds);

    // 3. Start next level

    const success = await startNextLevel(
      sessionId,
      playerIds,
      playerNames,
      nextLevel,
      gameState.hearts
    );

    if (success) {
      console.log('✅ Successfully started level', nextLevel);
      return NextResponse.json({
        success: true,
        level: nextLevel
      });
    } else {
      return NextResponse.json(
        { success: false, error: 'Failed to start next level' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('❌ Error starting next level:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'เกิดข้อผิดพลาด',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
