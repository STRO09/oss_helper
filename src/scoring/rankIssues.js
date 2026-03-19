const issueModel = require("../models/issue");
const repoModel = require("../models/repository");
const signalModel = require("../models/signal");

async function rankIssue(userPreference) {
  const issues = await issueModel.find();
  const repos = await repoModel.find();
  const signals = await signalModel.find();

  //making map for fast lookup rather than using db calls
  const signalMap = new Map();
  const repoMap = new Map();
  const ranked = [];

  for (const signal of signals) {
    signalMap.set(String(signal.issue_id), signal);
  }

  for (const repo of repos) {
    repoMap.set(String(repo.repo_id), repo);
  }

  for (const issue of issues) {
    let stackMatch = 0;

    const signal = signalMap.get(String(issue.issue_id));
    const repo = repoMap.get(String(issue.repo_id));

    if (!signal || !repo) continue;

    if (userPreference.length > 0 && repo.primary_language) {
      repo.primary_language.forEach((langObj) => {
        if (userPreference.includes(langObj.name)) {
          stackMatch += langObj.percent; //not good enough logic
        }
      });
    }

    stackMatch = stackMatch / 100;

    const freshness = signal.freshness_score || 0;
    const crowd = signal.crowd_score || 0;
    const repoActivity = signal.repo_activity_score || 0;
    const labelIntent = signal.label_intent_score || 0;

    const score =
      freshness * 0.25 +
      crowd * 0.25 +
      repoActivity * 0.2 +
      labelIntent * 0.1 +
      stackMatch * 0.2;

    ranked.push({
      issue_id: issue.issue_id,
      title: issue.title,
      repo: repo.full_name,
      score: Number(score.toFixed(4)),
      explanation: {
        freshness,
        crowd,
        repoActivity,
        labelIntent,
        stackMatch: Number(stackMatch.toFixed(4)),
      },
    });
  }

  //sort
  ranked.sort((a, b) => b.score - a.score);

  return ranked;
}

module.exports = { rankIssue };
