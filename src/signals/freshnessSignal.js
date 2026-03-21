// derive issue freshness and return score based on the newest issue

function computeAndReturnFreshnessScore(issue) {
  const dateNow = Date.now();
  const repoUpdatedAt = new Date(issue.updated_at);

  const diffDays = (dateNow - repoUpdatedAt) / (1000 * 60 * 60 * 24);
  return Math.max(0, 1 - diffDays / 45);
}

module.exports = { computeAndReturnFreshnessScore };
