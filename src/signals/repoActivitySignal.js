function computeAndReturnRepoActivityScore(repo) {
  const now = Date.now();
  const updatedAt = new Date(repo.last_activity_at);

  const diffDays = (now - updatedAt) / (1000 * 60 * 60 * 24);

  return Math.max(0, 1 - diffDays / 45);
}

module.exports = { computeAndReturnRepoActivityScore };
