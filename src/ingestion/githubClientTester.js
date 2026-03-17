const { ingestIssuse } = require("./ingestIssues");
const path = require("path");
const dotenv = require("dotenv");
const { connectDB } = require("../config/db");
const { computeSignalForAllIssues } = require("../signals/computeSignal");
const { rankIssue } = require("../scoring/rankIssues");

dotenv.config({ path: path.resolve(__dirname, "../../.env") });

async function run() {
  await connectDB();
  await ingestIssuse();
  await computeSignalForAllIssues();
  const rank = await rankIssue();
  console.log(rank);
  process.exit(0);
}

run();
