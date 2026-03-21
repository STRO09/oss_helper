const { ingestIssue } = require("./ingestIssues");
const path = require("path");
const dotenv = require("dotenv");
const { connectDB } = require("../config/db");
const { computeSignalForAllIssues } = require("../signals/computeSignal");
const { rankIssue } = require("../scoring/rankIssues");
const totalPagesToFetch = 3;

dotenv.config({ path: path.resolve(__dirname, "../../.env") });

async function run() {
  await connectDB();

  for (let i = 1; i <= totalPagesToFetch; i++) {
    console.log(`Fetching Page ${i}...`);
    await ingestIssue(i);

    if (i < totalPagesToFetch) {
      console.log("Waiting for rate limit safety...");
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }
  }

  await computeSignalForAllIssues();
  // const skills = ["JavaScript", "C++", "Java"];
  // const myProfile = [
  //   { name: "javascript", level: "beginner" },
  //   { name: "docker", level: "intermediate" },
  // ];
  // const rank = await rankIssue(myProfile);
  // console.table(rank.slice(0, 5));
  // console.log(JSON.stringify(rank, null, 2));
  process.exit(0);
}

run();
