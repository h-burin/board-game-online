/**
 * ITO Game Component
 * เกมความสามัคคี - เรียงลำดับตัวเลขโดยการสื่อสาร
 */

'use client';

import { useState, useEffect, useRef } from 'react';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { useItoGame } from '@/lib/hooks/useItoGame';
import { useVotes } from '@/lib/hooks/useVotes';
import { useReadyStatus } from '@/lib/hooks/useReadyStatus';
import { submitPlayerAnswer, unsendPlayerAnswer, submitVote, checkAllAnswersSubmitted, startVotingPhase, markPlayerReady, checkAllPlayersReady } from '@/lib/firebase/ito';

interface ItoGameProps {
  sessionId: string;
  playerId: string;
}

// Extended type for answers with answerIndex
type ItoPlayerAnswerWithIndex = {
  playerId: string;
  playerName: string;
  number: number;
  answer: string;
  submittedAt?: Date;
  isRevealed: boolean;
  answerIndex: number;
};

export default function ItoGame({ sessionId, playerId }: ItoGameProps) {
  const { gameState, playerAnswers, myAnswers, loading } = useItoGame(sessionId, playerId);
  const { votes, voteCount } = useVotes(sessionId);
  const { readyPlayers, readyCount } = useReadyStatus(sessionId);

  const [answers, setAnswers] = useState<{ [answerIndex: number]: string }>({});
  const [selectedAnswerId, setSelectedAnswerId] = useState<string | null>(null); // format: "playerId_answerIndex"
  const [submitting, setSubmitting] = useState(false);
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [revealing, setRevealing] = useState(false);
  const [lastRevealResult, setLastRevealResult] = useState<{
    isCorrect: boolean;
    heartsLost: number;
  } | null>(null);
  const prevAnswersRef = useRef<string>('');
  const prevLevelRef = useRef<number>(0);

  // Clear answers when level changes
  useEffect(() => {
    if (!gameState) return;

    // ถ้ายังไม่เคยตั้งค่า prevLevelRef ให้ตั้งค่าครั้งแรก
    if (prevLevelRef.current === 0) {
      prevLevelRef.current = gameState.currentLevel;
      return;
    }

    // ถ้า level เปลี่ยน ให้ clear ข้อมูล
    if (prevLevelRef.current !== gameState.currentLevel) {
      console.log(`🔄 Level changed from ${prevLevelRef.current} to ${gameState.currentLevel}, clearing answers`);
      setAnswers({});
      prevAnswersRef.current = '';
      prevLevelRef.current = gameState.currentLevel;
    }
  }, [gameState?.currentLevel]);

  // Auto-fill answers if already submitted
  useEffect(() => {
    if (!gameState || myAnswers.length === 0) return;

    // Cast to extended type
    const answersWithIndex = myAnswers as unknown as ItoPlayerAnswerWithIndex[];

    // ตรวจสอบจำนวน answers ที่ควรจะมีใน level ปัจจุบัน
    // Level 1 = 1 answer, Level 2 = 2 answers, Level 3 = 3 answers
    const expectedAnswersCount = gameState.currentLevel;

    // ถ้าจำนวน answers ไม่ตรงกับที่คาดหวัง แปลว่าเป็นข้อมูลเก่า
    if (myAnswers.length !== expectedAnswersCount) {
      console.log('⚠️ Answers count mismatch, skipping auto-fill:', {
        expected: expectedAnswersCount,
        actual: myAnswers.length,
        level: gameState.currentLevel,
      });
      return;
    }

    // ตรวจสอบว่า myAnswers ทั้งหมดเป็นของ level ปัจจุบันหรือไม่
    // โดยดูว่าถ้า answer ไม่ว่าง แต่ submittedAt เป็น null
    // แปลว่าเป็นข้อมูลเก่าที่ Firestore ยังไม่ได้ลบ (ข้ามไป)
    const hasStaleData = answersWithIndex.some(
      (ans) => ans.answer !== '' && !ans.submittedAt
    );

    if (hasStaleData) {
      console.log('⚠️ Detected stale data from Firestore, skipping auto-fill');
      return;
    }

    // สร้าง key จาก myAnswers เพื่อเช็คว่ามีการเปลี่ยนแปลงจริงหรือไม่
    // เพิ่ม currentLevel ใน key เพื่อให้ clear เมื่อ level เปลี่ยน
    const answersKey = `L${gameState.currentLevel}|${answersWithIndex
      .map(a => `${a.answerIndex}:${a.answer || ''}:${a.submittedAt ? '1' : '0'}`)
      .sort()
      .join('|')}`;

    // ถ้าไม่มีการเปลี่ยนแปลง ไม่ต้อง update
    if (prevAnswersRef.current === answersKey) return;

    console.log('📝 Auto-fill answers check:', {
      currentLevel: gameState.currentLevel,
      previousKey: prevAnswersRef.current,
      newKey: answersKey,
      myAnswersCount: myAnswers.length,
      hasStaleData,
    });

    prevAnswersRef.current = answersKey;

    // อัปเดต answers แต่เฉพาะตัวที่ส่งไปแล้ว (submittedAt !== null)
    // เพื่อไม่ให้ overwrite ข้อมูลที่ user กำลังพิมพ์อยู่
    setAnswers((prevAnswers) => {
      const newAnswers = { ...prevAnswers };
      answersWithIndex.forEach((ans) => {
        // เฉพาะตัวที่ส่งไปแล้ว (submittedAt !== null) หรือ ยังไม่มีค่าใน prevAnswers
        if (ans.submittedAt) {
          // ส่งไปแล้ว → ใช้ค่าจาก Firestore
          newAnswers[ans.answerIndex] = ans.answer || '';
        } else if (!prevAnswers[ans.answerIndex]) {
          // ยังไม่เคยมีค่า และ submittedAt = null → ว่างเปล่า
          newAnswers[ans.answerIndex] = '';
        }
        // ถ้ายังไม่ส่ง (submittedAt === null) และมีค่าอยู่แล้วใน prevAnswers
        // ให้เก็บค่าเดิมที่ user กำลังพิมพ์อยู่ (ไม่ต้องทำอะไร)
      });
      return newAnswers;
    });
  }, [myAnswers, gameState]);

  // Handle submit answer for specific answerIndex
  const handleSubmitAnswer = async (answerIndex: number) => {
    const answer = answers[answerIndex];
    if (!answer?.trim() || !gameState || submitting) return;

    setSubmitting(true);
    const success = await submitPlayerAnswer(sessionId, playerId, answer.trim(), answerIndex);

    if (success) {
      console.log('✅ Answer submitted successfully for index', answerIndex);
    } else {
      alert('เกิดข้อผิดพลาดในการส่งคำตอบ');
    }
    setSubmitting(false);
  };

  // Handle edit answer (unsend to allow re-editing)
  const handleEditAnswer = async (answerIndex: number) => {
    if (submitting) return;

    setSubmitting(true);
    const success = await unsendPlayerAnswer(sessionId, playerId, answerIndex);

    if (success) {
      console.log('✅ Answer unsent for editing at index', answerIndex);
    } else {
      alert('เกิดข้อผิดพลาดในการแก้ไขคำตอบ');
    }
    setSubmitting(false);
  };

  // Handle submit vote
  const handleSubmitVote = async () => {
    if (!selectedAnswerId || submitting) return;

    // แยก answerId เป็น playerId และ answerIndex
    const [votedPlayerId, answerIndexStr] = selectedAnswerId.split('_');
    const answerIndex = parseInt(answerIndexStr, 10);

    setSubmitting(true);
    const success = await submitVote(sessionId, playerId, votedPlayerId, answerIndex);

    if (success) {
      console.log('✅ Vote submitted successfully for:', selectedAnswerId);
      setSelectedAnswerId(null);
    } else {
      alert('เกิดข้อผิดพลาดในการโหวต');
    }
    setSubmitting(false);
  };

  // Auto-check removed - ให้ผู้เล่นเข้า voting phase ตั้งแต่เริ่มเกม
  // ผู้เล่นสามารถแก้ไขคำตอบได้ตลอดจนกว่าจะถูก reveal

  // Reset lastRevealResult เมื่อเข้า voting phase ใหม่
  useEffect(() => {
    if (gameState?.phase === 'voting') {
      setLastRevealResult(null);
    }
  }, [gameState?.phase]);

  // Auto-check if all votes submitted (Voting phase)
  useEffect(() => {
    if (!gameState || gameState.phase !== 'voting' || revealing) return;

    // ผู้เล่นทั้งหมด (unique players - ไม่ใช่จำนวน answers)
    const uniquePlayerIds = Array.from(new Set(playerAnswers.map((a) => a.playerId)));
    const totalPlayers = uniquePlayerIds.length;

    console.log('🔍 Vote check:', {
      voteCount,
      totalPlayers,
      shouldReveal: voteCount === totalPlayers && voteCount > 0,
    });

    if (voteCount === totalPlayers && voteCount > 0) {
      console.log('✅ All votes submitted, revealing results');
      handleRevealVotes();
    }
  }, [voteCount, gameState, playerAnswers, revealing]);

  // Auto-reveal when time runs out
  useEffect(() => {
    if (!gameState || revealing) return;

    if (timeLeft === 0 && gameState.phase === 'voting' && voteCount > 0) {
      console.log('⏰ Time is up, revealing results');
      handleRevealVotes();
    }
  }, [timeLeft, gameState, voteCount, revealing]);

  // Count remaining time
  useEffect(() => {
    if (!gameState || !gameState.phaseEndTime) return;

    const interval = setInterval(() => {
      const now = Date.now();
      const end = gameState.phaseEndTime!.getTime();
      const diff = Math.max(0, Math.floor((end - now) / 1000));
      setTimeLeft(diff);

      if (diff === 0) {
        clearInterval(interval);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [gameState?.phaseEndTime]);

  // Handle reveal votes
  const handleRevealVotes = async () => {
    if (revealing) return;

    console.log('🎮 handleRevealVotes called');
    setRevealing(true);
    try {
      const url = `/api/games/ito/${sessionId}/reveal`;
      console.log('📡 Fetching:', url);

      const response = await fetch(url, {
        method: 'POST',
      });

      console.log('📡 Response status:', response.status);

      const data = await response.json();
      console.log('📡 Response data:', data);

      if (data.success) {
        console.log('✅ Votes revealed:', data);
        // เก็บผลลัพธ์จาก API
        setLastRevealResult({
          isCorrect: data.isCorrect,
          heartsLost: data.heartsLost,
        });
        // Phase จะเปลี่ยนเป็น 'reveal' อัตโนมัติจาก Firebase
        // ไม่ต้องทำอะไร รอ useEffect จัดการต่อ
      } else {
        console.error('❌ Failed to reveal votes:', data.error);
        console.error('❌ Full error data:', data);
      }
    } catch (error) {
      console.error('❌ Error revealing votes:', error);
      console.error('❌ Error details:', {
        message: error instanceof Error ? error.message : 'Unknown',
        stack: error instanceof Error ? error.stack : 'No stack',
      });
    } finally {
      setTimeout(() => setRevealing(false), 2000);
    }
  };

  // Auto-transition from reveal phase
  useEffect(() => {
    if (!gameState || gameState.phase !== 'reveal') return;

    const timer = setTimeout(async () => {
      const sessionRef = doc(db, 'game_sessions', sessionId);

      // ตรวจสอบว่า level นี้จบหรือยัง
      const allRevealedInLevel = gameState.revealedNumbers.length >= gameState.totalRounds;

      if (gameState.status === 'lost') {
        // แพ้แล้ว → finished
        await updateDoc(sessionRef, {
          phase: 'finished',
          updatedAt: serverTimestamp(),
        });
      } else if (gameState.status === 'won') {
        // ชนะแล้ว → finished
        await updateDoc(sessionRef, {
          phase: 'finished',
          updatedAt: serverTimestamp(),
        });
      } else if (allRevealedInLevel) {
        // Level นี้จบแล้ว (แต่เกมยังไม่จบ)
        await updateDoc(sessionRef, {
          phase: 'levelComplete',
          updatedAt: serverTimestamp(),
        });
      } else {
        // Level ยังไม่จบ → กลับไป voting
        await startVotingPhase(sessionId);
      }
    }, 5000); // แสดงผล 5 วินาที

    return () => clearTimeout(timer);
  }, [gameState, sessionId]);

  // Auto-check if all players ready (levelComplete phase)
  useEffect(() => {
    if (!gameState || gameState.phase !== 'levelComplete') return;

    const checkReady = async () => {
      const allReady = await checkAllPlayersReady(sessionId);

      if (allReady) {
        console.log('✅ All players ready, starting next level');

        try {
          // Level 3 → ไปหน้า finished
          if (gameState.currentLevel >= gameState.totalLevels) {
            const sessionRef = doc(db, 'game_sessions', sessionId);
            await updateDoc(sessionRef, {
              phase: 'finished',
              status: 'won',
              updatedAt: serverTimestamp(),
            });
            return;
          }

          // Level 1-2 → ไป level ถัดไป
          const response = await fetch(`/api/games/ito/${sessionId}/nextLevel`, {
            method: 'POST',
          });

          const data = await response.json();

          if (!data.success) {
            console.error('❌ Failed to start next level:', data.error);
          } else {
            console.log('✅ Started next level');
          }
        } catch (error) {
          console.error('❌ Error starting next level:', error);
        }
      }
    };

    checkReady();
  }, [gameState, sessionId, readyCount]); // Listen to readyCount changes

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  // Loading state
  if (loading || !gameState) {
    return (
      <div className="text-center text-white">
        <p className="text-xl">กำลังโหลดเกม...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Game Header */}
      <div className="bg-white/10 backdrop-blur-lg rounded-3xl shadow-2xl p-6 border border-white/20 mt-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white mb-2">เกมความสามัคคี</h2>
            <p className="text-blue-200">เปิดแล้ว {gameState.revealedNumbers.length}/{gameState.totalRounds} เลข</p>
          </div>

          {/* Hearts */}
          <div>
            <div className="flex items-center gap-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <div
                  key={i}
                  className={`text-4xl transition-all duration-500 ${
                    i < gameState.hearts ? 'text-red-500 scale-100' : 'text-gray-600 opacity-30 scale-75'
                  }`}
                >
                  ❤️
                </div>
              ))}
            </div>
            <div className="text-center text-white/70 text-sm mt-1">
              {gameState.hearts} / 3
            </div>
          </div>
        </div>

        {/* Timer */}
        {gameState.phase !== 'finished' && gameState.phaseEndTime && (
          <div className="mt-4 text-center">
            <div className="text-4xl font-bold text-yellow-300">
              {minutes}:{seconds.toString().padStart(2, '0')}
            </div>
            <div className="text-sm text-white/70 mt-1">
              เวลาเล่น
            </div>
          </div>
        )}
      </div>

      {/* Question */}
      <div className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 backdrop-blur-lg rounded-3xl shadow-2xl p-8 border border-white/20">
        <h3 className="text-lg text-white/70 mb-2">โจทย์:</h3>
        <p className="text-3xl font-bold text-white">{gameState.questionText}</p>
      </div>

      {/* My Numbers */}
      {myAnswers.length > 0 && (() => {
        const answersWithIndex = myAnswers as unknown as ItoPlayerAnswerWithIndex[];
        return (
          <div className="bg-yellow-500/20 backdrop-blur-lg rounded-3xl shadow-2xl p-6 border-2 border-yellow-400">
            <div className="text-center">
              <p className="text-white/70 mb-2">
                {myAnswers.length === 1 ? 'เลขของคุณ:' : `เลขของคุณ (${myAnswers.length} เลข):`}
              </p>
              <div className="flex flex-wrap justify-center gap-4">
                {answersWithIndex
                  .sort((a, b) => a.answerIndex - b.answerIndex)
                  .map((ans, idx) => (
                    <div key={idx} className="text-center">
                      <div className="text-6xl font-bold text-yellow-300">{ans.number}</div>
                      {myAnswers.length > 1 && (
                        <div className="text-white/50 text-sm mt-1">เลขที่ {idx + 1}</div>
                      )}
                    </div>
                  ))}
              </div>
            </div>
          </div>
        );
      })()}

      {/* Phase: Writing */}
      {gameState.phase === 'writing' && (() => {
        const answersWithIndex = myAnswers as unknown as ItoPlayerAnswerWithIndex[];

        // คำนวณสถานะการส่งคำใบ้
        const uniquePlayerIds = Array.from(new Set(playerAnswers.map((a) => a.playerId)));
        const totalPlayers = uniquePlayerIds.length;
        const expectedAnswersPerPlayer = gameState.currentLevel; // Level 1 = 1 เลข, Level 2 = 2 เลข, etc.

        // สร้าง map: playerId → { playerName, submittedCount, totalExpected }
        const playerSubmissionStatus: { [key: string]: { playerName: string; submittedCount: number; totalExpected: number } } = {};

        uniquePlayerIds.forEach((id) => {
          const playerAnswersForThisPlayer = playerAnswers.filter((a) => a.playerId === id);
          const submittedCount = playerAnswersForThisPlayer.filter((a) => a.submittedAt).length;
          const playerName = playerAnswersForThisPlayer[0]?.playerName || 'Unknown';

          playerSubmissionStatus[id] = {
            playerName,
            submittedCount,
            totalExpected: expectedAnswersPerPlayer
          };
        });

        const playersCompleted = Object.values(playerSubmissionStatus).filter((p) => p.submittedCount === p.totalExpected);
        const playersNotCompleted = Object.entries(playerSubmissionStatus).filter(([, p]) => p.submittedCount < p.totalExpected);

        return (
          <div className="bg-white/10 backdrop-blur-lg rounded-3xl shadow-2xl p-8 border border-white/20">
            <h3 className="text-2xl font-bold text-white mb-4">พิมพ์คำใบ้ของคุณ</h3>
            <p className="text-white/70 mb-6">
              ให้คำใบ้ที่สื่อถึงตัวเลขของคุณ โดยไม่ต้องบอกตัวเลข
            </p>

            {/* สถานะการส่งคำใบ้ของผู้เล่น */}
            <div className="bg-white/5 rounded-2xl p-4 mb-6 border border-white/10">
              <h4 className="text-white font-bold mb-3 text-center">สถานะการส่งคำใบ้</h4>
              <div className="text-center text-white/70 mb-3">
                {playersCompleted.length} / {totalPlayers} คนส่งครบแล้ว
              </div>
              <div className="grid grid-cols-2 gap-3">
                {/* ส่งครบแล้ว */}
                <div>
                  <div className="text-green-400 text-sm mb-2 text-center">✅ ส่งครบแล้ว</div>
                  <div className="space-y-1">
                    {playersCompleted.map((p, i) => (
                      <div key={i} className="text-white/80 text-sm text-center bg-green-500/20 rounded py-1">
                        {p.playerName} ({p.submittedCount}/{p.totalExpected})
                      </div>
                    ))}
                  </div>
                </div>

                {/* ยังส่งไม่ครบ */}
                <div>
                  <div className="text-orange-400 text-sm mb-2 text-center">⏳ ยังส่งไม่ครบ</div>
                  <div className="space-y-1">
                    {playersNotCompleted.map(([id, p]) => (
                      <div key={id} className="text-white/50 text-sm text-center bg-orange-500/20 rounded py-1">
                        {p.playerName} ({p.submittedCount}/{p.totalExpected})
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* ประวัติเลขที่เปิดแล้ว */}
            {gameState.revealedNumbers.length > 0 && (
              <div className="bg-gradient-to-r from-green-500/20 to-blue-500/20 rounded-xl p-4 mb-6 border border-green-400/30">
                <h4 className="text-white font-bold mb-3 text-center">ตัวเลขที่เปิดแล้ว</h4>
                <div className="flex flex-wrap justify-center gap-2">
                  {gameState.revealedNumbers.map((num, i) => (
                    <div
                      key={i}
                      className="bg-white/20 px-4 py-2 rounded-lg text-xl font-bold text-white"
                    >
                      {num}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* แสดงช่องกรอกแยกสำหรับแต่ละเลข */}
            <div className="space-y-6">
              {answersWithIndex
                .sort((a, b) => a.answerIndex - b.answerIndex)
                .map((ans) => {
                  const isSubmitted = !!ans.submittedAt;
                  return (
                    <div key={ans.answerIndex} className="bg-white/5 rounded-2xl p-6 border border-white/10">
                      {/* เลขที่ */}
                      <div className="flex items-center justify-between mb-3">
                        <div className="text-white/70">
                          {myAnswers.length > 1 ? `เลขที่ ${ans.answerIndex + 1}:` : 'เลขของคุณ:'}
                        </div>
                        <div className="text-3xl font-bold text-yellow-300">{ans.number}</div>
                      </div>

                      {/* ช่องกรอกคำใบ้ */}
                      <textarea
                        className="w-full p-4 rounded-xl bg-white/10 text-white border border-white/20 focus:border-white/50 focus:outline-none resize-none"
                        rows={3}
                        placeholder={`พิมพ์คำใบ้สำหรับเลข ${ans.number}...`}
                        value={answers[ans.answerIndex] || ''}
                        onChange={(e) => setAnswers({ ...answers, [ans.answerIndex]: e.target.value })}
                        disabled={isSubmitted}
                      />

                      {/* ปุ่มส่ง / แก้ไข */}
                      {!isSubmitted ? (
                        <button
                          onClick={() => handleSubmitAnswer(ans.answerIndex)}
                          disabled={!answers[ans.answerIndex]?.trim() || submitting}
                          className="mt-3 w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 disabled:from-gray-500 disabled:to-gray-600 disabled:cursor-not-allowed text-white font-bold py-3 rounded-xl transition-all transform hover:scale-105"
                        >
                          {submitting ? 'กำลังส่ง...' : 'ส่งคำตอบ'}
                        </button>
                      ) : (
                        <div className="mt-3 space-y-2">
                          <div className="text-center text-green-400 font-bold">
                            ✓ ส่งคำตอบแล้ว
                          </div>
                          <button
                            onClick={() => handleEditAnswer(ans.answerIndex)}
                            disabled={submitting}
                            className="w-full bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 disabled:from-gray-500 disabled:to-gray-600 disabled:cursor-not-allowed text-white font-bold py-2 rounded-xl transition-all"
                          >
                            {submitting ? 'กำลังยกเลิก...' : '✏️ แก้ไขคำตอบ'}
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
            </div>

            {/* แสดงสถานะรวม */}
            {answersWithIndex.every((ans) => ans.submittedAt) && (
              <div className="mt-6 text-center text-green-400 font-bold text-lg">
                ✓ ส่งคำตอบครบทุกเลขแล้ว รอผู้เล่นคนอื่น...
              </div>
            )}
          </div>
        );
      })()}

      {/* Phase: Voting */}
      {gameState.phase === 'voting' && (() => {
        const answersWithIndex = myAnswers as unknown as ItoPlayerAnswerWithIndex[];
        const uniquePlayerIds = Array.from(new Set(playerAnswers.map((a) => a.playerId)));
        const totalPlayers = uniquePlayerIds.length;
        const expectedAnswersPerPlayer = gameState.currentLevel;

        // เช็คว่าทุกคนพิมพ์คำใบ้ครบหรือยัง (ต้องมีคำใบ้ + answer ไม่ว่าง)
        const playerSubmissionStatus: { [key: string]: { playerName: string; submittedCount: number; totalExpected: number } } = {};

        uniquePlayerIds.forEach((id) => {
          const playerAnswersForThisPlayer = playerAnswers.filter((a) => a.playerId === id);
          const submittedCount = playerAnswersForThisPlayer.filter((a) => a.answer.trim() !== '').length;
          const playerName = playerAnswersForThisPlayer[0]?.playerName || 'Unknown';

          playerSubmissionStatus[id] = {
            playerName,
            submittedCount,
            totalExpected: expectedAnswersPerPlayer
          };
        });

        const allPlayersSubmittedAll = Object.values(playerSubmissionStatus).every((p) => p.submittedCount === p.totalExpected);
        const playersCompleted = Object.values(playerSubmissionStatus).filter((p) => p.submittedCount === p.totalExpected);
        const playersNotCompleted = Object.entries(playerSubmissionStatus).filter(([, p]) => p.submittedCount < p.totalExpected);

        const votedPlayerIds = votes.map((v) => v.playerId);
        const playersWhoVoted = uniquePlayerIds.filter((id) => votedPlayerIds.includes(id));
        const playersWhoNotVoted = uniquePlayerIds.filter((id) => !votedPlayerIds.includes(id));

        return (
          <div className="space-y-6">
            {/* ส่วนพิมพ์คำใบ้ของตัวเอง */}
            {answersWithIndex.filter(ans => !ans.isRevealed).length > 0 && (
              <div className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 backdrop-blur-lg rounded-3xl shadow-2xl p-8 border border-purple-400/30">
                <h3 className="text-2xl font-bold text-white mb-4">คำใบ้ของคุณ</h3>
                <p className="text-white/70 mb-6">
                  คุณสามารถแก้ไขคำใบ้ได้ตลอดจนกว่าจะถูกเปิด
                </p>

                <div className="space-y-4">
                  {answersWithIndex
                    .filter(ans => !ans.isRevealed)
                    .sort((a, b) => a.answerIndex - b.answerIndex)
                    .map((ans) => (
                      <div key={ans.answerIndex} className="bg-white/10 rounded-2xl p-6 border border-white/20">
                        <div className="flex items-center justify-between mb-3">
                          <div className="text-white/70">
                            {myAnswers.length > 1 ? `เลขที่ ${ans.answerIndex + 1}:` : 'เลขของคุณ:'}
                          </div>
                          <div className="text-3xl font-bold text-yellow-300">{ans.number}</div>
                        </div>

                        <textarea
                          className="w-full p-4 rounded-xl bg-white/10 text-white border border-white/20 focus:border-white/50 focus:outline-none resize-none"
                          rows={2}
                          placeholder={`พิมพ์คำใบ้สำหรับเลข ${ans.number}...`}
                          value={answers[ans.answerIndex] || ''}
                          onChange={(e) => setAnswers({ ...answers, [ans.answerIndex]: e.target.value })}
                        />

                        <button
                          onClick={() => handleSubmitAnswer(ans.answerIndex)}
                          disabled={!answers[ans.answerIndex]?.trim() || submitting}
                          className={`mt-3 w-full font-bold py-2 rounded-xl transition-all ${
                            ans.answer
                              ? 'bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 disabled:from-gray-500 disabled:to-gray-600'
                              : 'bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 disabled:from-gray-500 disabled:to-gray-600'
                          } disabled:cursor-not-allowed text-white`}
                        >
                          {submitting ? 'กำลังบันทึก...' : ans.answer ? 'อัปเดตคำใบ้' : 'บันทึกคำใบ้'}
                        </button>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* ส่วนโหวต */}
            <div className="bg-white/10 backdrop-blur-lg rounded-3xl shadow-2xl p-8 border border-white/20">
              <h3 className="text-2xl font-bold text-white mb-4">เลือกคำใบ้ที่น้อยที่สุด</h3>
              <p className="text-white/70 mb-4">
                คลิกเลือกคำใบ้ที่คุณคิดว่าสื่อถึงตัวเลขที่น้อยที่สุด
              </p>

            {/* ประวัติเลขที่เปิดแล้ว */}
            {gameState.revealedNumbers.length > 0 && (
              <div className="bg-gradient-to-r from-green-500/20 to-blue-500/20 rounded-xl p-4 mb-6 border border-green-400/30">
                <h4 className="text-white font-bold mb-3 text-center">ตัวเลขที่เปิดแล้ว</h4>
                <div className="flex flex-wrap justify-center gap-2">
                  {gameState.revealedNumbers.map((num, i) => (
                    <div
                      key={i}
                      className="bg-white/20 px-4 py-2 rounded-lg text-xl font-bold text-white"
                    >
                      {num}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* สถานะการส่งคำใบ้ */}
            <div className="bg-white/5 rounded-xl p-4 mb-6">
              <h4 className="text-white font-bold mb-3 text-center">สถานะการส่งคำใบ้</h4>
              <div className="text-center text-white/70 mb-3">
                {playersCompleted.length} / {totalPlayers} คนส่งครบแล้ว
              </div>

              {!allPlayersSubmittedAll && (
                <div className="text-center text-orange-300 text-sm mb-3 bg-orange-500/20 rounded-lg py-2">
                  ⚠️ รอให้ทุกคนพิมพ์คำใบ้ครบก่อนโหวต
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                {/* ส่งครบแล้ว */}
                <div>
                  <div className="text-green-400 text-sm mb-2 text-center">✅ ส่งครบแล้ว</div>
                  <div className="space-y-1">
                    {playersCompleted.map((p, i) => (
                      <div key={i} className="text-white/80 text-sm text-center bg-green-500/20 rounded py-1">
                        {p.playerName} ({p.submittedCount}/{p.totalExpected})
                      </div>
                    ))}
                  </div>
                </div>

                {/* ยังส่งไม่ครบ */}
                <div>
                  <div className="text-orange-400 text-sm mb-2 text-center">⏳ ยังส่งไม่ครบ</div>
                  <div className="space-y-1">
                    {playersNotCompleted.map(([id, p]) => (
                      <div key={id} className="text-white/50 text-sm text-center bg-orange-500/20 rounded py-1">
                        {p.playerName} ({p.submittedCount}/{p.totalExpected})
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* สถานะการโหวต (แสดงถ้าทุกคนส่งครบแล้ว) */}
            {allPlayersSubmittedAll && (
              <div className="bg-white/5 rounded-xl p-4 mb-6">
                <div className="flex items-center justify-between mb-3">
                  <div className="text-white font-semibold">
                    สถานะการโหวต: {voteCount} / {totalPlayers}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {/* โหวตแล้ว */}
                  <div>
                    <div className="text-green-400 text-sm mb-2">✓ โหวตแล้ว ({playersWhoVoted.length})</div>
                    <div className="space-y-1">
                      {playersWhoVoted.map((id) => {
                        const player = playerAnswers.find((a) => a.playerId === id);
                        return (
                          <div key={id} className="text-white/70 text-sm">
                            • {player?.playerName}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* ยังไม่โหวต */}
                  <div>
                    <div className="text-orange-400 text-sm mb-2">⏳ รอโหวต ({playersWhoNotVoted.length})</div>
                    <div className="space-y-1">
                      {playersWhoNotVoted.map((id) => {
                        const player = playerAnswers.find((a) => a.playerId === id);
                        return (
                          <div key={id} className="text-white/50 text-sm">
                            • {player?.playerName}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ส่วนโหวต - แสดงเฉพาะเมื่อทุกคนส่งครบแล้ว */}
            {allPlayersSubmittedAll ? (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  {playerAnswers
                    .filter((a) => !a.isRevealed && a.answer.trim() !== '')
                    .map((playerAnswer) => {
                      const answerWithIndex = playerAnswer as ItoPlayerAnswerWithIndex;
                      const answerId = `${answerWithIndex.playerId}_${answerWithIndex.answerIndex}`;
                      return (
                        <button
                          key={answerId}
                          onClick={() => setSelectedAnswerId(answerId)}
                          className={`p-6 rounded-2xl border-2 transition-all cursor-pointer ${
                            selectedAnswerId === answerId
                              ? 'border-yellow-400 bg-yellow-500/30'
                              : 'border-white/20 bg-white/5 hover:bg-white/10'
                          }`}
                        >
                          <div className="text-white/70 text-sm mb-2">{playerAnswer.playerName}</div>
                          <div className="text-white text-lg font-semibold">{playerAnswer.answer}</div>
                          {playerAnswer.playerId === playerId && (
                            <div className="text-blue-300 text-sm mt-2">(คำใบ้ของคุณ)</div>
                          )}
                        </button>
                      );
                    })}
                </div>

                <button
                  onClick={handleSubmitVote}
                  disabled={!selectedAnswerId || submitting}
                  className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 disabled:from-gray-500 disabled:to-gray-600 disabled:cursor-not-allowed text-white text-xl font-bold py-4 rounded-xl transition-all transform hover:scale-105"
                >
                  {submitting ? 'กำลังส่ง...' : 'ยืนยันการเลือก'}
                </button>
              </>
            ) : (
              <div className="text-center py-8 bg-gray-500/20 rounded-2xl">
                <div className="text-white/70 text-lg mb-2">⏳ รอให้ทุกคนพิมพ์คำใบ้ครบก่อน</div>
                <div className="text-white/50 text-sm">จึงจะสามารถโหวตได้</div>
              </div>
            )}
          </div>
          </div>
        );
      })()}

      {/* Phase: Reveal */}
      {gameState.phase === 'reveal' && (() => {
        // Find the last revealed player answer (เลขที่ถูกโหวต)
        const lastRevealed = playerAnswers.find(
          (a) => a.isRevealed && a.number === gameState.revealedNumbers[gameState.revealedNumbers.length - 1]
        );

        if (!lastRevealed) return null;

        // ใช้ผลลัพธ์จาก API (ถูกคำนวณมาจาก backend แล้ว)
        // ถ้ายังไม่มีผล (กรณี refresh หน้า) ให้ fallback เป็น true
        const isCorrect = lastRevealResult?.isCorrect ?? true;
        const heartsLost = lastRevealResult?.heartsLost ?? 0;

        console.log('🔍 UI Reveal check:', {
          lastRevealedNumber: lastRevealed.number,
          revealedNumbers: gameState.revealedNumbers,
          isCorrect,
          heartsLost,
          fromAPI: !!lastRevealResult,
        });

        return (
          <div className="bg-white/10 backdrop-blur-lg rounded-3xl shadow-2xl p-8 border border-white/20 animate-fadeIn">
            <h3 className="text-2xl font-bold text-white mb-6 text-center">ผลการโหวต</h3>

            {/* Revealed Card */}
            <div className="bg-gradient-to-br from-purple-500/30 to-pink-500/30 rounded-2xl p-8 mb-6 border-2 border-purple-400">
              <div className="text-center mb-4">
                <div className="text-white/70 mb-2">คำใบ้ที่ได้รับโหวตมากสุด:</div>
                <div className="text-white text-2xl font-bold mb-2">{lastRevealed.playerName}</div>
                <div className="text-white/90 text-xl italic mb-4">&quot;{lastRevealed.answer}&quot;</div>
              </div>

              {/* Number Reveal */}
              <div className="bg-white/20 rounded-xl p-6 mb-4">
                <div className="text-center">
                  <div className="text-white/70 mb-2">หมายเลข:</div>
                  <div className="text-6xl font-bold text-yellow-300">{lastRevealed.number}</div>
                </div>
              </div>

              {/* Correct/Incorrect */}
              {isCorrect ? (
                <div className="text-center">
                  <div className="text-6xl mb-2">✅</div>
                  <div className="text-2xl font-bold text-green-400">ถูกต้อง!</div>
                  <div className="text-white/70 mt-2">นี่คือตัวเลขที่น้อยที่สุด</div>
                </div>
              ) : (
                <div className="text-center">
                  <div className="text-6xl mb-2">❌</div>
                  <div className="text-2xl font-bold text-red-400">ผิด!</div>
                  <div className="text-white/70 mt-2">
                    ข้ามตัวเลขไป - เสียหัวใจ {heartsLost} ดวง
                  </div>
                </div>
              )}
            </div>

            {/* Revealed Numbers Progress */}
            <div className="bg-white/5 rounded-xl p-6">
              <h4 className="text-white font-bold mb-3 text-center">ตัวเลขที่เปิดแล้ว:</h4>
              <div className="flex flex-wrap justify-center gap-2">
                {gameState.revealedNumbers.map((num, i) => (
                  <div
                    key={i}
                    className={`px-4 py-2 rounded-lg text-xl font-bold ${
                      i === gameState.revealedNumbers.length - 1
                        ? 'bg-yellow-500/50 text-yellow-100 border-2 border-yellow-400'
                        : 'bg-white/20 text-white'
                    }`}
                  >
                    {num}
                  </div>
                ))}
              </div>
            </div>

            {/* Auto-transition message */}
            <div className="text-center mt-6 text-white/70">
              {gameState.status === 'won' || gameState.status === 'lost' ? (
                <p>กำลังสรุปผล...</p>
              ) : (
                <p>กำลังเตรียมรอบต่อไป...</p>
              )}
            </div>
          </div>
        );
      })()}

      {/* Phase: Level Complete */}
      {gameState.phase === 'levelComplete' && (() => {
        // หาผู้เล่นทั้งหมด (unique)
        const uniquePlayerIds = Array.from(new Set(playerAnswers.map((a) => a.playerId)));
        const totalPlayers = uniquePlayerIds.length;

        // สร้าง map ของ playerId → playerName
        const playerNames: { [key: string]: string } = {};
        playerAnswers.forEach((a) => {
          if (!playerNames[a.playerId]) {
            playerNames[a.playerId] = a.playerName;
          }
        });

        // หาว่าใครพร้อมแล้ว
        const readyPlayerIds = readyPlayers.map((r) => r.playerId);
        const notReadyPlayers = uniquePlayerIds.filter((id) => !readyPlayerIds.includes(id));

        // เรียงเลขที่เปิดแล้ว + ดึงคำใบ้
        const revealedAnswers = playerAnswers
          .filter((a) => a.isRevealed)
          .sort((a, b) => a.number - b.number);

        // เช็คว่า player ปัจจุบันพร้อมหรือยัง
        const isPlayerReady = readyPlayerIds.includes(playerId);

        const handleReady = async () => {
          if (submitting || isPlayerReady) return;

          setSubmitting(true);
          const playerName = playerNames[playerId] || 'Unknown';
          const success = await markPlayerReady(sessionId, playerId, playerName);

          if (success) {
            console.log('✅ Marked as ready');
          } else {
            alert('เกิดข้อผิดพลาดในการยืนยัน');
          }
          setSubmitting(false);
        };

        return (
          <div className="bg-white/10 backdrop-blur-lg rounded-3xl shadow-2xl p-12 border border-white/20">
            <div className="text-center mb-8">
              <div className="text-8xl mb-6">🎊</div>
              <h3 className="text-4xl font-bold text-blue-400 mb-4">ผ่านรอบที่ {gameState.currentLevel}!</h3>
              <p className="text-white/90 text-xl">
                {gameState.currentLevel >= gameState.totalLevels
                  ? 'เยี่ยมมาก! เตรียมพร้อมดูผลลัพธ์'
                  : 'เยี่ยมมาก! เตรียมพร้อมสำหรับรอบถัดไป'}
              </p>
            </div>

            {/* เลขทั้งหมด (เปิดแล้ว + ยังไม่เปิด) */}
            <div className="bg-gradient-to-r from-green-500/20 to-blue-500/20 rounded-2xl p-6 mb-6 border border-green-400/30">
              <h4 className="text-white font-bold mb-4 text-center text-xl">ตัวเลขทั้งหมดในรอบนี้</h4>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {/* เลขที่เปิดแล้ว */}
                {revealedAnswers.map((ans, i) => (
                  <div
                    key={i}
                    className="bg-white/10 rounded-xl p-4 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-4">
                      <div className="text-3xl font-bold text-yellow-300 min-w-[60px]">
                        [{ans.number}]
                      </div>
                      <div className="text-left">
                        <div className="text-white text-lg">&quot;{ans.answer}&quot;</div>
                        <div className="text-white/50 text-sm">{ans.playerName}</div>
                      </div>
                    </div>
                    {ans.isCorrect === true && (
                      <div className="text-green-400 text-xl">✓</div>
                    )}
                    {ans.isCorrect === false && (
                      <div className="text-red-400 text-xl">✗</div>
                    )}
                  </div>
                ))}

                {/* เลขที่ยังไม่ได้เปิด */}
                {playerAnswers
                  .filter((a) => !a.isRevealed)
                  .sort((a, b) => a.number - b.number)
                  .map((ans, i) => (
                    <div
                      key={`unrevealed-${i}`}
                      className="bg-white/5 rounded-xl p-4 flex items-center justify-between border border-white/10"
                    >
                      <div className="flex items-center gap-4">
                        <div className="text-3xl font-bold text-gray-400 min-w-[60px]">
                          [{ans.number}]
                        </div>
                        <div className="text-left">
                          <div className="text-gray-400 text-lg">&quot;{ans.answer}&quot;</div>
                          <div className="text-gray-500 text-sm">{ans.playerName}</div>
                        </div>
                      </div>
                      <div className="text-gray-500 text-sm">ยังไม่เปิด</div>
                    </div>
                  ))}
              </div>
            </div>

            {/* Progress & Hearts */}
            <div className="bg-white/5 rounded-2xl p-6 mb-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <div className="text-white/70 text-sm">ความคืบหน้า:</div>
                  <div className="text-2xl font-bold text-yellow-300">
                    รอบ {gameState.currentLevel} / {gameState.totalLevels}
                  </div>
                </div>
                <div>
                  <div className="text-white/70 text-sm text-center mb-1">หัวใจคงเหลือ</div>
                  <div className="flex gap-1">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <div
                        key={i}
                        className={`text-3xl ${
                          i < gameState.hearts ? 'text-red-500' : 'text-gray-600 opacity-30'
                        }`}
                      >
                        ❤️
                      </div>
                    ))}
                  </div>
                  <div className="text-xl font-bold text-white text-center">
                    {gameState.hearts} / 3
                  </div>
                </div>
              </div>

              {gameState.currentLevel < gameState.totalLevels && (
                <div className="pt-4 border-t border-white/20 text-center">
                  <div className="text-white/90 font-semibold">
                    รอบถัดไป: คนละ {gameState.currentLevel + 1} เลข
                  </div>
                </div>
              )}
            </div>

            {/* สถานะผู้เล่น */}
            <div className="bg-white/5 rounded-2xl p-6 mb-6">
              <h4 className="text-white font-bold mb-3 text-center">สถานะผู้เล่น</h4>
              <div className="text-center text-white/70 mb-4">
                {readyCount} / {totalPlayers} คนพร้อมแล้ว
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* พร้อมแล้ว */}
                <div>
                  <div className="text-green-400 text-sm mb-2 text-center">✅ พร้อมแล้ว</div>
                  <div className="space-y-1">
                    {readyPlayers.map((r) => (
                      <div key={r.playerId} className="text-white/80 text-sm text-center bg-green-500/20 rounded py-1">
                        {r.playerName}
                      </div>
                    ))}
                  </div>
                </div>

                {/* รออยู่ */}
                <div>
                  <div className="text-orange-400 text-sm mb-2 text-center">⏳ รออยู่</div>
                  <div className="space-y-1">
                    {notReadyPlayers.map((id) => (
                      <div key={id} className="text-white/50 text-sm text-center bg-orange-500/20 rounded py-1">
                        {playerNames[id]}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* ปุ่ม */}
            {!isPlayerReady ? (
              <button
                onClick={handleReady}
                disabled={submitting}
                className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 disabled:from-gray-500 disabled:to-gray-600 disabled:cursor-not-allowed text-white text-xl font-bold py-4 rounded-xl transition-all transform hover:scale-105"
              >
                {submitting ? 'กำลังบันทึก...' : gameState.currentLevel >= gameState.totalLevels ? 'พร้อมดูผลลัพธ์' : 'พร้อมไปรอบถัดไป'}
              </button>
            ) : (
              <div className="text-center py-4">
                <div className="text-green-400 text-2xl font-bold mb-2">✓ คุณพร้อมแล้ว</div>
                <div className="text-white/70">รอผู้เล่นคนอื่น...</div>
              </div>
            )}
          </div>
        );
      })()}

      {/* Phase: Finished */}
      {gameState.phase === 'finished' && (
        <div className="bg-white/10 backdrop-blur-lg rounded-3xl shadow-2xl p-12 border border-white/20 text-center">
          {gameState.status === 'won' ? (
            <>
              <div className="text-8xl mb-6 animate-bounce">🎉</div>
              <h3 className="text-4xl font-bold text-green-400 mb-4">ชนะแล้ว!</h3>
              <p className="text-white/90 text-xl mb-6">คุณและเพื่อนๆ ผ่านเกมได้สำเร็จ</p>
            </>
          ) : (
            <>
              <div className="text-8xl mb-6">💔</div>
              <h3 className="text-4xl font-bold text-red-400 mb-4">แพ้แล้ว</h3>
              <p className="text-white/90 text-xl mb-6">หัวใจหมดแล้ว ลองใหม่อีกครั้งนะ!</p>
            </>
          )}

          {/* Summary Box */}
          <div className="bg-white/5 rounded-2xl p-8 mb-8 max-w-md mx-auto">
            <h4 className="text-2xl font-bold text-white mb-6">สรุปผล</h4>

            {/* Hearts */}
            <div className="mb-6">
              <div className="text-white/70 mb-2">หัวใจคงเหลือ:</div>
              <div className="flex justify-center gap-2 mb-2">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div
                    key={i}
                    className={`text-5xl ${
                      i < gameState.hearts ? 'text-red-500' : 'text-gray-600 opacity-30'
                    }`}
                  >
                    ❤️
                  </div>
                ))}
              </div>
              <div className="text-3xl font-bold text-yellow-300">
                {gameState.hearts} / 3
              </div>
            </div>

            {/* Rounds */}
            <div className="mb-6">
              <div className="text-white/70 mb-2">เลขที่เปิดแล้ว:</div>
              <div className="text-2xl font-bold text-white">
                {gameState.revealedNumbers.length} / {gameState.totalRounds}
              </div>
            </div>

            {/* Result */}
            <div className="pt-6 border-t border-white/20">
              <div className="text-3xl font-bold">
                {gameState.status === 'won' ? (
                  <span className="text-green-400">✅ ชนะ</span>
                ) : (
                  <span className="text-red-400">❌ แพ้</span>
                )}
              </div>
            </div>
          </div>

          {/* Show all numbers (revealed + unrevealed) */}
          <div className="mt-8 max-w-2xl mx-auto">
            <h4 className="text-xl font-bold text-white mb-4">ตัวเลขทั้งหมด:</h4>
            <div className="space-y-3">
              {/* เลขที่เปิดแล้ว */}
              {playerAnswers
                .filter((a) => a.isRevealed)
                .sort((a, b) => a.number - b.number)
                .map((ans, i) => (
                  <div
                    key={i}
                    className="bg-white/10 rounded-xl p-4 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-4">
                      <div className="text-3xl font-bold text-yellow-300 min-w-[60px]">
                        [{ans.number}]
                      </div>
                      <div className="text-left">
                        <div className="text-white text-lg">&quot;{ans.answer}&quot;</div>
                        <div className="text-white/50 text-sm">{ans.playerName}</div>
                      </div>
                    </div>
                    {ans.isCorrect === true && (
                      <div className="text-green-400 text-2xl">✓</div>
                    )}
                    {ans.isCorrect === false && (
                      <div className="text-red-400 text-2xl">✗</div>
                    )}
                  </div>
                ))}

              {/* เลขที่ยังไม่ได้เปิด */}
              {playerAnswers
                .filter((a) => !a.isRevealed)
                .sort((a, b) => a.number - b.number)
                .map((ans, i) => (
                  <div
                    key={`unrevealed-${i}`}
                    className="bg-white/5 rounded-xl p-4 flex items-center justify-between border border-white/10"
                  >
                    <div className="flex items-center gap-4">
                      <div className="text-3xl font-bold text-gray-400 min-w-[60px]">
                        [{ans.number}]
                      </div>
                      <div className="text-left">
                        <div className="text-gray-400 text-lg">&quot;{ans.answer}&quot;</div>
                        <div className="text-gray-500 text-sm">{ans.playerName}</div>
                      </div>
                    </div>
                    <div className="text-gray-500 text-sm">ไม่ได้เปิด</div>
                  </div>
                ))}
            </div>
          </div>

          {/* ปุ่มกลับหน้าหลัก */}
          <div className="mt-8 flex justify-center gap-4">
            <button
              onClick={() => window.location.href = '/'}
              className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white text-lg font-bold px-8 py-4 rounded-xl transition-all transform hover:scale-105"
            >
              กลับหน้าหลัก
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
