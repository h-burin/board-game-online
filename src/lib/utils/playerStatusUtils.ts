/**
 * Player Status Utilities
 * คำนวณสถานะของผู้เล่น
 */

type ItoPlayerAnswer = {
  playerId: string;
  playerName: string;
  answer: string;
  submittedAt?: Date;
};

export interface PlayerSubmissionStatus {
  [key: string]: {
    playerName: string;
    submittedCount: number;
    totalExpected: number;
  };
}

/**
 * คำนวณสถานะการส่งคำใบ้ของผู้เล่น
 */
export function calculatePlayerSubmissionStatus(
  playerAnswers: ItoPlayerAnswer[],
  expectedAnswersPerPlayer: number
): PlayerSubmissionStatus {
  const uniquePlayerIds = Array.from(
    new Set(playerAnswers.map((a) => a.playerId))
  );

  const playerSubmissionStatus: PlayerSubmissionStatus = {};

  uniquePlayerIds.forEach((id) => {
    const playerAnswersForThisPlayer = playerAnswers.filter(
      (a) => a.playerId === id
    );
    const submittedCount = playerAnswersForThisPlayer.filter(
      (a) => a.submittedAt
    ).length;
    const playerName =
      playerAnswersForThisPlayer[0]?.playerName || "Unknown";

    playerSubmissionStatus[id] = {
      playerName,
      submittedCount,
      totalExpected: expectedAnswersPerPlayer,
    };
  });

  return playerSubmissionStatus;
}

/**
 * คำนวณสถานะการพิมพ์คำใบ้ของผู้เล่น (voting phase)
 */
export function calculatePlayerHintStatus(
  playerAnswers: ItoPlayerAnswer[],
  expectedAnswersPerPlayer: number
): PlayerSubmissionStatus {
  const uniquePlayerIds = Array.from(
    new Set(playerAnswers.map((a) => a.playerId))
  );

  const playerSubmissionStatus: PlayerSubmissionStatus = {};

  uniquePlayerIds.forEach((id) => {
    const playerAnswersForThisPlayer = playerAnswers.filter(
      (a) => a.playerId === id
    );
    const submittedCount = playerAnswersForThisPlayer.filter(
      (a) => a.answer.trim() !== ""
    ).length;
    const playerName =
      playerAnswersForThisPlayer[0]?.playerName || "Unknown";

    playerSubmissionStatus[id] = {
      playerName,
      submittedCount,
      totalExpected: expectedAnswersPerPlayer,
    };
  });

  return playerSubmissionStatus;
}

/**
 * แยกผู้เล่นที่ส่งครบและยังส่งไม่ครบ
 */
export function separateCompletedPlayers(
  playerSubmissionStatus: PlayerSubmissionStatus
) {
  const playersCompleted = Object.values(playerSubmissionStatus).filter(
    (p) => p.submittedCount === p.totalExpected
  );
  const playersNotCompleted = Object.entries(playerSubmissionStatus).filter(
    ([, p]) => p.submittedCount < p.totalExpected
  );

  return { playersCompleted, playersNotCompleted };
}
