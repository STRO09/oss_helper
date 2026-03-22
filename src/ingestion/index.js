const path = require("path");
const dotenv = require("dotenv");

const { connectDB } = require("../config/db");

const { ingestIssue } = require("./ingestIssues");
const { computeSignalForAllIssues } = require("../signals/computeSignal");

dotenv.config({ path: path.resolve(__dirname, "../../.env") });

async function runIngestion(totalPagesToFetch = 1) {
  const rateLimitTimeout = 2000;
  try {
    await connectDB();
    console.log("Connected to database...");

    for (let i = 1; i <= totalPagesToFetch; i++) {
      console.log(`Fetching Page ${i}...`);
      await ingestIssue(i);

      if (i < totalPagesToFetch) {
        console.log("Waiting for rate limit safety...");
        await new Promise((resolve) => setTimeout(resolve, rateLimitTimeout));
      }
    }

    console.log("Ingestion completed successfully.");

    console.log("Starting Signal computation for all the ingested issues....");
    await computeSignalForAllIssues();
    console.log("Signal computation completed successfully.");

  } catch (error) {
    console.error("Error during ingestion:", error);
  } finally {
    process.exit(0);
  }
}

const totalPagesToFetch = 15;

if (require.main === module) {
  runIngestion(totalPagesToFetch);
}

module.exports = { runIngestion };
