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
        content="{'order_number': 'ORDER-12345', 'status': 'shipped', 'eta': 'Jan 20'}",
        tool_name="order_lookup",
    ),
    Turn(
        role="assistant",
        content="I found your order. It's currently in transit.",
    ),
]

# Evaluate the multi-turn conversation
result = client.evaluators.Helpfulness(turns=turns)

print(f"Score: {result.score} / 1.0")  # A normalized score between 0 and 1
print(result.justification)  # The reasoning for the score
