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
  DocumentReference,
  runTransaction,
  writeBatch,
} from 'firebase/firestore';
import { db } from './config';
import type { ItoGameState, ItoPlayerAnswer, ItoQuestion, ItoReadyStatus } from '@/types/ito';

/**
 * Helper: ดึง timeLimit จาก room (หน่วย: นาที)
 * ถ้าไม่มีใน room จะใช้ค่า default 10 นาที
 */
async function getTimeLimitFromRoom(roomId: string): Promise<number> {
  try {
    const roomRef = doc(db, 'rooms', roomId);
    const roomSnap = await getDoc(roomRef);

    if (!roomSnap.exists()) {
      console.warn('⚠️ Room not found, using default time limit (10 minutes)');
      return 10;
    }

    const roomData = roomSnap.data();
    const timeLimit = roomData.timeLimit;

    if (timeLimit && typeof timeLimit === 'number' && timeLimit > 0) {
      console.log(`⏱️ Using room timeLimit: ${timeLimit} minutes`);
      return timeLimit;
    }

    console.log('⏱️ No timeLimit in room, using default (10 minutes)');
    return 10;
  } catch (error) {
    console.error('❌ Error getting timeLimit from room:', error);
    return 10; // fallback to default
  }
}

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
 * แบบกระจายเลขให้เท่าๆ กัน (ไม่ให้คนเดียวได้เลขใกล้ๆ กัน)
 * @param playerCount จำนวนผู้เล่น
 * @param numbersPerPlayer จำนวนเลขต่อคน (1, 2, หรือ 3)
 * @returns array ของเลขที่ไม่ซ้ำกัน (จำนวน = playerCount * numbersPerPlayer)
 */
export function generateUniqueNumbers(playerCount: number, numbersPerPlayer: number = 1): number[] {
  const totalNumbers = playerCount * numbersPerPlayer;

  // ตรวจสอบว่าเกินขอบเขตหรือไม่
  if (totalNumbers > 100) {
    throw new Error(`ต้องการ ${totalNumbers} เลข แต่มีแค่ 1-100 (100 เลข)`);
  }

  // สุ่มเลขที่ไม่ซ้ำกัน
  const numbers: number[] = [];

  while (numbers.length < totalNumbers) {
    const randomNum = Math.floor(Math.random() * 100) + 1; // 1-100

    // ถ้าเลขนี้ยังไม่มีใน array ให้เพิ่มเข้าไป
    if (!numbers.includes(randomNum)) {
      numbers.push(randomNum);
    }
  }

  // สุ่มเรียงเลขใหม่อีกครั้งก่อนแจก (Fisher-Yates shuffle)
  const shuffledNumbers = [...numbers];
  for (let i = shuffledNumbers.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffledNumbers[i], shuffledNumbers[j]] = [shuffledNumbers[j], shuffledNumbers[i]];
  }

  // Debug: แสดงการแจกเลข
  const distribution = Array.from({ length: playerCount }, (_, playerIndex) => {
    const playerNumbers = [];
    for (let round = 0; round < numbersPerPlayer; round++) {
      const index = round * playerCount + playerIndex;
      playerNumbers.push(shuffledNumbers[index]);
    }
    return {
      player: playerIndex + 1,
      numbers: playerNumbers.sort((a, b) => a - b),
    };
  });

  console.log('🎲 Number Distribution:', {
    playerCount,
    numbersPerPlayer,
    totalNumbers,
    generatedNumbers: numbers.sort((a, b) => a - b),
    shuffledNumbers,
    distribution,
  });

  return shuffledNumbers;
}

/**
 * เริ่ม Level ใหม่ (สุ่มโจทย์ใหม่ + เลขใหม่)
 */
export async function startNextLevel(
  sessionId: string,
  roomId: string,
  playerIds: string[],
  playerNames: { [playerId: string]: string },
  currentLevel: number,
  currentHearts: number
): Promise<boolean> {
  console.log('🚀 [startNextLevel] CALLED with:', {
    sessionId,
    roomId,
    playerIds,
    currentLevel,
    currentHearts,
  });

  try {
    // 1. สุ่มโจทย์ใหม่ (นอก transaction)
    const question = await getRandomQuestion();
    if (!question) {
      throw new Error('ไม่สามารถสุ่มโจทย์ได้');
    }

    // 2. ดึง timeLimit จาก room
    const timeLimitMinutes = await getTimeLimitFromRoom(roomId);

    // 3. คำนวณจำนวนเลขต่อคน (level 1=1, 2=2, 3=3)
    const numbersPerPlayer = currentLevel;
    const numbers = generateUniqueNumbers(playerIds.length, numbersPerPlayer);
    const totalNumbers = playerIds.length * numbersPerPlayer;
    const phaseEndTime = new Date(Date.now() + timeLimitMinutes * 60 * 1000);

    // 4. ใช้ Batch Write เพื่อป้องกัน race condition
    const batch = writeBatch(db);
    const sessionRef = doc(db, 'game_sessions', sessionId);
    const playerAnswersRef = collection(db, `game_sessions/${sessionId}/player_answers`);

    // ลบ player_answers เก่าทั้งหมด
    const oldAnswersSnap = await getDocs(playerAnswersRef);
    oldAnswersSnap.docs.forEach((docSnap) => {
      batch.delete(docSnap.ref);
    });
    console.log(`🗑️ Deleting ${oldAnswersSnap.docs.length} old player_answers`);

    // ลบ votes เก่า
    const votesRef = collection(db, `game_sessions/${sessionId}/votes`);
    const votesSnap = await getDocs(votesRef);
    votesSnap.docs.forEach((docSnap) => {
      batch.delete(docSnap.ref);
    });

    // ลบ ready_status เก่า
    const readyRef = collection(db, `game_sessions/${sessionId}/ready_status`);
    const readySnap = await getDocs(readyRef);
    readySnap.docs.forEach((docSnap) => {
      batch.delete(docSnap.ref);
    });

    // อัปเดต Game State
    batch.update(sessionRef, {
      currentLevel: currentLevel,
      hearts: currentHearts,
      currentRound: 1,
      totalRounds: totalNumbers,
      questionId: question.id,
      questionText: question.questionsTH,
      phase: 'voting',
      phaseEndTime: Timestamp.fromDate(phaseEndTime),
      revealedNumbers: [],
      lastRevealResult: null, // Clear lastRevealResult เมื่อเริ่ม level ใหม่
      updatedAt: serverTimestamp(),
    });

    // สร้าง Player Answers ใหม่
    const playerAnswers: ItoPlayerAnswer[] = [];
    let numberIndex = 0;

    for (const playerId of playerIds) {
      for (let answerIdx = 0; answerIdx < numbersPerPlayer; answerIdx++) {
        const playerAnswer: ItoPlayerAnswer = {
          playerId: playerId,
          playerName: playerNames[playerId] || 'Unknown',
          number: numbers[numberIndex],
          answer: '',
          isRevealed: false,
          answerIndex: answerIdx,
        };
        playerAnswers.push(playerAnswer);

        const docId = `${playerAnswer.playerId}_${playerAnswer.answerIndex}`;
        const docRef = doc(playerAnswersRef, docId);
        batch.set(docRef, {
          ...playerAnswer,
          submittedAt: null,
        });

        console.log(`  📝 Preparing: ${docId} → number: ${playerAnswer.number}`);
        numberIndex++;
      }
    }

    // Commit batch (atomic operation)
    await batch.commit();
    console.log(`✅ Batch committed: ${playerAnswers.length} player_answers created`);

    // Validation: ตรวจสอบว่าเลขซ้ำหรือไม่
    const validation = await validateUniqueNumbers(sessionId);
    if (!validation.isValid) {
      console.error('❌❌❌ CRITICAL: Duplicate numbers in startNextLevel!', validation);
      await cleanupPlayerAnswers(sessionId);
      throw new Error('Duplicate numbers detected - cleaned up and aborting');
    }

    console.log(`✅ Started Level ${currentLevel} successfully:`, {
      sessionId,
      question: question.questionsTH,
      numbersPerPlayer,
      totalNumbers,
      validation,
    });

    return true;
  } catch (error) {
    console.error('❌ Error starting next level:', error);
    return false;
  }
}

/**
 * สร้าง Game State เริ่มต้นสำหรับ ITO
 * เริ่มที่ Level 1 (คนละ 1 เลข)
 */
export async function initializeItoGame(
  sessionId: string,
  roomId: string,
  playerIds: string[],
  playerNames: { [playerId: string]: string }
): Promise<{ gameState: ItoGameState; playerAnswers: ItoPlayerAnswer[] } | null> {
  try {
    console.log('🎮 [initializeItoGame] Starting initialization:', {
      sessionId,
      roomId,
      playerCount: playerIds.length,
      timestamp: new Date().toISOString(),
    });

    // 1. สุ่มเลือกโจทย์ (ทำนอก transaction)
    const question = await getRandomQuestion();
    if (!question) {
      throw new Error('ไม่สามารถสุ่มโจทย์ได้');
    }

    // 2. ดึง timeLimit จาก room
    const timeLimitMinutes = await getTimeLimitFromRoom(roomId);

    // 3. สุ่มเลขให้ผู้เล่น (Level 1 = คนละ 1 เลข)
    const numbersPerPlayer = 1;
    const numbers = generateUniqueNumbers(playerIds.length, numbersPerPlayer);
    const phaseEndTime = new Date(Date.now() + timeLimitMinutes * 60 * 1000);
    const totalNumbers = playerIds.length * numbersPerPlayer;

    // 4. ใช้ Transaction เพื่อป้องกัน race condition
    const result = await runTransaction(db, async (transaction) => {
      const sessionRef = doc(db, 'game_sessions', sessionId);
      const playerAnswersRef = collection(db, `game_sessions/${sessionId}/player_answers`);

      // อ่านเพื่อเช็คว่ามี player_answers อยู่แล้วหรือไม่
      const existingAnswersSnapshot = await getDocs(playerAnswersRef);

      if (!existingAnswersSnapshot.empty) {
        console.warn('⚠️ [initializeItoGame] Player answers already exist, aborting transaction:', {
          sessionId,
          existingCount: existingAnswersSnapshot.docs.length,
        });
        return null; // Abort - มี player answers อยู่แล้ว
      }

      // สร้าง Game State
      const gameState: ItoGameState = {
        id: sessionId,
        roomId: roomId,
        gameId: 'BWLxJkh45e6RiALRBmcl',
        currentLevel: 1,
        totalLevels: 3,
        hearts: 3,
        currentRound: 1,
        totalRounds: totalNumbers,
        questionId: question.id,
        questionText: question.questionsTH,
        phase: 'voting',
        phaseEndTime: phaseEndTime,
        revealedNumbers: [],
        status: 'playing',
        startedAt: new Date(),
        updatedAt: new Date(),
      };

      // สร้าง Player Answers
      const playerAnswers: ItoPlayerAnswer[] = [];
      let numberIndex = 0;

      for (const playerId of playerIds) {
        for (let answerIdx = 0; answerIdx < numbersPerPlayer; answerIdx++) {
          playerAnswers.push({
            playerId: playerId,
            playerName: playerNames[playerId] || 'Unknown',
            number: numbers[numberIndex],
            answer: '',
            isRevealed: false,
            answerIndex: answerIdx,
          });
          numberIndex++;
        }
      }

      // อัปเดต game state
      transaction.update(sessionRef, {
        ...gameState,
        startedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        phaseEndTime: Timestamp.fromDate(phaseEndTime),
      });

      // สร้าง player answers ทั้งหมด
      console.log('📝 [initializeItoGame] Creating player answers in transaction:', {
        totalAnswers: playerAnswers.length,
        numbers,
      });

      for (const playerAnswer of playerAnswers) {
        const docId = `${playerAnswer.playerId}_${playerAnswer.answerIndex}`;
        const answerDocRef = doc(playerAnswersRef, docId);
        transaction.set(answerDocRef, {
          ...playerAnswer,
          submittedAt: null,
        });
        console.log(`  ✅ Preparing: ${docId} → number: ${playerAnswer.number}`);
      }

      return { gameState, playerAnswers };
    });

    if (!result) {
      console.warn('⚠️ [initializeItoGame] Transaction aborted - game already initialized');
      return null;
    }

    console.log('✅ ITO Game initialized successfully:', {
      sessionId,
      question: question.questionsTH,
      playerCount: playerIds.length,
    });

    // Validation: ตรวจสอบว่าเลขซ้ำหรือไม่หลังบันทึกเสร็จ
    const validation = await validateUniqueNumbers(sessionId);
    if (!validation.isValid) {
      console.error('❌❌❌ CRITICAL: Duplicate numbers detected after initialization!', validation);
      // ลบข้อมูลที่สร้างแล้วเริ่มใหม่
      await cleanupPlayerAnswers(sessionId);
      throw new Error('Duplicate numbers detected - cleaned up and aborting');
    }

    console.log('✅ Validation passed: All numbers are unique', validation);

    return result;
  } catch (error) {
    console.error('❌ Error initializing ITO game:', error);
    return null;
  }
}

/**
 * Validation: ตรวจสอบว่ามีเลขซ้ำใน player_answers หรือไม่
 */
async function validateUniqueNumbers(sessionId: string): Promise<{
  isValid: boolean;
  totalAnswers: number;
  uniqueNumbers: number;
  duplicates: number[];
  details: Array<{ docId: string; playerId: string; number: number }>;
}> {
  const playerAnswersRef = collection(db, `game_sessions/${sessionId}/player_answers`);
  const snapshot = await getDocs(playerAnswersRef);

  const numberCounts: { [num: number]: number } = {};
  const details: Array<{ docId: string; playerId: string; number: number }> = [];

  snapshot.docs.forEach((doc) => {
    const data = doc.data();
    const num = data.number;
    numberCounts[num] = (numberCounts[num] || 0) + 1;
    details.push({
      docId: doc.id,
      playerId: data.playerId,
      number: num,
    });
  });

  const duplicates = Object.entries(numberCounts)
    .filter(([_, count]) => count > 1)
    .map(([num, _]) => parseInt(num));

  return {
    isValid: duplicates.length === 0,
    totalAnswers: snapshot.docs.length,
    uniqueNumbers: Object.keys(numberCounts).length,
    duplicates,
    details,
  };
}

/**
 * ลบ player_answers ทั้งหมดในกรณีที่มีข้อผิดพลาด
 */
async function cleanupPlayerAnswers(sessionId: string): Promise<void> {
  const playerAnswersRef = collection(db, `game_sessions/${sessionId}/player_answers`);
  const snapshot = await getDocs(playerAnswersRef);

  const batch = writeBatch(db);
  snapshot.docs.forEach((doc) => {
    batch.delete(doc.ref);
  });

  await batch.commit();
  console.log(`🗑️ Cleaned up ${snapshot.docs.length} player_answers documents`);
}

/**
 * ส่งคำตอบของผู้เล่น (อัปเดตเฉพาะ document ที่ระบุ answerIndex)
 */
export async function submitPlayerAnswer(
  sessionId: string,
  playerId: string,
  answer: string,
  answerIndex: number
): Promise<boolean> {
  try {
    // อัปเดตเฉพาะ document ที่มี answerIndex ตรงกัน
    const docId = `${playerId}_${answerIndex}`;
    const answerRef = doc(db, `game_sessions/${sessionId}/player_answers`, docId);

    await updateDoc(answerRef, {
      answer: answer,
      submittedAt: serverTimestamp(),
    });

    console.log('✅ Player answer submitted:', {
      sessionId,
      playerId,
      answerIndex,
      answer,
    });
    return true;
  } catch (error) {
    console.error('❌ Error submitting answer:', error);
    return false;
  }
}

/**
 * ยกเลิกการส่งคำตอบ (เพื่อแก้ไข)
 */
export async function unsendPlayerAnswer(
  sessionId: string,
  playerId: string,
  answerIndex: number
): Promise<boolean> {
  try {
    const docId = `${playerId}_${answerIndex}`;
    const answerRef = doc(db, `game_sessions/${sessionId}/player_answers`, docId);

    await updateDoc(answerRef, {
      submittedAt: null,
    });

    console.log('✅ Player answer unsent (ready for edit):', {
      sessionId,
      playerId,
      answerIndex,
    });
    return true;
  } catch (error) {
    console.error('❌ Error unsending answer:', error);
    return false;
  }
}

/**
 * ตรวจสอบว่าทุกคนส่งคำตอบแล้วหรือยัง
 */
export async function checkAllAnswersSubmitted(sessionId: string): Promise<boolean> {
  try {
    // ดึง game state เพื่อรู้ว่าควรมีกี่ documents
    const sessionRef = doc(db, 'game_sessions', sessionId);
    const sessionSnap = await getDoc(sessionRef);

    if (!sessionSnap.exists()) {
      console.log('❌ [checkAllAnswersSubmitted] Session not found');
      return false;
    }

    const gameState = sessionSnap.data();
    const expectedDocs = gameState.totalRounds; // จำนวน documents ที่ควรมี

    const answersRef = collection(db, `game_sessions/${sessionId}/player_answers`);
    const snapshot = await getDocs(answersRef);

    console.log('🔍 [checkAllAnswersSubmitted]', {
      sessionId,
      totalDocs: snapshot.docs.length,
      expectedDocs,
      isEmpty: snapshot.empty,
    });

    // ถ้าไม่มี answers เลย return false
    if (snapshot.empty || snapshot.docs.length === 0) {
      console.log('❌ [checkAllAnswersSubmitted] No answers found, returning false');
      return false;
    }

    // ตรวจสอบว่ามีครบจำนวนหรือยัง
    if (snapshot.docs.length < expectedDocs) {
      console.log(`⚠️ [checkAllAnswersSubmitted] Not all documents created yet (${snapshot.docs.length}/${expectedDocs})`);
      return false;
    }

    const details: Array<{
      docId: string;
      playerId: string;
      answerIndex: number;
      hasAnswer: boolean;
      answerLength: number;
      hasSubmittedAt: boolean;
      isSubmitted: boolean;
    }> = [];
    const allSubmitted = snapshot.docs.every((doc) => {
      const data = doc.data();
      const hasAnswer = !!data.answer && data.answer.trim() !== '';
      const hasSubmittedAt = data.submittedAt !== null;
      const isSubmitted = hasSubmittedAt && hasAnswer;

      details.push({
        docId: doc.id,
        playerId: data.playerId,
        answerIndex: data.answerIndex,
        hasAnswer,
        answerLength: data.answer?.length || 0,
        hasSubmittedAt,
        isSubmitted,
      });

      return isSubmitted;
    });

    console.log('📋 [checkAllAnswersSubmitted] Details:', details);
    console.log(allSubmitted ? '✅ [checkAllAnswersSubmitted] All submitted = TRUE' : '⚠️ [checkAllAnswersSubmitted] All submitted = FALSE');

    return allSubmitted;
  } catch (error) {
    console.error('❌ Error checking answers:', error);
    return false;
  }
}

/**
 * เปลี่ยน Phase เป็น Voting
 */
export async function startVotingPhase(sessionId: string, roomId: string): Promise<boolean> {
  try {
    const sessionRef = doc(db, 'game_sessions', sessionId);

    // ดึง timeLimit จาก room
    const timeLimitMinutes = await getTimeLimitFromRoom(roomId);
    const phaseEndTime = new Date(Date.now() + timeLimitMinutes * 60 * 1000);

    await updateDoc(sessionRef, {
      phase: 'voting',
      phaseEndTime: Timestamp.fromDate(phaseEndTime),
      lastRevealResult: null, // Clear lastRevealResult เมื่อเข้า voting phase ใหม่
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
  votedForPlayerId: string,
  votedForAnswerIndex: number
): Promise<boolean> {
  try {
    const voteRef = doc(db, `game_sessions/${sessionId}/votes`, playerId);
    await setDoc(voteRef, {
      playerId: playerId,
      votedForPlayerId: votedForPlayerId,
      votedForAnswerIndex: votedForAnswerIndex,
      votedAt: serverTimestamp(),
    });

    console.log('✅ Vote submitted:', {
      sessionId,
      playerId,
      votedFor: `${votedForPlayerId}_${votedForAnswerIndex}`
    });
    return true;
  } catch (error) {
    console.error('❌ Error submitting vote:', error);
    return false;
  }
}

/**
 * สุ่มเลือกคำตอบที่ยังไม่ถูก reveal (ใช้เมื่อไม่มีใคร vote)
 * @returns answerId ในรูปแบบ { playerId, answerIndex } หรือ null ถ้าไม่มี
 */
export async function getRandomUnrevealedAnswer(sessionId: string): Promise<{ playerId: string; answerIndex: number } | null> {
  try {
    const answersRef = collection(db, `game_sessions/${sessionId}/player_answers`);
    const q = query(answersRef, where('isRevealed', '==', false));
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      console.log('⚠️ No unrevealed answers found');
      return null;
    }

    // สุ่มเลือก 1 ตัวจากที่ยังไม่ถูก reveal
    const unrevealedAnswers = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        playerId: data.playerId,
        answerIndex: data.answerIndex
      };
    });

    const randomIndex = Math.floor(Math.random() * unrevealedAnswers.length);
    const selected = unrevealedAnswers[randomIndex];

    console.log('🎲 Randomly selected unrevealed answer:', selected);
    return selected;
  } catch (error) {
    console.error('❌ Error getting random unrevealed answer:', error);
    return null;
  }
}

/**
 * นับคะแนนโหวตและหาผู้ที่ได้รับโหวตสูงสุด
 * @returns answerId ในรูปแบบ "playerId_answerIndex"
 */
export async function countVotes(sessionId: string): Promise<{ playerId: string; answerIndex: number } | null> {
  try {
    const votesRef = collection(db, `game_sessions/${sessionId}/votes`);
    const snapshot = await getDocs(votesRef);

    if (snapshot.empty) {
      return null;
    }

    // นับคะแนนโดยใช้ playerId + answerIndex
    const voteCount: { [answerId: string]: number } = {};
    // Debug: แสดงทุก votes
    console.log('🔍 DEBUG countVotes - All votes:');
    snapshot.docs.forEach((doc) => {
      const data = doc.data();
      console.log('  Vote:', {
        playerId: data.playerId,
        votedForPlayerId: data.votedForPlayerId,
        votedForAnswerIndex: data.votedForAnswerIndex,
        answerId: `${data.votedForPlayerId}_${data.votedForAnswerIndex}`
      });
    });

    snapshot.docs.forEach((doc) => {
      const data = doc.data();
      const answerId = `${data.votedForPlayerId}_${data.votedForAnswerIndex}`;
      voteCount[answerId] = (voteCount[answerId] || 0) + 1;
    });

    console.log('🔍 DEBUG countVotes - Vote count:', voteCount);

    // หาคะแนนสูงสุด
    let maxVotes = 0;
    const winners: string[] = [];

    Object.entries(voteCount).forEach(([answerId, count]) => {
      if (count > maxVotes) {
        maxVotes = count;
        winners.length = 0;
        winners.push(answerId);
      } else if (count === maxVotes) {
        winners.push(answerId);
      }
    });

    console.log('🔍 DEBUG countVotes - Winners:', { maxVotes, winners });

    // ถ้าเสมอ random
    const selectedAnswerId = winners.length > 1
      ? winners[Math.floor(Math.random() * winners.length)]
      : winners[0];

    console.log('🔍 DEBUG countVotes - Selected:', selectedAnswerId);

    if (!selectedAnswerId) return null;

    // แยก answerId กลับเป็น playerId และ answerIndex
    const [playerId, answerIndexStr] = selectedAnswerId.split('_');
    const result = {
      playerId,
      answerIndex: parseInt(answerIndexStr, 10)
    };

    console.log('✅ countVotes result:', {
      selectedAnswerId,
      playerId,
      answerIndexStr,
      answerIndex: result.answerIndex,
      answerIndexType: typeof result.answerIndex,
    });

    return result;
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
  selectedPlayerId: string,
  selectedAnswerIndex: number
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

    // 2. ดึงเลขทั้งหมด (เพื่อหา selectedAnswer และ unrevealed numbers)
    const answersRef = collection(db, `game_sessions/${sessionId}/player_answers`);
    const answersSnap = await getDocs(answersRef);

    // 3. หา player answer ที่ถูกโหวต (ใช้ field playerId + answerIndex เทียบ)
    let selectedAnswer: ItoPlayerAnswer | null = null;
    let answerDocRef: DocumentReference | null = null;

    console.log('🔍 Searching for answer:', {
      selectedPlayerId,
      selectedAnswerIndex,
      selectedAnswerIndexType: typeof selectedAnswerIndex,
    });

    // Debug: แสดงทุก answers ที่มี
    const allAnswersDebug = answersSnap.docs.map((docSnap) => {
      const data = docSnap.data() as ItoPlayerAnswer;
      return {
        docId: docSnap.id,
        playerId: data.playerId,
        answerIndex: data.answerIndex,
        answerIndexType: typeof data.answerIndex,
        isRevealed: data.isRevealed,
        answer: data.answer,
      };
    });
    console.log('🔍 All answers in DB:', allAnswersDebug);

    answersSnap.docs.forEach((docSnap) => {
      const data = docSnap.data() as ItoPlayerAnswer;
      // หาตัวที่ตรงกับ selectedPlayerId + answerIndex
      // ไม่ต้องเช็ค !isRevealed เพราะอาจมี race condition หรือ double-call
      if (data.playerId === selectedPlayerId &&
          data.answerIndex === selectedAnswerIndex) {
        selectedAnswer = data;
        answerDocRef = docSnap.ref;
      }
    });

    if (!selectedAnswer || !answerDocRef) {
      console.error('❌ Player answer not found for:', `${selectedPlayerId}_${selectedAnswerIndex}`);
      console.error('❌ Search criteria:', {
        selectedPlayerId,
        selectedAnswerIndex,
        selectedAnswerIndexType: typeof selectedAnswerIndex,
      });
      throw new Error('Player answer not found');
    }

    // TypeScript type narrowing
    const foundAnswer: ItoPlayerAnswer = selectedAnswer;

    if (!answerDocRef) {
      console.error('❌ Answer document reference not found');
      throw new Error('Answer document reference not found');
    }

    const foundDocRef: DocumentReference = answerDocRef;

    console.log('✅ Found answer:', {
      docId: foundDocRef.id,
      playerId: foundAnswer.playerId,
      answerIndex: foundAnswer.answerIndex,
      number: foundAnswer.number,
      isRevealed: foundAnswer.isRevealed,
    });

    const selectedNumber = foundAnswer.number;

    // ตรวจสอบว่าเลขนี้ถูก reveal ไปแล้วหรือยัง (ป้องกัน double-call)
    if (foundAnswer.isRevealed) {
      console.log('⚠️ This answer was already revealed, skipping...');
      // Return ผลลัพธ์จาก gameState ปัจจุบัน
      return {
        success: true,
        number: selectedNumber,
        isCorrect: true, // ไม่สามารถคำนวณได้ เพราะข้อมูลเปลี่ยนไปแล้ว
        heartsLost: 0,
        newHearts: gameState.hearts,
      };
    }

    const unrevealedNumbers: number[] = [];
    const allPlayerAnswers: { playerId: string; number: number; isRevealed: boolean }[] = [];

    answersSnap.docs.forEach((doc) => {
      const data = doc.data() as ItoPlayerAnswer;
      allPlayerAnswers.push({
        playerId: data.playerId, // แก้ไข: ใช้ field playerId ไม่ใช่ doc.id
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

    // 7. หาเลขทั้งหมดที่ต้องเปิด (เลข ≤ selectedNumber)
    const numbersToReveal = unrevealedNumbers.filter((num) => num <= selectedNumber);

    console.log('🔍 Numbers to reveal:', {
      selectedNumber,
      unrevealedNumbers,
      numbersToReveal,
      count: numbersToReveal.length,
    });

    // 8. Mark ทุกเลขที่ต้องเปิดเป็น isRevealed = true + เซ็ต isCorrect
    const markRevealedPromises = answersSnap.docs
      .filter((doc) => {
        const data = doc.data() as ItoPlayerAnswer;
        return !data.isRevealed && numbersToReveal.includes(data.number);
      })
      .map((doc) => {
        const data = doc.data() as ItoPlayerAnswer;
        // ถูก = เลขที่เลือก (selectedNumber), ผิด = เลขอื่นๆ ที่โดนเปิดด้วย
        const isThisCorrect = data.number === selectedNumber;
        return updateDoc(doc.ref, {
          isRevealed: true,
          isCorrect: isThisCorrect
        });
      });

    await Promise.all(markRevealedPromises);
    console.log(`✅ Marked ${markRevealedPromises.length} answers as revealed`);

    // 9. อัปเดต game state
    const newRevealedNumbers = [...gameState.revealedNumbers, ...numbersToReveal].sort(
      (a, b) => a - b
    );
    // currentRound = จำนวนครั้งที่โหวต (ไม่ใช่จำนวนเลขที่เปิด)
    const newRound = gameState.currentRound + 1;

    // ตรวจสอบว่า Level นี้จบหรือยัง (เช็คจากจำนวนเลขที่เปิด ไม่ใช่ round)
    const allRevealedInLevel = newRevealedNumbers.length >= gameState.totalRounds;
    const onlyOneLeft = newRevealedNumbers.length === gameState.totalRounds - 1;
    const isLevelComplete = allRevealedInLevel || onlyOneLeft;

    // ตรวจสอบว่าเกมทั้งหมดจบหรือไม่
    // เปลี่ยนเป็น reveal เสมอ แล้วให้ frontend auto-transition
    const newPhase: 'reveal' | 'levelComplete' | 'finished' = 'reveal';
    let newStatus: 'playing' | 'won' | 'lost' = 'playing';

    if (newHearts === 0) {
      // หัวใจหมด = แพ้ทันที (แต่ยังแสดง reveal ก่อน)
      newStatus = 'lost';
    } else if (isLevelComplete) {
      // Level นี้จบแล้ว
      if (gameState.currentLevel >= gameState.totalLevels) {
        // จบ level สุดท้ายแล้ว
        newStatus = 'won';
      }
    }

    console.log('🔍 Debug - Game status:', {
      allRevealedInLevel,
      onlyOneLeft,
      isLevelComplete,
      currentLevel: gameState.currentLevel,
      totalLevels: gameState.totalLevels,
      newPhase,
      newStatus,
      newHearts,
    });

    // ถ้าเหลือเลขสุดท้าย 1 ตัว ให้เปิดเลขนั้นอัตโนมัติด้วย
    let finalRevealedNumbers = newRevealedNumbers;
    if (onlyOneLeft && newHearts > 0) {
      // หาเลขทั้งหมดที่ยังไม่ถูกเปิด (ไม่รวม numbersToReveal ที่เพิ่งเปิด)
      const remainingNumbers = unrevealedNumbers.filter((num) => !numbersToReveal.includes(num));

      console.log('🔍 Auto-reveal last number check:', {
        unrevealedNumbers,
        numbersToReveal,
        remainingNumbers,
        shouldAutoReveal: remainingNumbers.length === 1,
      });

      // ต้องเหลือพอดี 1 ตัว
      if (remainingNumbers.length === 1) {
        const lastNumber = remainingNumbers[0];
        finalRevealedNumbers = [...newRevealedNumbers, lastNumber].sort((a, b) => a - b);

        // Mark เลขสุดท้ายว่าเปิดแล้วด้วย
        const lastPlayerAnswer = answersSnap.docs.find(
          (doc) => doc.data().number === lastNumber
        );
        if (lastPlayerAnswer) {
          await updateDoc(lastPlayerAnswer.ref, { isRevealed: true });
          console.log('✅ Auto-revealed last number:', lastNumber);
        }
      }
    }

    // อัปเดต game state พร้อม lastRevealResult เพื่อให้ทุกเครื่องเห็น
    await updateDoc(sessionRef, {
      hearts: newHearts,
      currentRound: newRound,
      revealedNumbers: finalRevealedNumbers,
      phase: newPhase, // 'reveal', 'levelComplete', หรือ 'finished'
      status: newStatus,
      lastRevealResult: {
        number: selectedNumber,
        isCorrect,
        heartsLost,
        newHearts,
      },
      updatedAt: serverTimestamp(),
    });

    // 10. ลบ votes collection เพื่อเริ่มรอบใหม่
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
      allRevealedInLevel,
      newPhase,
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

/**
 * Mark player as ready (สำหรับ levelComplete phase)
 */
export async function markPlayerReady(
  sessionId: string,
  playerId: string,
  playerName: string
): Promise<boolean> {
  try {
    const readyRef = doc(db, `game_sessions/${sessionId}/ready_status`, playerId);
    await setDoc(readyRef, {
      playerId,
      playerName,
      readyAt: serverTimestamp(),
    });

    console.log('✅ Player marked as ready:', { sessionId, playerId });
    return true;
  } catch (error) {
    console.error('❌ Error marking player ready:', error);
    return false;
  }
}

/**
 * ตรวจสอบว่าทุกคนพร้อมหรือยัง
 */
export async function checkAllPlayersReady(sessionId: string): Promise<boolean> {
  try {
    // ดึงจำนวนผู้เล่นทั้งหมด
    const answersRef = collection(db, `game_sessions/${sessionId}/player_answers`);
    const answersSnap = await getDocs(answersRef);

    // นับ unique players
    const uniquePlayerIds = new Set<string>();
    answersSnap.docs.forEach((doc) => {
      const data = doc.data();
      uniquePlayerIds.add(data.playerId);
    });

    const totalPlayers = uniquePlayerIds.size;

    // ดึงจำนวนที่พร้อมแล้ว
    const readyRef = collection(db, `game_sessions/${sessionId}/ready_status`);
    const readySnap = await getDocs(readyRef);
    const readyCount = readySnap.size;

    console.log('🔍 Ready status check:', {
      totalPlayers,
      readyCount,
      allReady: readyCount === totalPlayers && totalPlayers > 0,
    });

    return readyCount === totalPlayers && totalPlayers > 0;
  } catch (error) {
    console.error('❌ Error checking ready status:', error);
    return false;
  }
}

/**
 * ลบ ready_status เมื่อเริ่ม level ใหม่
 */
export async function clearReadyStatus(sessionId: string): Promise<boolean> {
  try {
    const readyRef = collection(db, `game_sessions/${sessionId}/ready_status`);
    const readySnap = await getDocs(readyRef);

    const deletePromises = readySnap.docs.map((docSnap) => deleteDoc(docSnap.ref));
    await Promise.all(deletePromises);

    console.log('✅ Ready status cleared:', sessionId);
    return true;
  } catch (error) {
    console.error('❌ Error clearing ready status:', error);
    return false;
  }
}
