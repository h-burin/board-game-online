/**
 * API Route: Reveal ITO Game Votes
 * POST /api/games/ito/[sessionId]/reveal
 */

import { NextRequest, NextResponse } from 'next/server';
import { countVotes, revealAndCheck, startVotingPhase } from '@/lib/firebase/ito';

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ sessionId: string }> }
) {
  try {
    const { sessionId } = await context.params;


    // 1. นับคะแนนโหวต
    const winner = await countVotes(sessionId);

    if (!winner) {
      return NextResponse.json(
        { success: false, error: 'ไม่พบผลโหวต' },
        { status: 400 }
      );
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
