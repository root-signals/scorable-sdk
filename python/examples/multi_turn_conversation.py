from scorable import Scorable
from scorable.multiturn import Turn

# Connect to the Scorable API
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

# Evaluate the multi-turn conversation
result = client.evaluators.Helpfulness(turns=turns, tools=tools)

print(f"Score: {result.score} / 1.0")  # A normalized score between 0 and 1
print(result.justification)  # The reasoning for the score
