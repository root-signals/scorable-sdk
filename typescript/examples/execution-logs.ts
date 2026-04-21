import { Scorable } from '../src/index.js';

// Connect to the Scorable API
const client = new Scorable({ apiKey: process.env.SCORABLE_API_KEY! });

const evaluator = await client.evaluators.create({
  name: 'My evaluator',
  intent: 'Asses the response',
  predicate: 'Is this a integer in the range 0-100: {{request}}',
  model: 'gemini-3-flash',
});

// Execute the evaluator
const response = await evaluator.execute({ response: '99' });

// Get the execution details
const log = await client.executionLogs.get(response.execution_log_id);
console.log(log);

// List execution logs
const iterator = await client.executionLogs.list({ page_size: 10 });
console.log(iterator.results[0]);
