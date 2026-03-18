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
  const skills = ["JavaScript", "C++", "Java"];
  const rank = await rankIssue(skills);
  // console.table(rank.slice(0, 5));
  console.log(JSON.stringify(rank, null, 2));
  process.exit(0);
}

run();
