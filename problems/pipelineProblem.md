GitHub Issue Recommender: Development Log
Date: March 17, 2026
Subject: Resolving the "Blind Scoring" Problem (Data Enrichment Phase)

🛑 THE PROBLEM: The Data Pipeline Gap
Currently, the ingestion engine uses the GET /search/issues API. While great for finding issues, this endpoint is "repo-blind."

The Symptom: In the database, the primary_language field for repositories is consistently null.

The Impact: The Stack Match Score (the core logic that connects an issue to a user’s skills) is broken. We are trying to recommend issues without knowing if they are written in JavaScript, Python, or C++.

The Technical Cause: The Search API optimizes for issue content but strips out repository metadata (stars, primary language, etc.) to keep the payload light.

🛠 THE SOLUTION: Two-Stage Ingestion (Enrichment Pattern)
To fix the scoring, the backend architecture must evolve from a "Direct Store" model to an "Enrichment" model. We cannot rely on a single API call to provide all the signals needed for a high-quality recommendation.

Phase 1: Lightweight Extraction (Current)
Call /search/issues to get the raw list of potential contributions.

Normalize the data to extract the owner and repo_name.

Phase 2: Metadata Enrichment (The Upgrade)
Action: For every new repository discovered, trigger a secondary call to GET /repos/{owner}/{repo}.

Data Captured: Retrieve language, stargazers_count, and open_issues_count.

Result: Populate the primary_language field in the database, enabling the userPreference logic to function.

📈 STRATEGY FOR V1
To handle GitHub's rate limits (60/hr for unauthenticated, 5000/hr for authenticated), the enrichment will follow these rules:

Lazy Loading: Only fetch repository details if they don't already exist in our DB.

Decoupled Logic: The normaliseIssue function remains a pure function, while a separate "Enrichment Service" handles the secondary API calls.

Indexing: Ensure issue_id and repo_id are indexed in MongoDB to keep the join (or two-step fetch) fast.

💡 NEXT STEPS
Update the Repo model schema to ensure primary_language is indexed.

Implement a helper function enrichRepoData(owner, repo) using the GitHub Repo API.

Re-run the scoring algorithm to verify that stack_match_score now accurately reflects the user's tech stack.
