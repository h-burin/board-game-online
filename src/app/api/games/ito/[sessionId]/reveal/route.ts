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

    console.log('🎮 Revealing votes for session:', sessionId);

    // 1. นับคะแนนโหวต
    const winner = await countVotes(sessionId);

    if (!winner) {
      console.error('❌ No votes found');
      return NextResponse.json(
        { success: false, error: 'ไม่พบผลโหวต' },
        { status: 400 }
      );
    }

    console.log('✅ Vote winner:', `${winner.playerId}_${winner.answerIndex}`);

    // 2. เปิดเผยผลและตรวจสอบความถูกต้อง
    console.log('🔍 Calling revealAndCheck with:', {
      sessionId,
      playerId: winner.playerId,
      answerIndex: winner.answerIndex,
    });

    const result = await revealAndCheck(sessionId, winner.playerId, winner.answerIndex);

    console.log('🔍 revealAndCheck result:', result);

    if (!result) {
      console.error('❌ revealAndCheck returned null');
      return NextResponse.json(
        { success: false, error: 'ไม่สามารถเปิดเผยผลได้' },
        { status: 500 }
      );
    }

    console.log('✅ Reveal result:', result);

    // 3. ส่งผลกลับไป (ฝั่ง client จะจัดการเปลี่ยน phase เอง)
    return NextResponse.json(result);
  } catch (error) {
    console.error('❌ Error revealing votes:', error);
    console.error('❌ Error stack:', error instanceof Error ? error.stack : 'No stack');
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
