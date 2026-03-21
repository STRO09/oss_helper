// talks to GitHub API
//Fetched raw github issues. zero filtering. zero shaping.
//what endpoint will i call?
// API GET /search/issues
//search for open recent issues

//what params will i pass?
// q → the search query string, sort=updated, order=desc(latest activity first), per_page=to controler payload size
//auth token in headers, not params

//what will the function return?
// An array of raw GitHub issue objects, untouched

const axios = require("axios");
const { response } = require("express");
let isGithubTokenValidated = false;

const github_api_base = "https://api.github.com";

async function fetchOpenIssues(pageNumber = 1) {
  const token = process.env.GITHUB_TOKEN;

  if (!token) {
    throw new Error("Github token not found in env variables");
  }

  //token check
  if (!isGithubTokenValidated) {
    try {
      const resposne = await axios.get(`${github_api_base}/user`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      isGithubTokenValidated = true;
    } catch (error) {
      throw new Error("Github token in either expired or doesn't have scope");
    }
  }

  // const query = ["is:issue", "is:open", "no:assignee"].join(" ");
  const query = [
    "is:issue",
    "is:open",
    "stars:>50",
    "comments:0..20",
    "created:>=2025-12-01",
  ].join(" ");

  try {
    const response = await axios.get(`${github_api_base}/search/issues`, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github+json",
      },

      params: {
        q: query,
        sort: "updated",
        order: "desc",
        per_page: 10,
        page: pageNumber,
      },
    });

    const issues = response.data.items;
    console.log(`Fetched ${issues.length} issues from github`);

    return issues;
  } catch (error) {
    console.error("Error fetching GitHub issues:");
    console.error(error.response?.data || error.message);
    throw error;
  }
}

async function fetchRepoOfIssue(username, repoName) {
  const token = process.env.GITHUB_TOKEN;

  if (!token) {
    throw new Error("Config error: github token is missing from env file.");
  }

  //token check
  if (!isGithubTokenValidated) {
    throw new Error("Github token in either expired or doesn't have scope");
  }

  //REPO API call
  try {
    const response = await axios.get(
      `${github_api_base}/repos/${username}/${repoName}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/vnd.github+json",
        },
      },
    );

    return {
      primary_language: response.data.language,
      stars: response.data.stargazers_count,
    };
  } catch (error) {
    console.error(
      `Error fetching repo details for ${username}/${repoName}:`,
      error.message,
    );
    return null;
  }
}

async function fetchLangOfRepo(userName, repoName) {
  const token = process.env.GITHUB_TOKEN;

  if (!token) {
    throw new Error("Config error: github token is missing from env file.");
  }

  //token check
  if (!isGithubTokenValidated) {
    throw new Error("Github token in either expired or doesn't have scope");
  }

  try {
    const response = await axios.get(
      `${github_api_base}/repos/${userName}/${repoName}/languages`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: `application/vnd.github+json`,
        },
      },
    );

    //need to learn about this concept
    const rawData = response.data;
    const totalBytes = Object.values(rawData).reduce((acc, b) => acc + b, 0);

    return Object.entries(rawData).map(([name, bytes]) => ({
      name: name,
      percent: totalBytes > 0 ? (bytes / totalBytes) * 100 : 0,
    }));
  } catch (error) {
    console.error(
      `Error fetching languages for ${userName}/${repoName}:`,
      error.message,
    );
    return null;
  }
}

module.exports = { fetchOpenIssues, fetchRepoOfIssue, fetchLangOfRepo };
