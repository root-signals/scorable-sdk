from scorable import Scorable
from scorable.generated.openapi_client.models.evaluator_reference_request import EvaluatorReferenceRequest
from scorable.multiturn import Turn
from scorable.skills import Evaluators

client = Scorable()

# Create a multi-turn conversation to evaluate
turns = [
    Turn(role="user", content="Hello, I need help with my order"),
    Turn(role="assistant", content="I'd be happy to help! What's your order number?"),
    Turn(role="user", content="It's ORDER-12345"),
    Turn(
        role="assistant",
        content="{'order_number': 'ORDER-12345', 'status': 'shipped', 'eta': 'Jan 20'}",
        tool_name="order_lookup",
    ),
    Turn(
        role="assistant",
        content="I found your order. It's currently in transit.",
    ),
]

evaluator_references = [
    EvaluatorReferenceRequest(id=Evaluators.Eval.Truthfulness.value),
    EvaluatorReferenceRequest(id=Evaluators.Eval.Relevance.value),
]

judge = client.judges.create(
    name="Customer Service Judge",
    intent="Evaluate customer service agent conversations for helpfulness and accuracy",
    evaluator_references=evaluator_references,
)

# Run the judge on the multi-turn conversation
result = judge.run(turns=turns)

print(f"Evaluation results for {judge.name}:")
for evaluator_result in result.evaluator_results:
    print(f"\n{evaluator_result.evaluator_name}:")
    print(f"  Score: {evaluator_result.score} / 1.0")
    print(f"  {evaluator_result.justification}")
