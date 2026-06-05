export type LockInLevelProgress = {
  totalPoints: number;
  currentLevel: number;
  currentXP: number;
  nextLevel: number;
  nextRequirement: number;
  nextLevelBonus: number;
  progressPercent: number;
};

export function getNextLevelRequirement(currentLevel: number) {
  const level = Math.max(1, Math.floor(Number(currentLevel) || 1));
  return 7 + level * 10;
}

export function calculateLockInLevel(totalPoints: number): LockInLevelProgress {
  let remainingPoints = Math.max(0, Math.floor(Number(totalPoints) || 0));
  let currentLevel = 1;
  let nextRequirement = getNextLevelRequirement(currentLevel);

  while (remainingPoints >= nextRequirement) {
    remainingPoints -= nextRequirement;
    currentLevel += 1;
    nextRequirement = getNextLevelRequirement(currentLevel);
  }

  const progressPercent = nextRequirement > 0 ? Math.min(100, Math.max(0, (remainingPoints / nextRequirement) * 100)) : 0;
  const nextLevel = currentLevel + 1;

  return {
    totalPoints: Math.max(0, Math.floor(Number(totalPoints) || 0)),
    currentLevel,
    currentXP: remainingPoints,
    nextLevel,
    nextRequirement,
    nextLevelBonus: nextLevel,
    progressPercent
  };
}
