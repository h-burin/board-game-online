/**
 * API Route: Reveal ITO Game Votes
 * POST /api/games/ito/[sessionId]/reveal
 *
 * Handles vote counting and number reveal with auto-reveal logic
 */

import { NextRequest, NextResponse } from 'next/server';
import { countVotes, revealAndCheck, getRandomUnrevealedAnswer } from '@/lib/firebase/ito';
import { getDoc, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ sessionId: string }> }
) {
  try {
    const { sessionId } = await context.params;

    // Guard: Validate game exists and phase is 'voting'
    const sessionRef = doc(db, 'game_sessions', sessionId);
    const sessionSnap = await getDoc(sessionRef);

    if (!sessionSnap.exists()) {
      return NextResponse.json(
        { success: false, error: 'Game not found' },
        { status: 404 }
      );
    }

    const gameState = sessionSnap.data();

    if (gameState.phase !== 'voting') {
      return NextResponse.json(
        { success: false, error: `Cannot reveal from phase: ${gameState.phase}` },
        { status: 400 }
      );
    }

    // Count votes to determine which number to reveal
    let winner = await countVotes(sessionId);

    // Fallback: If no votes, randomly select an unrevealed answer
    if (!winner) {
      winner = await getRandomUnrevealedAnswer(sessionId);

      if (!winner) {
        return NextResponse.json(
          { success: false, error: 'ไม่มีคำตอบที่ยังไม่ถูก reveal' },
          { status: 400 }
        );
      }
    }

    // Reveal and check correctness (includes auto-reveal logic)
    const result = await revealAndCheck(sessionId, winner.playerId, winner.answerIndex);

    if (!result) {
      return NextResponse.json(
        { success: false, error: 'ไม่สามารถเปิดเผยผลได้' },
        { status: 500 }
      );
    }

    return NextResponse.json(result);
  } catch (error) {
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
