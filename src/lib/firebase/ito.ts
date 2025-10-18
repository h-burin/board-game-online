/**
 * ITO Game Firebase Functions
 * จัดการ game logic สำหรับเกม ITO (BWLxJkh45e6RiALRBmcl)
 */

import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import { db } from './config';
import type { ItoGameState, ItoPlayerAnswer, ItoQuestion } from '@/types/ito';

/**
 * สุ่มเลือกโจทย์จาก ito_questions
 */
export async function getRandomQuestion(): Promise<ItoQuestion | null> {
  try {
    const questionsRef = collection(db, 'ito_questions');
    const snapshot = await getDocs(questionsRef);

    if (snapshot.empty) {
      console.error('❌ No questions found in ito_questions collection');
      return null;
    }

    // Random เลือก 1 โจทย์
    const questions = snapshot.docs.map((doc) => ({
      id: doc.id,
      questionsTH: doc.data().questionsTH || 'ไม่มีโจทย์',
    }));

    const randomIndex = Math.floor(Math.random() * questions.length);
    return questions[randomIndex];
  } catch (error) {
    console.error('Error getting random question:', error);
    return null;
  }
}

/**
 * สุ่มเลขให้ผู้เล่น (1-100) แต่ละคนไม่ซ้ำกัน
 */
export function generateUniqueNumbers(playerCount: number): number[] {
  const numbers = new Set<number>();

  while (numbers.size < playerCount) {
    const randomNum = Math.floor(Math.random() * 100) + 1; // 1-100
    numbers.add(randomNum);
  }

  return Array.from(numbers);
}

/**
 * สร้าง Game State เริ่มต้นสำหรับ ITO
 */
export async function initializeItoGame(
  sessionId: string,
  roomId: string,
  playerIds: string[],
  playerNames: { [playerId: string]: string }
): Promise<{ gameState: ItoGameState; playerAnswers: ItoPlayerAnswer[] } | null> {
  try {
    // 1. สุ่มเลือกโจทย์
    const question = await getRandomQuestion();
    if (!question) {
      throw new Error('ไม่สามารถสุ่มโจทย์ได้');
    }

    // 2. สุ่มเลขให้ผู้เล่น
    const numbers = generateUniqueNumbers(playerIds.length);

    // 3. สร้าง Game State
    const phaseEndTime = new Date(Date.now() + 60 * 1000); // 1 นาที

    const gameState: ItoGameState = {
      id: sessionId,
      roomId: roomId,
      gameId: 'BWLxJkh45e6RiALRBmcl',
      hearts: 3,
      currentRound: 1,
      totalRounds: playerIds.length,
      questionId: question.id,
      questionText: question.questionsTH,
      phase: 'writing',
      phaseEndTime: phaseEndTime,
      revealedNumbers: [],
      status: 'playing',
      startedAt: new Date(),
      updatedAt: new Date(),
    };

    // 4. สร้าง Player Answers
    const playerAnswers: ItoPlayerAnswer[] = playerIds.map((playerId, index) => ({
      playerId: playerId,
      playerName: playerNames[playerId] || 'Unknown',
      number: numbers[index],
      answer: '',
      isRevealed: false,
    }));

    // 5. บันทึกลง Firestore
    const sessionRef = doc(db, 'game_sessions', sessionId);
    await updateDoc(sessionRef, {
      ...gameState,
      startedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      phaseEndTime: Timestamp.fromDate(phaseEndTime),
    });

    // 6. บันทึก Player Answers ลง subcollection
    const playerAnswersRef = collection(db, `game_sessions/${sessionId}/player_answers`);
    for (const playerAnswer of playerAnswers) {
      await setDoc(doc(playerAnswersRef, playerAnswer.playerId), {
        ...playerAnswer,
        submittedAt: null,
      });
    }

    console.log('✅ ITO Game initialized:', { sessionId, question: question.questionsTH });

    return { gameState, playerAnswers };
  } catch (error) {
    console.error('❌ Error initializing ITO game:', error);
    return null;
  }
}

/**
 * ส่งคำตอบของผู้เล่น
 */
export async function submitPlayerAnswer(
  sessionId: string,
  playerId: string,
  answer: string
): Promise<boolean> {
  try {
    const answerRef = doc(db, `game_sessions/${sessionId}/player_answers`, playerId);
    await updateDoc(answerRef, {
      answer: answer,
      submittedAt: serverTimestamp(),
    });

    console.log('✅ Player answer submitted:', { sessionId, playerId, answer });
    return true;
  } catch (error) {
    console.error('❌ Error submitting answer:', error);
    return false;
  }
}

/**
 * ตรวจสอบว่าทุกคนส่งคำตอบแล้วหรือยัง
 */
export async function checkAllAnswersSubmitted(sessionId: string): Promise<boolean> {
  try {
    const answersRef = collection(db, `game_sessions/${sessionId}/player_answers`);
    const snapshot = await getDocs(answersRef);

    const allSubmitted = snapshot.docs.every((doc) => {
      const data = doc.data();
      return data.submittedAt !== null && data.answer.trim() !== '';
    });

    return allSubmitted;
  } catch (error) {
    console.error('❌ Error checking answers:', error);
    return false;
  }
}

/**
 * เปลี่ยน Phase เป็น Voting
 */
export async function startVotingPhase(sessionId: string): Promise<boolean> {
  try {
    const sessionRef = doc(db, 'game_sessions', sessionId);
    const phaseEndTime = new Date(Date.now() + 4 * 60 * 1000); // 4 นาที

    await updateDoc(sessionRef, {
      phase: 'voting',
      phaseEndTime: Timestamp.fromDate(phaseEndTime),
      updatedAt: serverTimestamp(),
    });

    console.log('✅ Voting phase started:', sessionId);
    return true;
  } catch (error) {
    console.error('❌ Error starting voting phase:', error);
    return false;
  }
}

/**
 * บันทึกการโหวตของผู้เล่น
 */
export async function submitVote(
  sessionId: string,
  playerId: string,
  votedForPlayerId: string
): Promise<boolean> {
  try {
    const voteRef = doc(db, `game_sessions/${sessionId}/votes`, playerId);
    await setDoc(voteRef, {
      playerId: playerId,
      votedForPlayerId: votedForPlayerId,
      votedAt: serverTimestamp(),
    });

    console.log('✅ Vote submitted:', { sessionId, playerId, votedFor: votedForPlayerId });
    return true;
  } catch (error) {
    console.error('❌ Error submitting vote:', error);
    return false;
  }
}

/**
 * นับคะแนนโหวตและหาผู้ที่ได้รับโหวตสูงสุด
 */
export async function countVotes(sessionId: string): Promise<string | null> {
  try {
    const votesRef = collection(db, `game_sessions/${sessionId}/votes`);
    const snapshot = await getDocs(votesRef);

    if (snapshot.empty) {
      return null;
    }

    // นับคะแนน
    const voteCount: { [playerId: string]: number } = {};
    snapshot.docs.forEach((doc) => {
      const votedFor = doc.data().votedForPlayerId;
      voteCount[votedFor] = (voteCount[votedFor] || 0) + 1;
    });

    // หาคะแนนสูงสุด
    let maxVotes = 0;
    const winners: string[] = [];

    Object.entries(voteCount).forEach(([playerId, count]) => {
      if (count > maxVotes) {
        maxVotes = count;
        winners.length = 0;
        winners.push(playerId);
      } else if (count === maxVotes) {
        winners.push(playerId);
      }
    });

    // ถ้าเสมอ random
    if (winners.length > 1) {
      const randomIndex = Math.floor(Math.random() * winners.length);
      return winners[randomIndex];
    }

    return winners[0] || null;
  } catch (error) {
    console.error('❌ Error counting votes:', error);
    return null;
  }
}

/**
 * เปิดเผยผลและตรวจสอบความถูกต้อง
 */
export async function revealAndCheck(
  sessionId: string,
  selectedPlayerId: string
): Promise<{
  success: boolean;
  number: number;
  isCorrect: boolean;
  heartsLost: number;
  newHearts: number;
} | null> {
  try {
    // 1. ดึงข้อมูล game state และ player answers
    const sessionRef = doc(db, 'game_sessions', sessionId);
    const sessionSnap = await getDoc(sessionRef);

    if (!sessionSnap.exists()) {
      throw new Error('Game session not found');
    }

    const gameState = sessionSnap.data() as ItoGameState;

    // 2. ดึงข้อมูล player answer ที่ถูกเลือก
    const answerRef = doc(db, `game_sessions/${sessionId}/player_answers`, selectedPlayerId);
    const answerSnap = await getDoc(answerRef);

    if (!answerSnap.exists()) {
      throw new Error('Player answer not found');
    }

    const selectedAnswer = answerSnap.data() as ItoPlayerAnswer;
    const selectedNumber = selectedAnswer.number;

    // 3. ดึงเลขทั้งหมดที่ยังไม่ถูกเปิด (ก่อนที่จะอัปเดต)
    const answersRef = collection(db, `game_sessions/${sessionId}/player_answers`);
    const answersSnap = await getDocs(answersRef);

    const unrevealedNumbers: number[] = [];
    const allPlayerAnswers: { playerId: string; number: number; isRevealed: boolean }[] = [];

    answersSnap.docs.forEach((doc) => {
      const data = doc.data() as ItoPlayerAnswer;
      allPlayerAnswers.push({
        playerId: doc.id,
        number: data.number,
        isRevealed: data.isRevealed,
      });

      if (!data.isRevealed) {
        unrevealedNumbers.push(data.number);
      }
    });

    console.log('🔍 Debug - All player answers:', allPlayerAnswers);
    console.log('🔍 Debug - Unrevealed numbers (including selected):', unrevealedNumbers);
    console.log('🔍 Debug - Selected player ID:', selectedPlayerId);
    console.log('🔍 Debug - Selected number:', selectedNumber);

    // 4. หาเลขที่น้อยที่สุดจากที่ยังไม่เปิด
    // ตัวที่กำลังเลือกอยู่ (selectedNumber) ยังรวมอยู่ใน unrevealedNumbers
    // เพราะยังไม่ถูก mark ว่า isRevealed = true
    // ดังนั้นต้องตรวจสอบว่า selectedNumber เป็นตัวเล็กที่สุดหรือไม่
    const smallestNumber = Math.min(...unrevealedNumbers);
    console.log('🔍 Debug - Smallest unrevealed:', smallestNumber);

    // 5. ตรวจสอบว่าถูกหรือไม่
    // ถูก = เลือกตัวที่เล็กที่สุดใน unrevealed numbers
    const isCorrect = selectedNumber === smallestNumber;
    console.log('🔍 Debug - Is correct?', isCorrect);

    // 6. คำนวณหัวใจที่หาย
    let heartsLost = 0;
    if (!isCorrect) {
      // นับว่าข้ามไปกี่ตัว
      const skippedNumbers = unrevealedNumbers.filter((num) => num < selectedNumber);
      heartsLost = skippedNumbers.length;
    }

    const newHearts = Math.max(0, gameState.hearts - heartsLost);

    // 7. อัปเดต game state
    const newRevealedNumbers = [...gameState.revealedNumbers, selectedNumber].sort(
      (a, b) => a - b
    );
    const newRound = gameState.currentRound + 1;

    // ตรวจสอบว่าเกมจบหรือไม่
    // เกมจบถ้า:
    // 1. หัวใจหมด (แพ้)
    // 2. เปิดครบทุกตัวแล้ว (ชนะ ถ้ายังมีหัวใจเหลือ)
    // 3. เหลือเลขสุดท้าย 1 ตัว (ชนะอัตโนมัติ เพราะไม่ต้องเลือก)
    const allRevealed = newRevealedNumbers.length >= gameState.totalRounds;
    const onlyOneLeft = newRevealedNumbers.length === gameState.totalRounds - 1;
    const isGameFinished = allRevealed || newHearts === 0 || onlyOneLeft;

    // กำหนด status
    let newStatus: 'playing' | 'won' | 'lost' = 'playing';
    if (newHearts === 0) {
      newStatus = 'lost'; // หัวใจหมด = แพ้
    } else if (allRevealed || onlyOneLeft) {
      newStatus = 'won'; // เปิดครบ หรือเหลือแค่ 1 ตัว = ชนะ
    }

    console.log('🔍 Debug - Game status:', {
      allRevealed,
      onlyOneLeft,
      isGameFinished,
      newStatus,
      revealedCount: newRevealedNumbers.length,
      totalRounds: gameState.totalRounds,
    });

    // ถ้าเหลือเลขสุดท้าย 1 ตัว ให้เปิดเลขนั้นอัตโนมัติด้วย
    let finalRevealedNumbers = newRevealedNumbers;
    if (onlyOneLeft && newHearts > 0) {
      // หาเลขสุดท้ายที่ยังไม่ถูกเปิด
      const lastNumber = unrevealedNumbers.find((num) => num !== selectedNumber);
      if (lastNumber) {
        finalRevealedNumbers = [...newRevealedNumbers, lastNumber].sort((a, b) => a - b);

        // Mark เลขสุดท้ายว่าเปิดแล้วด้วย
        const lastPlayerAnswer = answersSnap.docs.find(
          (doc) => doc.data().number === lastNumber
        );
        if (lastPlayerAnswer) {
          await updateDoc(lastPlayerAnswer.ref, { isRevealed: true });
        }
      }
    }

    // เปลี่ยนเป็น reveal phase ก่อน
    await updateDoc(sessionRef, {
      hearts: newHearts,
      currentRound: newRound,
      revealedNumbers: finalRevealedNumbers,
      phase: 'reveal',
      status: newStatus,
      updatedAt: serverTimestamp(),
    });

    // 8. ทำเครื่องหมาย player answer ว่าเปิดแล้ว
    await updateDoc(answerRef, {
      isRevealed: true,
    });

    // 9. ลบ votes collection เพื่อเริ่มรอบใหม่
    const votesRef = collection(db, `game_sessions/${sessionId}/votes`);
    const votesSnap = await getDocs(votesRef);
    const deletePromises = votesSnap.docs.map((docSnap) => deleteDoc(docSnap.ref));
    await Promise.all(deletePromises);

    console.log('✅ Reveal and check completed:', {
      selectedNumber,
      smallestNumber,
      isCorrect,
      heartsLost,
      newHearts,
      allRevealed,
      newStatus,
      revealedCount: newRevealedNumbers.length,
      totalRounds: gameState.totalRounds,
    });

    return {
      success: true,
      number: selectedNumber,
      isCorrect,
      heartsLost,
      newHearts,
    };
  } catch (error) {
    console.error('❌ Error revealing and checking:', error);
    return null;
  }
}
