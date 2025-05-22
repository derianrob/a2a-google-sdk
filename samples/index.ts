import { createFinancialAdvisorServer } from "./agents/financial-advisor";
import { createStudentServer } from "./agents/student";

async function main() {
  try {
    // Start both servers
    const [financialAdvisorServer, studentServer] = await Promise.all([
      createFinancialAdvisorServer(),
      createStudentServer(),
    ]);

    console.log("Both agents are running and ready to communicate!");
    console.log("Use the following endpoints to interact with the agents:");
    console.log("Financial Advisor: http://localhost:3001");
    console.log("Student: http://localhost:3002");
  } catch (error) {
    console.error("Failed to start servers:", error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}
