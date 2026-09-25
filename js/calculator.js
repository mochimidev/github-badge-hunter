/**
 * Badge Calculator Module - Computes progress and unlock states for GitHub Achievements.
 */

export const GOALS = {
  STARSTRUCK: 16,
  PULL_SHARK: 2,
};

/**
 * Calculates Starstruck achievement progress based on repository stars.
 * @param {Array} repos - List of GitHub repositories
 * @returns {object} Progress calculation details
 */
export function calculateStarstruckProgress(repos = []) {
  const target = GOALS.STARSTRUCK;

  // Sum all stars across the user's public repositories
  const currentStars = repos.reduce((acc, repo) => {
    return acc + (repo.stargazers_count || 0);
  }, 0);

  const rawPercentage = (currentStars / target) * 100;
  const clampedPercentage = Math.min(100, Math.max(0, rawPercentage));
  const isUnlocked = currentStars >= target;
  const remaining = Math.max(0, target - currentStars);

  return {
    badgeName: 'Starstruck',
    target,
    current: currentStars,
    percentage: Math.round(rawPercentage * 10) / 10,
    clampedPercentage: Math.round(clampedPercentage * 10) / 10,
    isUnlocked,
    remaining,
    statusText: isUnlocked
      ? `¡Logro desbloqueado! Cuentas con ${currentStars} estrellas (meta: ${target}).`
      : `Faltan ${remaining} ${remaining === 1 ? 'estrella' : 'estrellas'} para desbloquear.`
  };
}

/**
 * Calculates Pull Shark achievement progress based on merged PR count.
 * @param {number} mergedCount - Number of merged pull requests
 * @returns {object} Progress calculation details
 */
export function calculatePullSharkProgress(mergedCount = 0) {
  const target = GOALS.PULL_SHARK;
  const currentPRs = typeof mergedCount === 'number' ? mergedCount : 0;

  const rawPercentage = (currentPRs / target) * 100;
  const clampedPercentage = Math.min(100, Math.max(0, rawPercentage));
  const isUnlocked = currentPRs >= target;
  const remaining = Math.max(0, target - currentPRs);

  return {
    badgeName: 'Pull Shark',
    target,
    current: currentPRs,
    percentage: Math.round(rawPercentage * 10) / 10,
    clampedPercentage: Math.round(clampedPercentage * 10) / 10,
    isUnlocked,
    remaining,
    statusText: isUnlocked
      ? `¡Logro desbloqueado! Tienes ${currentPRs} PRs fusionados (meta: ${target}).`
      : `Faltan ${remaining} ${remaining === 1 ? 'PR fusionado' : 'PRs fusionados'} para desbloquear.`
  };
}

/**
 * Filters and sorts repositories by stars descending.
 * @param {Array} repos 
 * @param {number} limit 
 * @returns {Array}
 */
export function getTopStarredRepos(repos = [], limit = 5) {
  return [...repos]
    .filter(repo => (repo.stargazers_count || 0) > 0)
    .sort((a, b) => (b.stargazers_count || 0) - (a.stargazers_count || 0))
    .slice(0, limit);
}
