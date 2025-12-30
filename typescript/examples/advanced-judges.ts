/**
 * Advanced Judges Example
 *
 * This example demonstrates advanced usage of Scorable judges:
 * - Creating custom judges
 * - AI-generated judges
 * - Judge refinement and iteration
 * - Complex evaluation scenarios
 */

import { Scorable, ScorableError } from '../src/index.js';

async function main() {
  try {
    const client = new Scorable({
      apiKey: process.env.SCORABLE_API_KEY!,
      timeout: 60000, // Longer timeout for judge operations
    });

    console.log('🚀 Starting advanced judges example...\n');

    // 1. AI-Generated Judge
    console.log('🤖 Creating AI-generated judge for customer service evaluation:');
    const aiJudgeResult = await client.judges.generate({
      intent:
        'Evaluate customer service responses for empathy, solution quality, and professionalism. ' +
        "Focus on whether the response acknowledges the customer's concern, provides a clear solution, " +
        'and maintains a professional tone throughout.',
    });

    if (aiJudgeResult.error_code) {
      console.error(`  ❌ Error generating judge: ${aiJudgeResult.error_code}`);
    } else {
      console.log(`  ✅ Generated judge ID: ${aiJudgeResult.judge_id}`);

      // Get the generated judge details
      const aiJudge = await client.judges.get(aiJudgeResult.judge_id);
      console.log(`  📋 Judge Name: ${aiJudge.name}`);
      console.log(`  📋 Intent: ${aiJudge.objective.intent}`);
      console.log(`  📋 Evaluators: ${aiJudge.evaluators?.length || 0} evaluators`);
      console.log();

      // Test the AI-generated judge
      console.log('🎯 Testing AI-generated judge:');
      const aiJudgeResult1 = await client.judges.execute(aiJudgeResult.judge_id, {
        request: "My order hasn't arrived and it's been two weeks. This is unacceptable!",
        response:
          "I completely understand your frustration, and I sincerely apologize for the delay. Let me immediately look into your order status and provide you with a tracking update. I'll also arrange for expedited shipping on your replacement order at no extra cost.",
      });

      console.log(`  📊 Evaluation Results:`);
      if (Array.isArray(aiJudgeResult1.evaluator_results)) {
        aiJudgeResult1.evaluator_results.forEach((result: any, index: number) => {
          console.log(
            `    ${index + 1}. ${result.evaluator_name || 'Evaluator'}: Score ${result.score?.toFixed(3) || 'N/A'}`,
          );
          if (result.justification) {
            console.log(`       Reason: ${result.justification.substring(0, 100)}...`);
          }
        });
      }
      console.log();
    }

    // 2. Custom Judge with Specific Evaluators
    console.log('🔧 Creating custom judge with specific evaluators:');

    // First, get some evaluators to use
    const evaluators = await client.evaluators.list({ page_size: 3 });
    if (evaluators.results.length >= 2) {
      const evaluatorRefs = evaluators.results.slice(0, 2).map((ev) => ({ id: ev.id }));

      const customJudge = await client.judges.create({
        name: 'E-commerce Support Judge',
        intent:
          'Evaluate e-commerce customer support responses for accuracy, helpfulness, and policy compliance',
        evaluator_references: evaluatorRefs,
      });

      console.log(`  ✅ Created custom judge: ${customJudge.name}`);
      console.log(`  📋 ID: ${customJudge.id}`);
      console.log(`  📋 Evaluators: ${customJudge.evaluators?.length || 0}`);
      console.log();

      // Test the custom judge with multiple scenarios
      const testScenarios = [
        {
          name: 'Return Policy Inquiry',
          request: "What's your return policy for electronics?",
          response:
            'We offer a 30-day return policy for electronics. Items must be in original packaging and condition. You can initiate a return through your account or contact our support team.',
        },
        {
          name: 'Shipping Delay Complaint',
          request: "My package was supposed to arrive yesterday but it's still not here.",
          response:
            "I apologize for the shipping delay. Let me track your package immediately and provide you with an updated delivery estimate. If there are further delays, I'll arrange priority shipping for your next order.",
        },
      ];

      console.log('🎯 Testing custom judge with multiple scenarios:');
      for (const scenario of testScenarios) {
        console.log(`  Testing: ${scenario.name}`);

        const result = await client.judges.execute(customJudge.id, {
          request: scenario.request,
          response: scenario.response,
          contexts: ['E-commerce customer support', 'Return and shipping policies'],
        });

        console.log(`    📊 Results:`);
        if (Array.isArray(result.evaluator_results)) {
          result.evaluator_results.forEach((evalResult: any, index: number) => {
            console.log(`      ${index + 1}. Score: ${evalResult.score?.toFixed(3) || 'N/A'}`);
          });
        }
        console.log();
      }
    } else {
      console.log('  ⚠️  Not enough evaluators available to create custom judge');
    }

    // 3. Judge Refinement Example
    if (!aiJudgeResult.error_code) {
      console.log('🔄 Demonstrating judge refinement:');

      const refinementPayload = {
        request: 'The app keeps crashing when I try to upload photos.',
        response: 'Try restarting your phone.',

        expected_output:
          "I understand how frustrating app crashes can be. Let's troubleshoot this step by step. First, please try force-closing the app and reopening it. If that doesn't work, try restarting your device. As a next step, please ensure you have the latest version of the app installed. If the issue persists, I'll escalate this to our technical team for further investigation.",
      };

      console.log('  🎯 Running refinement analysis...');
      const refinementResult = await client.judges.refine(
        aiJudgeResult.judge_id,
        refinementPayload,
      );

      if (refinementResult) {
        console.log('  📋 Refinement suggestions received');
        console.log('  💡 The judge can be improved based on this feedback');
      } else {
        console.log('  ℹ️  No specific refinement suggestions at this time');
      }
      console.log();
    }

    // 4. Judge Performance Comparison
    console.log('📊 Comparing judge performance across different response types:');

    const responseTypes = [
      {
        type: 'Professional',
        response:
          "Thank you for contacting us. I understand your concern and will investigate this matter immediately. I'll provide you with a detailed update within 24 hours.",
      },
      {
        type: 'Casual',
        response:
          "Hey! Yeah, that's definitely weird. Let me check what's going on and get back to you soon!",
      },
      {
        type: 'Minimal',
        response: 'OK, will check.',
      },
    ];

    if (!aiJudgeResult.error_code) {
      const testRequest = "I haven't received my refund yet and it's been 10 days.";

      for (const responseType of responseTypes) {
        console.log(`  Testing ${responseType.type} response:`);

        const result = await client.judges.execute(aiJudgeResult.judge_id, {
          request: testRequest,
          response: responseType.response,
        });

        if (Array.isArray(result.evaluator_results)) {
          const avgScore =
            result.evaluator_results.reduce((sum: number, r: any) => sum + (r.score || 0), 0) /
            result.evaluator_results.length;
          console.log(`    Average Score: ${avgScore.toFixed(3)}`);
        }
      }
      console.log();
    }

    console.log('✅ Advanced judges example completed successfully!');
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
