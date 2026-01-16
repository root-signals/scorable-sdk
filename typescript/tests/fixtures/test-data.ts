// Test data factories for consistent test data generation
export class TestDataFactory {
  static createEvaluator(overrides: Partial<any> = {}) {
    return {
      id: `eval-${Date.now()}`,
      name: 'Test Evaluator',
      requires_expected_output: false,
      requires_contexts: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      ...overrides,
    };
  }

  static createJudge(overrides: Partial<any> = {}) {
    return {
      id: overrides.id || `judge-${Date.now()}`,
      name: 'Test Judge',
      intent: 'Test judge for evaluation purposes',
      evaluators: [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      ...overrides,
    };
  }

  static createObjective(overrides: Partial<any> = {}) {
    return {
      id: `obj-${Date.now()}`,
      intent: 'Test objective for evaluation',
      status: 'unlisted' as const,
      test_set: null,
      validators: [],
      created_at: new Date().toISOString(),
      owner: {
        email: 'test@example.com',
        full_name: 'Test User',
      },
      version_id: `version-${Date.now()}`,
      test_dataset_id: null,
      ...overrides,
    };
  }

  static createModel(overrides: Partial<any> = {}) {
    return {
      id: `model-${Date.now()}`,
      name: 'Test Model',
      model: 'gpt-3.5-turbo',
      max_token_count: 4096,
      max_output_token_count: 1024,
      created_at: new Date().toISOString(),
      ...overrides,
    };
  }

  static createExecutionLog(overrides: Partial<any> = {}) {
    return {
      id: `log-${Date.now()}`,
      created_at: new Date().toISOString(),
      cost: Math.random() * 0.01,
      score: Math.random(),
      model: 'gpt-3.5-turbo',
      execution_duration: Math.random() * 5,
      token_count: Math.floor(Math.random() * 1000),
      ...overrides,
    };
  }

  static createDataset(overrides: Partial<any> = {}) {
    return {
      id: `dataset-${Date.now()}`,
      name: 'Test Dataset',
      type: 'test' as const,
      tags: ['test', 'sdk'],
      owner: {
        email: 'test@example.com',
        full_name: 'Test User',
      },
      created_at: new Date().toISOString(),
      status: 'ready',
      _meta: {},
      ...overrides,
    };
  }

  static createEvaluatorExecution(overrides: Partial<any> = {}) {
    return {
      score: 0.85,
      justification: 'Test evaluation justification explaining the score.',
      ...overrides,
    };
  }

  static createJudgeExecution(overrides: Partial<any> = {}) {
    return {
      evaluator_results: [
        {
          evaluator_id: 'eval-123',
          evaluator_name: 'Test Evaluator',
          score: 0.9,
          justification: 'Test justification',
        },
      ],
      ...overrides,
    };
  }

  static createPaginatedResponse<T>(results: T[], overrides: Partial<any> = {}) {
    return {
      results,
      next: null,
      previous: null,
      count: results.length,
      ...overrides,
    };
  }

  static createApiError(overrides: Partial<any> = {}) {
    return {
      detail: 'Test error message',
      code: 'TEST_ERROR',
      ...overrides,
    };
  }

  // Common test inputs
  static getTestExecutionInputs() {
    return {
      request: 'How do I reset my password?',
      response:
        'You can reset your password by clicking the "Forgot Password" link on the login page.',
      expected_output: 'Click forgot password link',
      contexts: ['Login page information', 'Password reset procedures'],
    };
  }

  static getTestJudgeInputs() {
    return {
      input: 'What is the capital of France?',
      output: 'The capital of France is Paris.',
      context: 'Geography question about European capitals',
    };
  }

  static getTestMultiTurnMessages() {
    return {
      target: 'agent_behavior' as const,
      turns: [
        {
          role: 'user' as const,
          content: 'Hello, I need help with my order',
        },
        {
          role: 'assistant' as const,
          content: "I'd be happy to help! What's your order number?",
        },
        {
          role: 'user' as const,
          content: "It's ORDER-12345",
        },
        {
          role: 'assistant' as const,
          content: "{'order_number': 'ORDER-12345', 'status': 'shipped', 'eta': 'Jan 20'}",
          tool_name: 'order_lookup',
        },
        {
          role: 'assistant' as const,
          content: 'I found your order. It is currently in transit and should arrive by Jan 20.',
        },
      ],
    };
  }

  static getTestMultiTurnExecutionInputs() {
    return {
      messages: this.getTestMultiTurnMessages(),
      contexts: ['Return policy: 30 days for full refund'],
      user_id: 'user-123',
      session_id: 'session-456',
    };
  }
}
