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
    const winnerId = await countVotes(sessionId);

    if (!winnerId) {
      return NextResponse.json(
        { success: false, error: 'ไม่พบผลโหวต' },
        { status: 400 }
      );
    }

    console.log('✅ Vote winner:', winnerId);

    // 2. เปิดเผยผลและตรวจสอบความถูกต้อง
    const result = await revealAndCheck(sessionId, winnerId);

    if (!result) {
      return NextResponse.json(
        { success: false, error: 'ไม่สามารถเปิดเผยผลได้' },
        { status: 500 }
      );
    }

    console.log('✅ Reveal result:', result);

    // 3. ส่งผลกลับไป (ฝั่ง client จะจัดการเปลี่ยน phase เอง)
    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error('❌ Error revealing votes:', error);
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
