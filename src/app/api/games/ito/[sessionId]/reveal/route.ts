/**
 * API Route: Reveal ITO Game Votes
 * POST /api/games/ito/[sessionId]/reveal
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

    // GUARD: ตรวจสอบว่า phase เป็น 'voting' ก่อนเปิดเผยผล
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
      console.warn('⚠️ Reveal called but phase is not voting:', {
        currentPhase: gameState.phase,
        sessionId
      });
      return NextResponse.json(
        { success: false, error: `Cannot reveal from phase: ${gameState.phase}` },
        { status: 400 }
      );
    }

    // 1. นับคะแนนโหวต
    let winner = await countVotes(sessionId);

    // 1.1 ถ้าไม่มีใคร vote เลย → สุ่มเลือก
    if (!winner) {
      console.log('⚠️ No votes found, randomly selecting an unrevealed answer...');
      winner = await getRandomUnrevealedAnswer(sessionId);

      if (!winner) {
        return NextResponse.json(
          { success: false, error: 'ไม่มีคำตอบที่ยังไม่ถูก reveal' },
          { status: 400 }
        );
      }
    }

    // 2. เปิดเผยผลและตรวจสอบความถูกต้อง
    const result = await revealAndCheck(sessionId, winner.playerId, winner.answerIndex);

    if (!result) {
      return NextResponse.json(
        { success: false, error: 'ไม่สามารถเปิดเผยผลได้' },
        { status: 500 }
      );
    }


    // 3. ส่งผลกลับไป (ฝั่ง client จะจัดการเปลี่ยน phase เอง)
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
