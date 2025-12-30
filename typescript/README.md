<h1 align="center">
  <img width="600" alt="Scorable logo" src="https://scorable.ai/images/scorable-color.svg" loading="lazy">
</h1>

<p align="center" class="large-text">
  <i><strong>Measurement & Control for LLM Automations</strong></i>
</p>

<p align="center">
    <a href="https://www.npmjs.com/package/@root-signals/scorable">
      <img alt="Supported Node.js versions" src="https://img.shields.io/badge/Node.js-18%20to%2022-yellow?style=for-the-badge&logo=node.js&logoColor=yellow">
    </a>
</p>


<p align="center">
  <a href="https://scorable.ai/register">
    <img src="https://img.shields.io/badge/Get_Started-2E6AFB?style=for-the-badge&logo=rocket&logoColor=white&scale=2" />
  </a>

  <a href="https://huggingface.co/root-signals">
    <img src="https://img.shields.io/badge/HuggingFace-FF9D00?style=for-the-badge&logo=huggingface&logoColor=white&scale=2" />
  </a>

  <a href="https://discord.gg/QbDAAmW9yz">
    <img src="https://img.shields.io/badge/Discord-5865F2?style=for-the-badge&logo=discord&logoColor=white&scale=2" />
  </a>

  <a href="https://docs.scorable.ai">
    <img src="https://img.shields.io/badge/Documentation-E53935?style=for-the-badge&logo=readthedocs&logoColor=white&scale=2" />
  </a>

  <a href="https://scorable.ai/demo-user">
    <img src="https://img.shields.io/badge/Temporary_API_Key-15a20b?style=for-the-badge&logo=keycdn&logoColor=white&scale=2" />
  </a>
</p>

**Scorable** streamlines the evaluation of your LLM and agentic pipelines. We provide a holistic approach to GenAI measurability & observability with **carefully-crafted ready-to-use evaluators** based on cutting-edge LLM research as well as a framework for systematically adding **your own custom evaluators**.

With Scorable you can develop your LLM application reliably, deploy them in confidence, and ensure optimal performance with continuous monitoring.

## 📦 Install

```bash
npm install @root-signals/scorable
# or
yarn add @root-signals/scorable
# or  
pnpm add @root-signals/scorable
```

## ⚡ Quickstart

### 🔑 Get Your API Key
[Sign up & create a key](https://scorable.ai/settings/api-keys) or [generate a temporary key](https://scorable.ai/demo-user)

**Setup Option 1: Environment Variable**
```bash
export SCORABLE_API_KEY=your-scorable-api-key
```

**Setup Option 2: `.env` File**
```bash
echo SCORABLE_API_KEY=your-scorable-api-key >> .env
```

### *Root* Evaluators
```typescript
import { Scorable } from '@root-signals/scorable';

// Connect to Scorable API
const client = new Scorable({
  apiKey: process.env.SCORABLE_API_KEY!
});

// Run any of our ready-made evaluators
const result = await client.evaluators.executeByName('Politeness', {
  response: "You can find the instructions from our Careers page."
});

// Example result:
//   {
//     "score": 0.7, --> a normalized score between [0, 1]
//     "justification": "The response is st...",
//     "execution_log_id": "..."
//   }
```

Check the full list of *Root* evaluators from the [Root evaluators documentation](https://docs.scorable.ai/quick-start/usage/evaluators#list-of-evaluators-maintained-by-root-signals). You can also [add your own custom evaluators](#custom-evaluators).

## 📖 Documentation

| Resource | Link |
|----------|------|
| 📘 Product Docs | [View Documentation](https://docs.scorable.ai) |
| 📑 API Docs | [View Documentation](https://api.docs.scorable.ai/) |
| 🐍 Python SDK | [View Documentation](https://github.com/root-signals/python-sdk) |
| 🔌 MCP | [View Repo](https://github.com/root-signals/root-signals-mcp) |


## Examples

### Root Evaluator by Name

```typescript
import { Scorable } from '@root-signals/scorable';

const client = new Scorable({ apiKey: process.env.SCORABLE_API_KEY! });

// Run a scorable evaluator by name using the executeByName method
const result = await client.evaluators.executeByName(
  'Helpfulness',
  {
    response: "You can find the instructions from our Careers page.",
    request: "Where can I find the application instructions?"
  }
);

console.log(`Score: ${result.score} / 1.0`);
console.log(`Justification: ${result.justification}`);

// Run a custom evaluator by name
// Assuming you have created a custom evaluator named "Network Troubleshooting"
try {
  const customResult = await client.evaluators.executeByName(
    'Network Troubleshooting',
    {
      request: "My internet is not working.",
      response: `
        I'm sorry to hear that your internet isn't working.
        Let's troubleshoot this step by step:
        1. Check if your router is powered on and all cables are properly connected
        2. Try restarting your router and modem
        3. Check if other devices can connect to the network
        4. Try connecting to a different network if available
      `
    }
  );

  console.log(`Score: ${customResult.score} / 1.0`);
  console.log(`Justification: ${customResult.justification}`);
} catch (error) {
  console.error(`Error: ${error}`);
  console.log(
    "Note: This example requires that you have previously created a custom evaluator named 'Network Troubleshooting'"
  );
}
```

### Custom Evaluators

```typescript
import { Scorable } from '@root-signals/scorable';

const client = new Scorable({ apiKey: process.env.SCORABLE_API_KEY! });

const networkTroubleshootingEvaluator = await client.evaluators.create({
  name: "Network Troubleshooting",
  predicate: `Assess the response for technical accuracy and appropriateness in the context of network troubleshooting.
            Is the advice technically sound and relevant to the user's question?
            Does the troubleshooting process effectively address the likely causes of the issue?
            Is the proposed solution valid and safe to implement?

            User question: {{request}}

            Chatbot response: {{response}}`,
  intent: "To measure the technical accuracy and appropriateness of network troubleshooting responses",
  model: "gemini-3-flash"  // Check client.models.list() for all available models. You can also add your own model.
});

const response = await networkTroubleshootingEvaluator.execute({
  request: "My internet is not working.",
  response: `
    I'm sorry to hear that your internet isn't working.
    Let's troubleshoot this step by step.
  `,
  // Optional parameters for tracking sessions and users
  user_id: "user-123",
  session_id: "session-456",
  // Optional system prompt used to generate the response
  system_prompt: "You are a technical support agent helping with network issues.",
  // Optional tags for categorizing the evaluation
  tags: ["production", "v0.1"]
});

console.log(response.score);
console.log(response.justification);
```

### Simple Judge

```typescript
import { Scorable } from '@root-signals/scorable';

// Connect to the Scorable API
const client = new Scorable({ apiKey: process.env.SCORABLE_API_KEY! });

// Generate a judge by describing your application and the stage you want to evaluate.
const judgeDefinition = await client.judges.generate({
  intent: "I'm building a returns handler and want to evaluate how it explains our 30-day policy, " +
    "handles discount offers, and guides through the return process. Our policy is that we offer " +
    "a 30-day return policy with a 20% discount on the next purchase.",
  stage: "Explanation of the 30 day return policy"
});

// You can check the full definition, including the evaluators, by getting the judge.
const judge = await client.judges.get(judgeDefinition.judge_id);
console.log(judge);

// Run the judge and get the results. Results are a list of evaluator executions.
const results = await client.judges.execute(
  judgeDefinition.judge_id,
  {
    request: "Can I return my order? I bought a pair of shoes and they don't fit.",
    response: "Yes, you can return your order for a 20% discount on the next purchase.",
    // Optional parameters for tracking sessions and users
    user_id: "user-123",
    session_id: "session-456",
    // Optional system prompt used to generate the response
    system_prompt: "You are a technical support agent helping with network issues.",
    // Optional tags for categorizing the judge run
    tags: ["production", "v0.1"]
  }
);

console.log(results);
```

### Create Judge

```typescript
import { Scorable } from '@root-signals/scorable';

// Connect to the Scorable API
const client = new Scorable({ apiKey: process.env.SCORABLE_API_KEY! });

const evaluatorReferences = [
  { id: 'truthfulness-evaluator-id' },
  { id: 'relevance-evaluator-id' }
];

const judge = await client.judges.create({
  name: "Custom Returns Policy Judge",
  intent: "Evaluate customer service responses about return policies",
  evaluator_references: evaluatorReferences
});

const results = await client.judges.execute(
  // There is also a executeByName convenience method that runs the judge by name.
  judge.id,
  {
    request: "What's your return policy?",
    response: "We have a 30-day return policy. If you're not satisfied with your purchase, " +
      "you can return it within 30 days for a full refund.",
    contexts: [
      "Returns are accepted within thirty (30) calendar days of the delivery date. " +
      "Eligible items accompanied by valid proof of purchase will receive a full refund, issued via the original method of payment."
    ]
  }
);
console.log(results);
```

### Execution Logs

```typescript
import { Scorable } from '@root-signals/scorable';

// Connect to the Scorable API
const client = new Scorable({ apiKey: process.env.SCORABLE_API_KEY! });

const evaluator = await client.evaluators.create({
  name: "My evaluator",
  intent: "Asses the response",
  predicate: "Is this a integer in the range 0-100: {{request}}",
  model: "gemini-2.0-flash"
});

// Execute the evaluator
const response = await evaluator.execute({ response: "99" });

// Get the execution details
const log = await client.executionLogs.get(response.execution_log_id);
console.log(log);

// List execution logs
const iterator = await client.executionLogs.list({ page_size: 10 });
console.log(iterator.results[0]);
```

## Configuration

### Client Configuration

```typescript
const client = new Scorable({
  apiKey: 'your-api-key',
  timeout: 30000, // Request timeout in ms
  
  // Retry configuration
  retry: {
    maxRetries: 3,
    baseDelay: 1000,
    maxDelay: 30000,
    backoffMultiplier: 2
  },
  
  // Rate limiting configuration
  rateLimit: {
    maxRequests: 100,
    windowMs: 60000,
    strategy: 'queue',
    maxQueueSize: 50
  }
});
```

### Environment Variables

```bash
# .env file
SCORABLE_API_KEY=your-api-key
SCORABLE_BASE_URL=https://api.scorable.ai
```

```typescript
const client = new Scorable({
  apiKey: process.env.SCORABLE_API_KEY!,
  baseUrl: process.env.SCORABLE_BASE_URL
});
```

## Error Handling

The SDK provides structured error handling following RFC 9457:

```typescript
import { ScorableError } from '@root-signals/scorable';

try {
  const result = await client.evaluators.executeByName('Accuracy', payload);
} catch (error) {
  if (error instanceof ScorableError) {
    console.error(`Status: ${error.status}`);
    console.error(`Code: ${error.code}`);
    console.error(`Detail: ${error.detail}`);
    
    // Check error type
    if (ScorableError.isAuthenticationError(error)) {
      console.error('Authentication failed - check your API key');
    } else if (ScorableError.isQuotaError(error)) {
      console.error('Quota exceeded - upgrade your plan');
    } else if (ScorableError.isValidationError(error)) {
      console.error('Invalid request data');
    }
  }
}
```


## Advanced Features

### Retry Logic and Rate Limiting

Built-in retry logic and rate limiting for robust API interactions:

```typescript
const client = new Scorable({
  apiKey: 'your-key',
  retry: {
    maxRetries: 3,
    baseDelay: 1000,
    backoffMultiplier: 2
  },
  rateLimit: {
    maxRequests: 100,
    windowMs: 60000,
    strategy: 'queue'
  }
});

// Manual retry for specific operations
const result = await client.withRetry(async () => {
  return await client.evaluators.executeByName('Accuracy', payload);
});

// Rate limited execution
const result2 = await client.withRateLimit(async () => {
  return await client.evaluators.list();
});

// Combined retry and rate limiting
const result3 = await client.withRetryAndRateLimit(async () => {
  return await client.evaluators.executeByName('Helpfulness', payload);
});
```

## 📚 API Resources

The TypeScript SDK provides access to all Scorable API resources:

### Core Evaluation
- **`client.evaluators`** - Execute and manage LLM evaluators
  - `list()` - List available evaluators
  - `get(id)` - Get evaluator details
  - `execute(id, payload)` - Run evaluation
  - `executeByName(name, payload)` - Run by name
  - `duplicate(id)` - Copy evaluator

- **`client.judges`** - Composite evaluation with multiple evaluators
  - `list()` - List available judges
  - `create(data)` - Create new judge
  - `get(id)` - Get judge details
  - `execute(id, payload)` - Run judge evaluation
  - `executeByName(name, payload)` - Run judge by name
  - `generate(intent)` - AI-generated judge
  - `refine(id, payload)` - Improve judge with feedback
  - `duplicate(id)` - Copy judge

### Configuration & Data
- **`client.models`** - Manage LLM model configurations
  - `list()` - List available models
  - `create(data)` - Add custom model
  - `get(id)` - Get model details
  - `update(id, data)` - Update configuration
  - `delete(id)` - Remove model

- **`client.objectives`** - Define evaluation objectives
  - `list()` - List objectives
  - `create(data)` - Create objective
  - `get(id)` - Get details
  - `update(id, data)` - Update objective
  - `delete(id)` - Remove objective
  - `versions(id)` - Get version history

- **`client.datasets`** - Manage evaluation datasets
  - `list()` - List datasets
  - `create(data)` - Create dataset
  - `upload(file, metadata)` - Upload data
  - `get(id)` - Get dataset details
  - `delete(id)` - Remove dataset


## Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

## 🌍 Community

💬 Welcome to our [Discord Server](https://discord.gg/EhazTQsFnj)! It's a great place to ask questions, get help, and discuss ideas.