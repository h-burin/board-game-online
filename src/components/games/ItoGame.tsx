/**
 * ITO Game Component
 * เกมความสามัคคี - เรียงลำดับตัวเลขโดยการสื่อสาร
 */

'use client';

import { useState, useEffect } from 'react';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { useItoGame } from '@/lib/hooks/useItoGame';
import { useVotes } from '@/lib/hooks/useVotes';
import { submitPlayerAnswer, submitVote, checkAllAnswersSubmitted, startVotingPhase } from '@/lib/firebase/ito';

interface ItoGameProps {
  sessionId: string;
  playerId: string;
}

export default function ItoGame({ sessionId, playerId }: ItoGameProps) {
  const { gameState, playerAnswers, myAnswer, loading } = useItoGame(sessionId, playerId);
  const { votes, voteCount } = useVotes(sessionId);

  const [answer, setAnswer] = useState('');
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [revealing, setRevealing] = useState(false);

  // Auto-fill answer if already submitted
  useEffect(() => {
    if (myAnswer?.answer) {
      setAnswer(myAnswer.answer);
    }
  }, [myAnswer]);

  // Handle submit answer
  const handleSubmitAnswer = async () => {
    if (!answer.trim() || !gameState || submitting) return;

    setSubmitting(true);
    const success = await submitPlayerAnswer(sessionId, playerId, answer.trim());

    if (success) {
      console.log('✅ Answer submitted successfully');
    } else {
      alert('เกิดข้อผิดพลาดในการส่งคำตอบ');
    }
    setSubmitting(false);
  };

  // Handle submit vote
  const handleSubmitVote = async () => {
    if (!selectedPlayerId || submitting) return;

    setSubmitting(true);
    const success = await submitVote(sessionId, playerId, selectedPlayerId);

    if (success) {
      console.log('✅ Vote submitted successfully');
      setSelectedPlayerId(null);
    } else {
      alert('เกิดข้อผิดพลาดในการโหวต');
    }
    setSubmitting(false);
  };

  // Auto-check if all answers submitted (Writing phase)
  useEffect(() => {
    if (!gameState || gameState.phase !== 'writing' || revealing) return;

    const checkAnswers = async () => {
      const allSubmitted = await checkAllAnswersSubmitted(sessionId);
      if (allSubmitted) {
        console.log('✅ All answers submitted, moving to voting phase');
        setRevealing(true);
        await startVotingPhase(sessionId);
        setRevealing(false);
      }
    };

    checkAnswers();
  }, [gameState, playerAnswers, sessionId, revealing]);

  // Auto-check if all votes submitted (Voting phase)
  useEffect(() => {
    if (!gameState || gameState.phase !== 'voting' || revealing) return;

    // ผู้เล่นทั้งหมด (ไม่ใช่แค่คำใบ้ที่ยังไม่เปิด)
    const totalPlayers = playerAnswers.length;

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

    setRevealing(true);
    try {
      const response = await fetch(`/api/games/ito/${sessionId}/reveal`, {
        method: 'POST',
      });

      const data = await response.json();

      if (data.success) {
        console.log('✅ Votes revealed:', data);
        // Phase จะเปลี่ยนเป็น 'reveal' อัตโนมัติจาก Firebase
        // ไม่ต้องทำอะไร รอ useEffect จัดการต่อ
      } else {
        console.error('❌ Failed to reveal votes:', data.error);
      }
    } catch (error) {
      console.error('❌ Error revealing votes:', error);
    } finally {
      setTimeout(() => setRevealing(false), 2000);
    }
  };

  // Auto-transition from reveal phase to voting or finished
  useEffect(() => {
    if (!gameState || gameState.phase !== 'reveal') return;

    const timer = setTimeout(async () => {
      // ตรวจสอบว่าเกมจบหรือยัง
      if (gameState.status === 'won' || gameState.status === 'lost') {
        // เปลี่ยนเป็น finished
        const sessionRef = doc(db, 'game_sessions', sessionId);
        await updateDoc(sessionRef, {
          phase: 'finished',
          updatedAt: serverTimestamp(),
        });
      } else {
        // เกมยังไม่จบ กลับไป voting phase
        await startVotingPhase(sessionId);
      }
    }, 5000); // แสดงผล 5 วินาที

    return () => clearTimeout(timer);
  }, [gameState, sessionId]);

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
            <p className="text-blue-200">รอบ {gameState.currentRound}/{gameState.totalRounds}</p>
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
              {gameState.phase === 'writing' ? 'เวลาพิมพ์คำใบ้' : 'เวลาโหวต'}
            </div>
          </div>
        )}
      </div>

      {/* Question */}
      <div className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 backdrop-blur-lg rounded-3xl shadow-2xl p-8 border border-white/20">
        <h3 className="text-lg text-white/70 mb-2">โจทย์:</h3>
        <p className="text-3xl font-bold text-white">{gameState.questionText}</p>
      </div>

      {/* My Number */}
      {myAnswer && (
        <div className="bg-yellow-500/20 backdrop-blur-lg rounded-3xl shadow-2xl p-6 border-2 border-yellow-400">
          <div className="text-center">
            <p className="text-white/70 mb-2">เลขของคุณ:</p>
            <div className="text-6xl font-bold text-yellow-300">{myAnswer.number}</div>
          </div>
        </div>
      )}

      {/* Phase: Writing */}
      {gameState.phase === 'writing' && (
        <div className="bg-white/10 backdrop-blur-lg rounded-3xl shadow-2xl p-8 border border-white/20">
          <h3 className="text-2xl font-bold text-white mb-4">พิมพ์คำใบ้ของคุณ</h3>
          <p className="text-white/70 mb-4">
            ให้คำใบ้ที่สื่อถึงตัวเลขของคุณ โดยไม่ต้องบอกตัวเลข
          </p>

          <textarea
            className="w-full p-4 rounded-xl bg-white/10 text-white border border-white/20 focus:border-white/50 focus:outline-none resize-none"
            rows={3}
            placeholder="พิมพ์คำใบ้ที่นี่..."
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            disabled={!!myAnswer?.submittedAt}
          />

          {!myAnswer?.submittedAt ? (
            <button
              onClick={handleSubmitAnswer}
              disabled={!answer.trim() || submitting}
              className="mt-4 w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 disabled:from-gray-500 disabled:to-gray-600 disabled:cursor-not-allowed text-white text-xl font-bold py-4 rounded-xl transition-all transform hover:scale-105"
            >
              {submitting ? 'กำลังส่ง...' : 'ส่งคำตอบ'}
            </button>
          ) : (
            <div className="mt-4 text-center text-green-400 font-bold">
              ✓ ส่งคำตอบแล้ว รอผู้เล่นคนอื่น...
            </div>
          )}
        </div>
      )}

      {/* Phase: Voting */}
      {gameState.phase === 'voting' && (() => {
        // คำนวณว่าใครโหวตแล้วบ้าง (ทุกคนต้องโหวต ไม่ว่าคำใบ้ของตัวเองจะถูกเปิดแล้วหรือไม่)
        const allPlayers = playerAnswers;
        const votedPlayerIds = votes.map((v) => v.playerId);
        const playersWhoVoted = allPlayers.filter((p) => votedPlayerIds.includes(p.playerId));
        const playersWhoNotVoted = allPlayers.filter((p) => !votedPlayerIds.includes(p.playerId));

        return (
          <div className="bg-white/10 backdrop-blur-lg rounded-3xl shadow-2xl p-8 border border-white/20">
            <h3 className="text-2xl font-bold text-white mb-4">เลือกคำใบ้ที่น้อยที่สุด</h3>
            <p className="text-white/70 mb-4">
              คลิกเลือกคำใบ้ที่คุณคิดว่าสื่อถึงตัวเลขที่น้อยที่สุด
            </p>

            {/* สถานะการโหวต */}
            <div className="bg-white/5 rounded-xl p-4 mb-6">
              <div className="flex items-center justify-between mb-3">
                <div className="text-white font-semibold">
                  สถานะการโหวต: {voteCount} / {allPlayers.length}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* โหวตแล้ว */}
                <div>
                  <div className="text-green-400 text-sm mb-2">✓ โหวตแล้ว ({playersWhoVoted.length})</div>
                  <div className="space-y-1">
                    {playersWhoVoted.map((p) => (
                      <div key={p.playerId} className="text-white/70 text-sm">
                        • {p.playerName}
                      </div>
                    ))}
                  </div>
                </div>

                {/* ยังไม่โหวต */}
                <div>
                  <div className="text-orange-400 text-sm mb-2">⏳ รอโหวต ({playersWhoNotVoted.length})</div>
                  <div className="space-y-1">
                    {playersWhoNotVoted.map((p) => (
                      <div key={p.playerId} className="text-white/50 text-sm">
                        • {p.playerName}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {playerAnswers
              .filter((a) => !a.isRevealed && a.answer.trim() !== '')
              .map((playerAnswer) => (
                <button
                  key={playerAnswer.playerId}
                  onClick={() => setSelectedPlayerId(playerAnswer.playerId)}
                  className={`p-6 rounded-2xl border-2 transition-all cursor-pointer ${
                    selectedPlayerId === playerAnswer.playerId
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
              ))}
          </div>

            <button
              onClick={handleSubmitVote}
              disabled={!selectedPlayerId || submitting}
              className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 disabled:from-gray-500 disabled:to-gray-600 disabled:cursor-not-allowed text-white text-xl font-bold py-4 rounded-xl transition-all transform hover:scale-105"
            >
              {submitting ? 'กำลังส่ง...' : 'ยืนยันการเลือก'}
            </button>
          </div>
        );
      })()}

      {/* Phase: Reveal */}
      {gameState.phase === 'reveal' && (() => {
        // Find the last revealed player answer
        const lastRevealed = playerAnswers.find(
          (a) => a.isRevealed && a.number === gameState.revealedNumbers[gameState.revealedNumbers.length - 1]
        );

        if (!lastRevealed) return null;

        // Check if this was the correct choice
        // หมายเหตุ: ตอนนี้ lastRevealed ถูก mark เป็น isRevealed = true แล้ว
        // ต้องเช็คว่า lastRevealed.number เป็นตัวที่เล็กที่สุดใน (unrevealed + lastRevealed) หรือไม่
        const unrevealedNumbers = playerAnswers
          .filter((a) => !a.isRevealed)
          .map((a) => a.number);

        // รวม lastRevealed.number เข้าไปด้วยเพื่อเปรียบเทียบ
        const numbersBeforeReveal = [...unrevealedNumbers, lastRevealed.number];
        const smallestBeforeReveal = Math.min(...numbersBeforeReveal);
        const isCorrect = lastRevealed.number === smallestBeforeReveal;

        console.log('🔍 UI Reveal check:', {
          lastRevealedNumber: lastRevealed.number,
          unrevealedNumbers,
          numbersBeforeReveal,
          smallestBeforeReveal,
          isCorrect,
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
                    ข้ามตัวเลขไป - เสียหัวใจ
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
              <div className="text-white/70 mb-2">รอบที่เล่น:</div>
              <div className="text-2xl font-bold text-white">
                {gameState.currentRound - 1} / {gameState.totalRounds}
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

          {/* Show revealed numbers */}
          <div className="mt-8">
            <h4 className="text-xl font-bold text-white mb-4">ลำดับตัวเลขที่เปิด:</h4>
            <div className="flex flex-wrap justify-center gap-3">
              {gameState.revealedNumbers.map((num, i) => (
                <div
                  key={i}
                  className="bg-white/20 px-6 py-3 rounded-xl text-2xl font-bold text-white"
                >
                  {num}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
