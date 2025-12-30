/**
 * Real-World Integration Example
 *
 * This example demonstrates how to integrate Scorable into a real application:
 * - Production-ready configuration
 * - Comprehensive monitoring and analytics
 * - Integration with logging systems
 * - A/B testing evaluation workflows
 */

import { Scorable, ScorableError, ExecutionResult } from '../src/index.js';

// Simulated application types
interface ChatbotResponse {
  id: string;
  userId: string;
  sessionId: string;
  request: string;
  response: string;
  timestamp: Date;
  model: string;
  responseTime: number;
}

interface EvaluationMetrics {
  totalEvaluations: number;
  averageScore: number;
  scoreDistribution: { [range: string]: number };
  topIssues: string[];
  modelPerformance: { [model: string]: number };
}

class ProductionEvaluationService {
  private client: Scorable;
  private metrics: EvaluationMetrics;

  constructor(apiKey: string) {
    // Production-ready client configuration
    this.client = new Scorable({
      apiKey,
      timeout: 30000,
      retry: {
        maxRetries: 3,
        baseDelay: 1000,
        maxDelay: 10000,
        backoffMultiplier: 2,
      },
      rateLimit: {
        maxRequests: 50, // Conservative rate limiting for production
        windowMs: 60000,
        strategy: 'queue',
        maxQueueSize: 100,
      },
    });

    this.metrics = {
      totalEvaluations: 0,
      averageScore: 0,
      scoreDistribution: {},
      topIssues: [],
      modelPerformance: {},
    };
  }

  /**
   * Evaluate a chatbot response with comprehensive error handling and logging
   */
  async evaluateResponse(response: ChatbotResponse): Promise<{
    evaluationId: string;
    scores: { [evaluator: string]: ExecutionResult };
    overallScore: number;
    issues: string[];
  }> {
    const evaluationId = `eval_${response.id}_${Date.now()}`;

    try {
      console.log(`🔍 [${evaluationId}] Starting evaluation for response ${response.id}`);

      // Multi-dimensional evaluation using different evaluators
      const evaluators = ['Helpfulness', 'Politeness', 'Clarity'];
      const scores: { [evaluator: string]: ExecutionResult } = {};
      const issues: string[] = [];

      // Execute evaluations in parallel with error handling
      const evaluationPromises = evaluators.map(async (evaluatorName) => {
        try {
          const result = await this.client.withRetryAndRateLimit(() =>
            this.client.evaluators.executeByName(evaluatorName, {
              request: response.request,
              response: response.response,
              contexts: [`Model: ${response.model}, Session: ${response.sessionId}`],
            }),
          );

          scores[evaluatorName] = result;

          if (result.score === undefined || result.score === null) {
            issues.push(`No score for ${evaluatorName}`);
          }

          // Flag potential issues based on low scores
          if (result.score !== undefined && result.score !== null && result.score < 0.6) {
            issues.push(`Low ${evaluatorName.toLowerCase()} score: ${result.score.toFixed(3)}`);
          }

          console.log(
            `  ✅ [${evaluationId}] ${evaluatorName}: ${result.score?.toFixed(3) || 'No score'}`,
          );
        } catch (error) {
          console.error(
            `  ❌ [${evaluationId}] Failed to evaluate ${evaluatorName}:`,
            error instanceof Error ? error.message : error,
          );
          issues.push(`Failed to evaluate ${evaluatorName}`);
        }
      });

      await Promise.all(evaluationPromises);

      // Calculate overall score
      const validScores = Object.values(scores)
        .map((s) => s.score)
        .filter((s) => s !== undefined);
      const overallScore =
        validScores.length > 0
          ? // @ts-expect-error
            validScores.reduce((sum, score) => (sum ?? 0) + (score ?? 0), 0) / validScores.length
          : 0;

      // Update metrics
      this.updateMetrics(overallScore, response.model, issues);

      // Log results for monitoring
      console.log(
        `📊 [${evaluationId}] Overall score: ${overallScore.toFixed(3)}, Issues: ${issues.length}`,
      );

      return {
        evaluationId,
        scores,
        overallScore,
        issues,
      };
    } catch (error) {
      console.error(`💥 [${evaluationId}] Critical evaluation error:`, error);
      throw error;
    }
  }

  /**
   * Batch evaluate multiple responses with progress tracking
   */
  async batchEvaluate(responses: ChatbotResponse[]): Promise<void> {
    console.log(`🚀 Starting batch evaluation of ${responses.length} responses`);

    const batchSize = 5; // Process 5 at a time
    const results: {
      evaluationId: string;
      scores: { [evaluator: string]: ExecutionResult };
      overallScore: number;
      issues: string[];
    }[] = [];

    for (let i = 0; i < responses.length; i += batchSize) {
      const batch = responses.slice(i, i + batchSize);
      const batchNumber = Math.floor(i / batchSize) + 1;
      const totalBatches = Math.ceil(responses.length / batchSize);

      console.log(`📦 Processing batch ${batchNumber}/${totalBatches} (${batch.length} items)`);

      const batchPromises = batch.map((response) => this.evaluateResponse(response));
      const batchResults = await Promise.allSettled(batchPromises);

      // Process results and track failures
      batchResults.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          results.push(result.value);
        } else {
          console.error(`❌ Failed to evaluate response ${batch[index]!.id}:`, result.reason);
        }
      });

      // Progress update
      const progress = Math.min(i + batchSize, responses.length);
      console.log(
        `📈 Progress: ${progress}/${responses.length} (${((progress / responses.length) * 100).toFixed(1)}%)`,
      );
    }

    console.log(
      `✅ Batch evaluation completed. ${results.length}/${responses.length} successful evaluations`,
    );
  }

  /**
   * A/B test two different response strategies
   */
  async abTestResponses(
    testName: string,
    baselineResponses: ChatbotResponse[],
    variantResponses: ChatbotResponse[],
  ): Promise<{
    baselineScore: number;
    variantScore: number;
    improvement: number;
    significant: boolean;
  }> {
    console.log(`🧪 Running A/B test: ${testName}`);
    console.log(`  Baseline: ${baselineResponses.length} responses`);
    console.log(`  Variant: ${variantResponses.length} responses`);

    // Evaluate baseline
    console.log('📊 Evaluating baseline responses...');
    const baselineScores: number[] = [];
    for (const response of baselineResponses) {
      try {
        const result = await this.evaluateResponse(response);
        baselineScores.push(result.overallScore);
      } catch {
        console.warn(`⚠️  Skipping baseline response ${response.id} due to error`);
      }
    }

    // Evaluate variant
    console.log('📊 Evaluating variant responses...');
    const variantScores: number[] = [];
    for (const response of variantResponses) {
      try {
        const result = await this.evaluateResponse(response);
        variantScores.push(result.overallScore);
      } catch {
        console.warn(`⚠️  Skipping variant response ${response.id} due to error`);
      }
    }

    // Calculate statistics
    const baselineScore =
      baselineScores.reduce((sum, score) => sum + score, 0) / baselineScores.length;
    const variantScore =
      variantScores.reduce((sum, score) => sum + score, 0) / variantScores.length;
    const improvement = ((variantScore - baselineScore) / baselineScore) * 100;

    // Simple significance test (in production, use proper statistical tests)
    const significant = Math.abs(improvement) > 5; // 5% threshold

    console.log(`📈 A/B Test Results for ${testName}:`);
    console.log(`  Baseline average: ${baselineScore.toFixed(3)}`);
    console.log(`  Variant average: ${variantScore.toFixed(3)}`);
    console.log(`  Improvement: ${improvement.toFixed(2)}%`);
    console.log(`  Significant: ${significant ? '✅ Yes' : '❌ No'}`);

    return {
      baselineScore,
      variantScore,
      improvement,
      significant,
    };
  }

  /**
   * Generate comprehensive analytics report
   */
  generateReport(): void {
    console.log('\n📊 === EVALUATION ANALYTICS REPORT ===');
    console.log(`Total Evaluations: ${this.metrics.totalEvaluations}`);
    console.log(`Average Score: ${this.metrics.averageScore.toFixed(3)}`);

    console.log('\n📈 Score Distribution:');
    Object.entries(this.metrics.scoreDistribution).forEach(([range, count]) => {
      console.log(`  ${range}: ${count} evaluations`);
    });

    console.log('\n🤖 Model Performance:');
    Object.entries(this.metrics.modelPerformance).forEach(([model, avgScore]) => {
      console.log(`  ${model}: ${avgScore.toFixed(3)}`);
    });

    if (this.metrics.topIssues.length > 0) {
      console.log('\n⚠️  Top Issues:');
      this.metrics.topIssues.slice(0, 5).forEach((issue, index) => {
        console.log(`  ${index + 1}. ${issue}`);
      });
    }

    console.log('=================================\n');
  }

  private updateMetrics(score: number, model: string, issues: string[]): void {
    this.metrics.totalEvaluations++;

    // Update average score
    this.metrics.averageScore =
      (this.metrics.averageScore * (this.metrics.totalEvaluations - 1) + score) /
      this.metrics.totalEvaluations;

    // Update score distribution
    const range = this.getScoreRange(score);
    this.metrics.scoreDistribution[range] = (this.metrics.scoreDistribution[range] || 0) + 1;

    // Update model performance
    if (!this.metrics.modelPerformance[model]) {
      this.metrics.modelPerformance[model] = score;
    } else {
      const modelEvals = Object.values(this.metrics.scoreDistribution).reduce(
        (sum, count) => sum + count,
        0,
      );
      this.metrics.modelPerformance[model] =
        (this.metrics.modelPerformance[model] * (modelEvals - 1) + score) / modelEvals;
    }

    // Track issues
    this.metrics.topIssues.push(...issues);
  }

  private getScoreRange(score: number): string {
    if (score >= 0.9) return '0.9-1.0 (Excellent)';
    if (score >= 0.8) return '0.8-0.9 (Good)';
    if (score >= 0.7) return '0.7-0.8 (Fair)';
    if (score >= 0.6) return '0.6-0.7 (Poor)';
    return '0.0-0.6 (Critical)';
  }
}

async function main() {
  try {
    const service = new ProductionEvaluationService(process.env.SCORABLE_API_KEY!);

    // Sample production data
    const sampleResponses: ChatbotResponse[] = [
      {
        id: 'resp_001',
        userId: 'user_123',
        sessionId: 'session_abc',
        request: 'How do I cancel my subscription?',
        response:
          'You can cancel your subscription anytime from your account settings under the billing section.',
        timestamp: new Date(),
        model: 'gpt-4',
        responseTime: 1200,
      },
      {
        id: 'resp_002',
        userId: 'user_456',
        sessionId: 'session_def',
        request: 'Is there a refund policy?',
        response: 'Yes! We offer a 30-day money-back guarantee for all our services.',
        timestamp: new Date(),
        model: 'claude-3',
        responseTime: 800,
      },
    ];

    // Demonstrate different evaluation scenarios
    console.log('🚀 Starting real-world integration example...\n');

    // 1. Single response evaluation
    console.log('1️⃣ Single Response Evaluation:');
    const singleResult = await service.evaluateResponse(sampleResponses[0]!);
    console.log(
      `   Result: ${singleResult.overallScore.toFixed(3)} overall score, ${singleResult.issues.length} issues\n`,
    );

    // 2. Batch evaluation
    console.log('2️⃣ Batch Evaluation:');
    await service.batchEvaluate(sampleResponses);
    console.log();

    // 3. A/B testing simulation
    console.log('3️⃣ A/B Testing:');
    const baselineResponses = sampleResponses.slice(0, 1);
    const variantResponses: ChatbotResponse[] = [
      {
        ...sampleResponses[0]!,
        id: 'resp_variant',
        response:
          "I'd be happy to help you cancel your subscription! You can do this instantly from your account settings under billing, or I can walk you through the process step by step. Would you prefer me to guide you through it?",
      },
    ];

    await service.abTestResponses(
      'Subscription Cancellation Response',
      baselineResponses,
      variantResponses,
    );
    console.log();

    // 4. Generate analytics report
    console.log('4️⃣ Analytics Report:');
    service.generateReport();

    console.log('✅ Real-world integration example completed successfully!');
  } catch (error) {
    if (error instanceof ScorableError) {
      console.error(`❌ Scorable API Error (${error.status}): ${error.detail}`);
      console.error(`Error Code: ${error.code}`);
    } else {
      console.error('❌ Unexpected error:', error);
    }
    process.exit(1);
  }
}

// Run the example
main().catch(console.error);
