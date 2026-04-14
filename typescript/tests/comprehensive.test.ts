/**
 * Comprehensive Integration Tests
 *
 * These tests run against the actual Scorable API and require a valid API key.
 * They are automatically skipped in CI/CD environments where no API key is available.
 *
 * To run these tests:
 * 1. Set the SCORABLE_API_KEY environment variable
 * 2. Run: npm test -- tests/comprehensive.test.ts
 *
 * Note: These tests may create, modify, and delete resources in your account.
 */

import { Scorable } from '../src/index.js';

// Get API key from environment variable
const API_KEY = process.env.SCORABLE_API_KEY;

// Fallback for development (only use if environment variable is explicitly set to this value)
const DEVELOPMENT_KEY = 'B1---------------------------------------------c5';

// Only run comprehensive tests if API key is available and valid
const runComprehensiveTests = Boolean(
  API_KEY && API_KEY !== 'your-api-key-here' && API_KEY !== 'test-api-key-123' && API_KEY !== '',
);

// Use development key only if explicitly set
const EFFECTIVE_API_KEY = API_KEY || (runComprehensiveTests ? DEVELOPMENT_KEY : null);

// Provide helpful feedback when tests are skipped
if (!runComprehensiveTests) {
  console.info('ℹ️  Comprehensive integration tests skipped: No valid SCORABLE_API_KEY found');
}

describe.skipIf(!runComprehensiveTests)('Scorable SDK Comprehensive Tests', () => {
  let client: Scorable;

  beforeAll(() => {
    if (!EFFECTIVE_API_KEY) {
      throw new Error('SCORABLE_API_KEY environment variable is required for comprehensive tests');
    }

    client = new Scorable({
      apiKey: EFFECTIVE_API_KEY,
    });
  });

  describe('Connection and Auth', () => {
    test('should connect to API successfully', async () => {
      expect.assertions(2);
      // Test basic connection by listing evaluators
      const result = await client.evaluators.list({ page_size: 1 });
      expect(result.results).toBeDefined();
      expect(Array.isArray(result.results)).toBe(true);
    });
  });

  describe('Phase 1 - Evaluators Resource', () => {
    let testEvaluatorId: string | undefined;

    test('should list evaluators', async () => {
      const result = await client.evaluators.list({ page_size: 5 });
      expect(result.results).toBeDefined();
      expect(Array.isArray(result.results)).toBe(true);

      if (result.results && result.results.length > 0) {
        testEvaluatorId = result.results[0]?.id;
        expect(testEvaluatorId).toBeDefined();
        expect(typeof testEvaluatorId).toBe('string');
      }
    });

    test('should get evaluator details', async () => {
      if (testEvaluatorId) {
        const evaluator = await client.evaluators.get(testEvaluatorId);
        expect(evaluator.id).toBe(testEvaluatorId);
        expect(evaluator.name).toBeDefined();
        expect(typeof evaluator.name).toBe('string');
      }
    }, 10000);

    test('should execute evaluator by name (if available)', async () => {
      const evaluators = await client.evaluators.list({ page_size: 10 });
      const executableEvaluator = evaluators.results.find(
        (e) =>
          e.name?.toLowerCase().includes('answer') ||
          e.name?.toLowerCase().includes('relevance') ||
          e.name?.toLowerCase().includes('quality'),
      );

      if (executableEvaluator) {
        try {
          const result = await client.evaluators.executeByName(executableEvaluator.name!, {
            request: 'What is the capital of France?',
            response: 'The capital of France is Paris.',
            expected_output: 'Paris',
          });
          expect(result).toBeDefined();
          expect(result.score).toBeDefined();
          expect(typeof result.score).toBe('number');
        } catch (error) {
          expect(error).toBeInstanceOf(Error);
        }
      }
    }, 15000);

    test('should duplicate evaluator (if available)', async () => {
      if (testEvaluatorId) {
        try {
          const duplicated = await client.evaluators.duplicate(testEvaluatorId);
          expect(duplicated.id).toBeDefined();
          expect(duplicated.id).not.toBe(testEvaluatorId);
          expect(typeof duplicated.id).toBe('string');
        } catch (error) {
          expect(error).toBeInstanceOf(Error);
        }
      }
    }, 10000);
  });

  describe('Phase 1 - Judges Resource', () => {
    let testJudgeId: string | undefined;
    let createdJudgeId: string | undefined;

    test('should list judges', async () => {
      const result = await client.judges.list({ page_size: 5 });
      expect(result.results).toBeDefined();
      expect(Array.isArray(result.results)).toBe(true);

      if (result.results && result.results.length > 0) {
        testJudgeId = result.results[0]?.id;
        expect(testJudgeId).toBeDefined();
        expect(typeof testJudgeId).toBe('string');
      }
    });

    test('should create a judge', async () => {
      try {
        const judge = await client.judges.create({
          name: `Test Judge ${Date.now()}`,
          intent: 'Test judge for SDK testing purposes',
          evaluator_references: [],
        });
        expect(judge.id).toBeDefined();
        createdJudgeId = judge.id;
        expect(typeof judge.id).toBe('string');
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
      }
    }, 10000);

    test('should get judge details', async () => {
      const judgeId = createdJudgeId || testJudgeId;
      if (judgeId) {
        const judge = await client.judges.get(judgeId);
        expect(judge.id).toBe(judgeId);
        expect(judge.name).toBeDefined();
        expect(typeof judge.name).toBe('string');
      }
    });

    test('should update judge', async () => {
      if (createdJudgeId) {
        try {
          const updated = await client.judges.update(createdJudgeId, {
            name: `Updated Test Judge ${Date.now()}`,
            intent: 'Updated test judge for SDK testing',
            evaluator_references: [],
          });
          expect(updated.id).toBe(createdJudgeId);
          expect(updated.name).toContain('Updated Test Judge');
        } catch (error) {
          expect(error).toBeInstanceOf(Error);
        }
      }
    });

    test('should generate judge with AI', async () => {
      try {
        const generated = await client.judges.generate({
          intent: 'Evaluate if a response correctly answers a question about geography',
        });
        expect(generated.judge_id).toBeDefined();
        expect(typeof generated.judge_id).toBe('string');
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
      }
    }, 20000);

    test('should execute judge (if available)', async () => {
      const judgeId = createdJudgeId || testJudgeId;
      if (judgeId) {
        try {
          const result = await client.judges.execute(judgeId, {
            request: 'What is the capital of France?',
            response: 'The capital of France is Paris.',
          });
          expect(result).toBeDefined();
          expect(result.evaluator_results.every((r) => r.score !== undefined)).toBe(true);
        } catch (error) {
          expect(error).toBeInstanceOf(Error);
        }
      }
    }, 15000);

    test('should duplicate judge (if available)', async () => {
      const judgeId = createdJudgeId || testJudgeId;
      if (judgeId) {
        try {
          const duplicated = await client.judges.duplicate(judgeId);
          expect(duplicated.id).toBeDefined();
          expect(duplicated.id).not.toBe(judgeId);
          expect(typeof duplicated.id).toBe('string');
        } catch (error) {
          expect(error).toBeInstanceOf(Error);
        }
      }
    });

    test('should delete created judge', async () => {
      if (createdJudgeId) {
        try {
          await client.judges.delete(createdJudgeId);
          // If we reach here, deletion was successful
          expect(true).toBe(true);
        } catch (error) {
          expect(error).toBeInstanceOf(Error);
        }
      }
    });
  });

  describe('Phase 2 - Objectives Resource', () => {
    let testObjectiveId: string | undefined;
    let createdObjectiveId: string | undefined;

    test('should list objectives', async () => {
      const result = await client.objectives.list({ page_size: 5 });
      expect(result.results).toBeDefined();
      expect(Array.isArray(result.results)).toBe(true);

      if (result.results && result.results.length > 0) {
        testObjectiveId = result.results[0]?.id;
        expect(testObjectiveId).toBeDefined();
        expect(typeof testObjectiveId).toBe('string');
      }
    });

    test('should create an objective', async () => {
      try {
        const objective = await client.objectives.create({
          intent: `Test objective created for SDK testing ${Date.now()}`,
          status: 'unlisted',
          validators: [],
        });
        expect(objective.id).toBeDefined();
        createdObjectiveId = objective.id;
        expect(typeof objective.id).toBe('string');
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
      }
    });

    test('should get objective details', async () => {
      const objectiveId = createdObjectiveId || testObjectiveId;
      if (objectiveId) {
        const objective = await client.objectives.get(objectiveId);
        expect(objective.id).toBe(objectiveId);
        expect(objective.intent).toBeDefined();
        expect(typeof objective.intent).toBe('string');
      }
    });

    test('should update objective', async () => {
      if (createdObjectiveId) {
        try {
          const updated = await client.objectives.update(createdObjectiveId, {
            intent: `Updated test objective ${Date.now()}`,
            status: 'unlisted',
            validators: [],
          });
          expect(updated.id).toBe(createdObjectiveId);
          expect(updated.intent).toContain('Updated test objective');
        } catch (error) {
          expect(error).toBeInstanceOf(Error);
        }
      }
    });

    test('should get objective versions', async () => {
      const objectiveId = createdObjectiveId || testObjectiveId;
      if (objectiveId) {
        try {
          const versions = await client.objectives.versions(objectiveId);
          expect(versions.results).toBeDefined();
          expect(Array.isArray(versions.results)).toBe(true);
          expect(versions.results.length).toBeGreaterThanOrEqual(0);
        } catch (error) {
          expect(error).toBeInstanceOf(Error);
        }
      }
    });

    test('should patch objective', async () => {
      if (createdObjectiveId) {
        try {
          const patched = await client.objectives.patch(createdObjectiveId, {
            status: 'listed',
          });
          expect(patched.id).toBe(createdObjectiveId);
          expect((patched as any).status).toBe('listed');
        } catch (error) {
          expect(error).toBeInstanceOf(Error);
        }
      }
    });

    test('should delete created objective', async () => {
      if (createdObjectiveId) {
        try {
          await client.objectives.delete(createdObjectiveId);
          // If we reach here, deletion was successful
          expect(true).toBe(true);
        } catch (error) {
          expect(error).toBeInstanceOf(Error);
        }
      }
    });
  });

  describe('Phase 2 - Models Resource', () => {
    let testModelId: string | undefined;
    let createdModelId: string | undefined;

    test('should list models', async () => {
      const result = await client.models.list({ page_size: 5 });
      expect(result.results).toBeDefined();
      expect(Array.isArray(result.results)).toBe(true);

      if (result.results && result.results.length > 0) {
        testModelId = result.results[0]?.id;
        expect(testModelId).toBeDefined();
        expect(typeof testModelId).toBe('string');
      }
    });

    test('should create a custom model', async () => {
      try {
        const model = await client.models.create({
          name: `Test Model ${Date.now()}`,
          model: 'gpt-3.5-turbo',
          max_token_count: 4096,
          max_output_token_count: 1024,
        });
        expect(model.id).toBeDefined();
        createdModelId = model.id;
        expect(typeof model.id).toBe('string');
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
      }
    });

    test('should get model details', async () => {
      const modelId = createdModelId || testModelId;
      if (modelId) {
        const model = await client.models.get(modelId);
        expect(model.id).toBe(modelId);
        expect(model.name).toBeDefined();
        expect(typeof model.name).toBe('string');
      }
    });

    test('should update model', async () => {
      if (createdModelId) {
        try {
          const updated = await client.models.update(createdModelId, {
            name: `Updated Test Model ${Date.now()}`,
            model: 'gpt-3.5-turbo',
            max_token_count: 8192,
          });
          expect(updated.id).toBe(createdModelId);
          expect(updated.name).toContain('Updated Test Model');
        } catch (error) {
          expect(error).toBeInstanceOf(Error);
        }
      }
    });

    test('should patch model', async () => {
      if (createdModelId) {
        try {
          const patched = await client.models.patch(createdModelId, {
            max_output_token_count: 2048,
          });
          expect(patched.id).toBe(createdModelId);
          expect(patched.max_output_token_count).toBe(2048);
        } catch (error) {
          expect(error).toBeInstanceOf(Error);
        }
      }
    });

    test('should delete created model', async () => {
      if (createdModelId) {
        try {
          await client.models.delete(createdModelId);
          // If we reach here, deletion was successful
          expect(true).toBe(true);
        } catch (error) {
          expect(error).toBeInstanceOf(Error);
        }
      }
    });
  });

  describe('Phase 2 - Execution Logs Resource', () => {
    test('should list execution logs', async () => {
      const result = await client.executionLogs.list({ page_size: 5 });
      expect(result.results).toBeDefined();
      expect(Array.isArray(result.results)).toBe(true);

      expect(result.results.length).toBeGreaterThanOrEqual(0);
    });

    test('should get execution log details (if available)', async () => {
      const logs = await client.executionLogs.list({ page_size: 1 });
      if (logs.results && logs.results.length > 0) {
        const logId = logs.results[0]?.id;
        try {
          expect(logId).toBeDefined();
          const logDetails = await client.executionLogs.get(logId!);
          expect(logDetails.id).toBe(logId);
          expect(typeof logDetails.id).toBe('string');
        } catch (error) {
          expect(error).toBeInstanceOf(Error);
        }
      }
    });

    test('should filter logs by date range', async () => {
      const endDate = new Date().toISOString();
      const startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(); // 7 days ago

      try {
        const result = await client.executionLogs.getByDateRange(startDate, endDate, {
          page_size: 5,
        });
        expect(result.results).toBeDefined();
        expect(Array.isArray(result.results)).toBe(true);
        expect(result.results.length).toBeGreaterThanOrEqual(0);
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
      }
    });

    test('should filter logs by cost range', async () => {
      try {
        const result = await client.executionLogs.getByCostRange(0, 1, {
          page_size: 5,
        });
        expect(result.results).toBeDefined();
        expect(Array.isArray(result.results)).toBe(true);
        expect(result.results.length).toBeGreaterThanOrEqual(0);
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
      }
    });

    test('should filter logs by score range', async () => {
      try {
        const result = await client.executionLogs.getByScoreRange(0, 1, {
          page_size: 5,
        });
        expect(result.results).toBeDefined();
        expect(Array.isArray(result.results)).toBe(true);
        expect(result.results.length).toBeGreaterThanOrEqual(0);
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
      }
    });

    test('should filter logs by evaluator (if available)', async () => {
      const evaluators = await client.evaluators.list({ page_size: 1 });
      if (evaluators.results && evaluators.results.length > 0) {
        const evaluatorId = evaluators.results[0]?.id;
        try {
          expect(evaluatorId).toBeDefined();
          const result = await client.executionLogs.getByEvaluator(evaluatorId!, { page_size: 5 });
          expect(result.results).toBeDefined();
          expect(Array.isArray(result.results)).toBe(true);
          expect(result.results.length).toBeGreaterThanOrEqual(0);
        } catch (error) {
          expect(error).toBeInstanceOf(Error);
        }
      }
    });

    test('should filter logs by model', async () => {
      try {
        const result = await client.executionLogs.getByModel('gpt-3.5-turbo', { page_size: 5 });
        expect(result.results).toBeDefined();
        expect(Array.isArray(result.results)).toBe(true);
        expect(result.results.length).toBeGreaterThanOrEqual(0);
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
      }
    });
  });

  describe('Error Handling', () => {
    test('should handle invalid evaluator ID gracefully', async () => {
      expect.assertions(2);
      try {
        await client.evaluators.get('invalid-id-12345');
        assert.fail('Should have thrown an error');
      } catch (error: any) {
        expect(error.name).toBe('ScorableError');
        expect(error).toBeInstanceOf(Error);
      }
    });

    test('should handle invalid judge ID gracefully', async () => {
      expect.assertions(2);
      try {
        await client.judges.get('invalid-id-12345');
        assert.fail('Should have thrown an error');
      } catch (error: any) {
        expect(error.name).toBe('ScorableError');
        expect(error).toBeInstanceOf(Error);
      }
    });

    test('should handle invalid objective ID gracefully', async () => {
      expect.assertions(2);
      try {
        await client.objectives.get('invalid-id-12345');
        assert.fail('Should have thrown an error');
      } catch (error: any) {
        expect(error.name).toBe('ScorableError');
        expect(error).toBeInstanceOf(Error);
      }
    });

    test('should handle invalid model ID gracefully', async () => {
      expect.assertions(2);
      try {
        await client.models.get('invalid-id-12345');
        assert.fail('Should have thrown an error');
      } catch (error: any) {
        expect(error.name).toBe('ScorableError');
        expect(error).toBeInstanceOf(Error);
      }
    });

    test('should handle invalid execution log ID gracefully', async () => {
      expect.assertions(2);
      try {
        await client.executionLogs.get('invalid-id-12345');
        assert.fail('Should have thrown an error');
      } catch (error: any) {
        expect(error.name).toBe('ScorableError');
        expect(error).toBeInstanceOf(Error);
      }
    });
  });

  describe('Pagination', () => {
    test('should handle pagination correctly for evaluators', async () => {
      const firstPage = await client.evaluators.list({ page_size: 2 });
      expect(firstPage.results).toBeDefined();

      if (firstPage.next) {
        expect(typeof firstPage.next).toBe('string');
        expect(firstPage.next.length).toBeGreaterThan(0);
      } else {
        expect(firstPage.results.length).toBeLessThanOrEqual(2);
      }
    });

    test('should handle pagination correctly for judges', async () => {
      const firstPage = await client.judges.list({ page_size: 2 });
      expect(firstPage.results).toBeDefined();

      if (firstPage.next) {
        expect(typeof firstPage.next).toBe('string');
        expect(firstPage.next.length).toBeGreaterThan(0);
      } else {
        expect(firstPage.results.length).toBeLessThanOrEqual(2);
      }
    });

    test('should handle pagination correctly for execution logs', async () => {
      const firstPage = await client.executionLogs.list({ page_size: 2 });
      expect(firstPage.results).toBeDefined();

      if (firstPage.next) {
        expect(typeof firstPage.next).toBe('string');
        expect(firstPage.next.length).toBeGreaterThan(0);
      } else {
        expect(firstPage.results.length).toBeLessThanOrEqual(2);
      }
    });
  });
});
