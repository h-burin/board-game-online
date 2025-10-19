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
import type { ItoGameState, ItoPlayerAnswer, ItoQuestion, ItoReadyStatus } from '@/types/ito';

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
 * @param playerCount จำนวนผู้เล่น
 * @param numbersPerPlayer จำนวนเลขต่อคน (1, 2, หรือ 3)
 * @returns array ของเลขที่ไม่ซ้ำกัน (จำนวน = playerCount * numbersPerPlayer)
 */
export function generateUniqueNumbers(playerCount: number, numbersPerPlayer: number = 1): number[] {
  const totalNumbers = playerCount * numbersPerPlayer;
  const numbers = new Set<number>();

  while (numbers.size < totalNumbers) {
    const randomNum = Math.floor(Math.random() * 100) + 1; // 1-100
    numbers.add(randomNum);
  }

  return Array.from(numbers);
}

/**
 * เริ่ม Level ใหม่ (สุ่มโจทย์ใหม่ + เลขใหม่)
 */
export async function startNextLevel(
  sessionId: string,
  playerIds: string[],
  playerNames: { [playerId: string]: string },
  currentLevel: number,
  currentHearts: number
): Promise<boolean> {
  console.log('🚀🚀🚀 [startNextLevel] CALLED with:', {
    sessionId,
    playerIds,
    currentLevel,
    currentHearts,
  });

  try {
    // 1. สุ่มโจทย์ใหม่
    const question = await getRandomQuestion();
    if (!question) {
      throw new Error('ไม่สามารถสุ่มโจทย์ได้');
    }

    // 2. คำนวณจำนวนเลขต่อคน (level 1=1, 2=2, 3=3)
    const numbersPerPlayer = currentLevel;
    const numbers = generateUniqueNumbers(playerIds.length, numbersPerPlayer);
    const totalNumbers = playerIds.length * numbersPerPlayer;

    // 3. อัปเดต Game State
    const phaseEndTime = new Date(Date.now() + 10 * 60 * 1000); // 10 นาที
    const sessionRef = doc(db, 'game_sessions', sessionId);

    await updateDoc(sessionRef, {
      currentLevel: currentLevel,
      hearts: currentHearts, // คงหัวใจเดิม
      currentRound: 1,
      totalRounds: totalNumbers,
      questionId: question.id,
      questionText: question.questionsTH,
      phase: 'writing',
      phaseEndTime: Timestamp.fromDate(phaseEndTime),
      revealedNumbers: [],
      updatedAt: serverTimestamp(),
    });

    // 4. ลบ player_answers เก่าออก
    const playerAnswersRef = collection(db, `game_sessions/${sessionId}/player_answers`);
    const oldAnswersSnap = await getDocs(playerAnswersRef);
    const deletePromises = oldAnswersSnap.docs.map((docSnap) => deleteDoc(docSnap.ref));
    await Promise.all(deletePromises);

    // 5. สร้าง Player Answers ใหม่
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
          answerIndex: answerIdx, // 0, 1, 2
        });
        numberIndex++;
      }
    }

    // 6. บันทึก Player Answers ใหม่แบบ Batch (ป้องกัน race condition)
    console.log(`📝 Creating ${playerAnswers.length} player_answers documents...`);

    const batch = [];
    for (const playerAnswer of playerAnswers) {
      const docId = `${playerAnswer.playerId}_${playerAnswer.answerIndex}`;
      console.log(`  - Preparing: ${docId} (number: ${playerAnswer.number})`);

      const docRef = doc(playerAnswersRef, docId);
      batch.push(
        setDoc(docRef, {
          ...playerAnswer,
          submittedAt: null,
        })
      );
    }

    // Execute all setDoc operations in parallel
    await Promise.all(batch);
    console.log(`✅ All ${batch.length} documents created successfully`);

    // 7. ลบ votes เก่าออก
    const votesRef = collection(db, `game_sessions/${sessionId}/votes`);
    const votesSnap = await getDocs(votesRef);
    const deleteVotesPromises = votesSnap.docs.map((docSnap) => deleteDoc(docSnap.ref));
    await Promise.all(deleteVotesPromises);

    // 8. ลบ ready_status เก่าออก
    await clearReadyStatus(sessionId);

    // 8. ตรวจสอบว่าสร้างครบจริงหรือไม่
    const verifySnap = await getDocs(playerAnswersRef);
    console.log(`✅ Started Level ${currentLevel}:`, {
      sessionId,
      question: question.questionsTH,
      numbersPerPlayer,
      totalNumbers,
      expectedDocs: playerAnswers.length,
      actualDocs: verifySnap.docs.length,
      docIds: verifySnap.docs.map(d => d.id),
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
    // 1. สุ่มเลือกโจทย์
    const question = await getRandomQuestion();
    if (!question) {
      throw new Error('ไม่สามารถสุ่มโจทย์ได้');
    }

    // 2. สุ่มเลขให้ผู้เล่น (Level 1 = คนละ 1 เลข)
    const numbersPerPlayer = 1;
    const numbers = generateUniqueNumbers(playerIds.length, numbersPerPlayer);

    // 3. สร้าง Game State
    const phaseEndTime = new Date(Date.now() + 10 * 60 * 1000); // 10 นาที
    const totalNumbers = playerIds.length * numbersPerPlayer;

    const gameState: ItoGameState = {
      id: sessionId,
      roomId: roomId,
      gameId: 'BWLxJkh45e6RiALRBmcl',

      // Level system
      currentLevel: 1,
      totalLevels: 3,

      hearts: 3,
      currentRound: 1,
      totalRounds: totalNumbers,

      questionId: question.id,
      questionText: question.questionsTH,
      phase: 'writing',
      phaseEndTime: phaseEndTime,
      revealedNumbers: [],
      status: 'playing',
      startedAt: new Date(),
      updatedAt: new Date(),
    };

    // 4. สร้าง Player Answers (แต่ละเลขเป็น document แยก)
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

    // 5. บันทึกลง Firestore
    const sessionRef = doc(db, 'game_sessions', sessionId);
    await updateDoc(sessionRef, {
      ...gameState,
      startedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      phaseEndTime: Timestamp.fromDate(phaseEndTime),
    });

    // 6. บันทึก Player Answers ลง subcollection
    // ใช้ playerId_answerIndex เป็น document ID
    const playerAnswersRef = collection(db, `game_sessions/${sessionId}/player_answers`);
    for (const playerAnswer of playerAnswers) {
      const docId = `${playerAnswer.playerId}_${playerAnswer.answerIndex}`;
      await setDoc(doc(playerAnswersRef, docId), {
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

    const details: any[] = [];
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
export async function startVotingPhase(sessionId: string): Promise<boolean> {
  try {
    const sessionRef = doc(db, 'game_sessions', sessionId);
    const phaseEndTime = new Date(Date.now() + 10 * 60 * 1000); // 10 นาที

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
    snapshot.docs.forEach((doc) => {
      const data = doc.data();
      const answerId = `${data.votedForPlayerId}_${data.votedForAnswerIndex}`;
      voteCount[answerId] = (voteCount[answerId] || 0) + 1;
    });

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

    // ถ้าเสมอ random
    const selectedAnswerId = winners.length > 1
      ? winners[Math.floor(Math.random() * winners.length)]
      : winners[0];

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
    let answerDocRef: any = null;

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
    const foundDocRef = answerDocRef;

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
    let newPhase: 'reveal' | 'levelComplete' | 'finished' = 'reveal';
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

    // อัปเดต game state
    await updateDoc(sessionRef, {
      hearts: newHearts,
      currentRound: newRound,
      revealedNumbers: finalRevealedNumbers,
      phase: newPhase, // 'reveal', 'levelComplete', หรือ 'finished'
      status: newStatus,
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
