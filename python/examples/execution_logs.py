from scorable import Scorable

# Connect to the Scorable API
client = Scorable()

evaluator = client.evaluators.create(
    name="My evaluator",
    intent="Asses the response",
    predicate="Is this a integer in the range 0-100: {{response}}",
    model="gemini-3-flash",
)

# Execute the evaluator
response = evaluator.run(response="99")


# Get the execution details
log = client.execution_logs.get(execution_result=response)
print(log)

# List all execution logs
iterator = client.execution_logs.list(limit=10)
print(next(iterator))
