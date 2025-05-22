import { createSummarizerServer } from "./agents/financial-advisor";
import { createTranslatorServer } from "./agents/student";
import { createReformulatorServer } from "./agents/coordinator";

async function main() {
  try {
    // Create all servers
    const [summarizerServer, translatorServer, reformulatorServer] =
      await Promise.all([
        createSummarizerServer(),
        createTranslatorServer(),
        createReformulatorServer(),
      ]);

    // Start all servers
    await Promise.all([
      summarizerServer.start(3001),
      translatorServer.start(3002),
      reformulatorServer.start(3003),
    ]);

    console.log("All agents are running and ready to communicate!");
    console.log("Use the following endpoints to interact with the agents:");
    console.log("Financial Advisor: http://localhost:3001");
    console.log("Student: http://localhost:3002");
    console.log("Coordinator: http://localhost:3003");
    console.log(
      "\nExample: Send a POST request to http://localhost:3003 with:"
    );
  } catch (error) {
    console.error("Failed to start servers:", error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}
