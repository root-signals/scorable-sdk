import { Scorable } from '../src/index.js';

const client = new Scorable({ apiKey: process.env.SCORABLE_API_KEY! });

const networkTroubleshootingEvaluator = await client.evaluators.create({
  name: 'Network Troubleshooting',
  predicate: `Assess the response for technical accuracy and appropriateness in the context of network troubleshooting.
            Is the advice technically sound and relevant to the user's question?
            Does the troubleshooting process effectively address the likely causes of the issue?
            Is the proposed solution valid and safe to implement?

            User question: {{request}}

            Chatbot response: {{response}}`,
  intent:
    'To measure the technical accuracy and appropriateness of network troubleshooting responses',
  model: 'gemini-3-flash', // Check client.models.list() for all available models. You can also add your own model.
});

const response = await networkTroubleshootingEvaluator.execute({
  request: 'My internet is not working.',
  response: `
    I'm sorry to hear that your internet isn't working.
    Let's troubleshoot this step by step.
  `,
});

console.log(response.score);
console.log(response.justification);
