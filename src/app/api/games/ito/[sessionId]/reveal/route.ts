/**
 * API Route: Reveal ITO Game Votes
 * POST /api/games/ito/[sessionId]/reveal
 */

import { NextRequest, NextResponse } from 'next/server';
import { countVotes, revealAndCheck, getRandomUnrevealedAnswer } from '@/lib/firebase/ito';

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ sessionId: string }> }
) {
  try {
    const { sessionId } = await context.params;


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
