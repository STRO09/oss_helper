function computeAndReturnCrowdScore(issue) {
  const commentCount = issue.comment_count;
  return 1 / (1 + Math.log(1 + commentCount));
}

module.exports = { computeAndReturnCrowdScore };
