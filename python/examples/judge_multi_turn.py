import uuid

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
        content=None,
        tool_calls=[
            {
                "id": "call_1",
                "type": "function",
                "function": {"name": "order_lookup", "arguments": '{"order_id": "ORDER-12345"}'},
            }
        ],
    ),
    Turn(
        role="tool",
        tool_call_id="call_1",
        content='{"order_number": "ORDER-12345", "status": "shipped", "eta": "Jan 20"}',
    ),
    Turn(
        role="assistant",
        content="I found your order. It's currently in transit.",
    ),
]

tools = [
    {
        "type": "function",
        "function": {
            "name": "order_lookup",
            "description": "Look up an order by ID",
            "parameters": {
                "type": "object",
                "properties": {"order_id": {"type": "string"}},
            },
        },
    }
]

evaluator_references = [
    EvaluatorReferenceRequest(id=Evaluators.Eval.Tool_Selection.value),
    EvaluatorReferenceRequest(id=Evaluators.Eval.Relevance.value),
]

judge = client.judges.create(
    # Suffix keeps the example re-runnable: if a previous run created the judge
    # and a later step failed (e.g. judge.run timeout), retrying with the same
    # hardcoded name trips the unique-name-per-org constraint.
    name=f"Customer Service Judge {uuid.uuid4().hex[:8]}",
    intent="Evaluate customer service agent conversations for helpfulness and accuracy",
    evaluator_references=evaluator_references,
)

# Run the judge on the multi-turn conversation
result = judge.run(turns=turns, tools=tools)

print(f"Evaluation results for {judge.name}:")
for evaluator_result in result.evaluator_results:
    print(f"\n{evaluator_result.evaluator_name}:")
    print(f"  Score: {evaluator_result.score} / 1.0")
    print(f"  {evaluator_result.justification}")
