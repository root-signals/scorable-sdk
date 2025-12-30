from scorable import Scorable

# Connect to the Scorable API
client = Scorable()

# Run an evaluator with tags to track the execution.
result = client.evaluators.Faithfulness(
    request="What is your return policy for electronics?",
    response="""
    You can return electronics within 30 days of purchase, provided the item is unused and in its original packaging.
    A receipt or proof of purchase is required.",
    """,
    contexts=[
        """Our returns policy for electronics allows returns within 30 days of purchase.
        The item must be unused, in its original packaging, and accompanied by a valid receipt or proof of purchase.
        Refunds will be issued to the original payment method.""",
        """A receipt or proof of purchase is required.""",
    ],
    tags=["production", "v1.23"],
    user_id="user123",
    session_id="session123",
    system_prompt="The system prompt I use in my application.",
)

# Get the execution log for the evaluator run.
log = client.execution_logs.get(execution_result=result)
print(log)


# And get all the logs with the same tags.
# Also include the evaluation context field in the response which by default is not included.
logs = client.execution_logs.list(tags=["production"], include=["evaluation_context"])
for log in logs:
    print(log.score)
    print(log.evaluation_context.contexts)
    print(log.user_id)
    print(log.session_id)
