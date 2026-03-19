// orchestrates fetching
const {
  fetchOpenIssues,
  fetchRepoOfIssue,
  fetchLangOfRepo,
} = require("./githubClient");
const { normaliseIssue } = require("./issueNormalizer");
const issueModel = require("../models/issue");
const repoModel = require("../models/repository");

async function ingestIssuse() {
  const rawIssues = await fetchOpenIssues();

  //filter out issues with pr because they are most probably solved
  const issuesWithNoPr = rawIssues.filter((e) => !e.pull_request);

  //now normalise these issues
  const normalisedIssuesPairedWithRepo = issuesWithNoPr.map(normaliseIssue);
  let count = 0;

  for (const pair of normalisedIssuesPairedWithRepo) {
    //push that issue

    const { issue, repo } = pair;

    const existingRepo = await repoModel.findOne({ repo_id: repo.repo_id });

    //filling important repo data if the data or repo doesn't exist
    if (
      !existingRepo ||
      existingRepo.primary_language === null ||
      existingRepo.primary_language.length === 0
    ) {
      const [userName, repoName] = repo.repo_id.split("/");
      const [repoStarData, repoLanguage] = await Promise.all([
        fetchRepoOfIssue(userName, repoName),
        fetchLangOfRepo(userName, repoName),
      ]);
      // const repoStarData = await fetchRepoOfIssue(userName, repoName);
      // const repoLanguage = await fetchLangOfRepo(userName, repoName);

      if (repoStarData) {
        // repo.primary_language = repoStarData.primary_language;
        repo.stars = repoStarData.stars;
      }

      if (repoLanguage) {
        repo.primary_language = repoLanguage;
      }
    } else {
      repo.primary_language = existingRepo.primary_language;
      repo.stars = existingRepo.stars || repo.stars;
    }
    //now we will upsert repo so no same repo with different issue gets new entry in db again
    await repoModel.updateOne(
      { repo_id: repo.repo_id },
      { $set: repo },
      { upsert: true },
    );

    //same for issue, we upsert, so no duplicate issue when re running the fetcher
    await issueModel.updateOne(
      { issue_id: issue.issue_id },
      { $set: issue },
      { upsert: true },
    );

    count++;
  }
  console.log(`Ingestion completed to DB ${count} times`);
}

module.exports = { ingestIssuse };
