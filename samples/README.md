# A2A SDK Samples

This directory contains sample implementations using the A2A SDK (Agent-to-Agent Software Development Kit). The current example demonstrates communication between two OpenAI Assistants: a Financial Advisor and a Student seeking financial guidance.

## Project Structure

```
samples/
├── agents/
│   ├── financial-advisor/
│   │   ├── config.ts       # Financial advisor configuration
│   │   └── index.ts        # Financial advisor server implementation
│   └── student/
│       ├── config.ts       # Student configuration
│       └── index.ts        # Student server implementation
├── services/
│   └── openai.service.ts   # Centralized OpenAI API service
├── types/
│   └── assistant.ts        # Shared type definitions
├── index.ts               # Main entry point
└── .env                   # Environment variables
```

## Setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Create a `.env` file in the samples directory with your OpenAI API key:
   ```
   OPENAI_API_KEY=your_api_key_here
   ```

## Running the Example

You can run the agents in different ways:

1. Run both agents simultaneously:

   ```bash
   npm start
   ```

2. Run agents individually:
   - Financial Advisor:
     ```bash
     npm run start:advisor
     ```
   - Student:
     ```bash
     npm run start:student
     ```

## Endpoints

Once running, the agents will be available at:

- Financial Advisor: http://localhost:3001
- Student: http://localhost:3002

## Implementation Details

### OpenAI Service

The `OpenAIService` class in `services/openai.service.ts` centralizes all OpenAI API interactions, including:

- Creating assistants
- Managing threads
- Handling messages
- Running assistants
- Monitoring run status

### Agent Configuration

Each agent has its own configuration file (`config.ts`) that defines:

- Name
- Description
- Instructions/system prompt
- Port number

### Agent Implementation

Each agent's `index.ts` file contains the server implementation using the A2A SDK, including:

- Task handler setup
- Message processing
- OpenAI Assistant integration
- Error handling

## Example Conversation Flow

1. The Student agent can initiate a conversation about financial planning
2. The Financial Advisor agent responds with professional guidance
3. The conversation can cover topics like:
   - Emergency funds
   - Retirement savings
   - Debt management
   - Investment strategies
   - Budgeting tips

## Error Handling

The implementation includes robust error handling for:

- API failures
- Task cancellations
- Invalid messages
- Connection issues
