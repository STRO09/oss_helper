const issueModel = require("../models/issue");
const repoModel = require("../models/repository");
const signalModel = require("../models/signal");

const PROFICIENCY_LEVELS = {
  BEGINNER: 0.2,
  INTERMEDIATE: 0.5,
  ADVANCED: 0.8,
  EXPERT: 1.0,
};

async function rankIssue(userPreference) {
  const issues = await issueModel.find();
  const repos = await repoModel.find();
  const signals = await signalModel.find();

  //making map for fast lookup rather than using db calls
  const signalMap = new Map();
  const repoMap = new Map();
  const ranked = [];

  let proficiency = 0;

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
      repo.primary_language.forEach((repoLangObj) => {
        const userSkill = userPreference.find(
          (u) => u.name.toLowerCase() === repoLangObj.name.toLowerCase(),
        );

        if (userSkill) {
          const multiplier =
            PROFICIENCY_LEVELS[userSkill.level.toUpperCase()] || 0.1;
          // If you know JS (50%) and Docker (30%), stackMatch becomes 0.8
          stackMatch += (repoLangObj.percent / 100) * multiplier;
        }
      });
    }

    //if stack barely matches, skip the issue
    if (stackMatch < 0.01) continue;

    const freshness = signal.freshness_score || 0;
    const crowd = signal.crowd_score || 0;
    const repoActivity = signal.repo_activity_score || 0;
    const labelIntent = signal.label_intent_score || 0;

    const score =
      freshness * 0.2 +
      crowd * 0.2 +
      repoActivity * 0.15 +
      labelIntent * 0.15 +
      stackMatch * 0.3;

    const noise = Math.random() * 0.02;
    const finalScore = score + noise;

    ranked.push({
      url: `https://www.github.com/${repo.full_name}/issues/${issue.number}`,
      title: issue.title,
      repo: repo.full_name,
      score: Number(finalScore.toFixed(4)),
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
