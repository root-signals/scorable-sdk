from scorable import Scorable
from scorable.skills import EvaluatorDemonstration

client = Scorable()

# Create an evaluator
network_troubleshooting_evaluator = client.evaluators.create(
    name="Advanced Network Troubleshooting",
    predicate="""Assess the response for technical accuracy and appropriateness in the context of network troubleshooting.
                Is the advice technically sound and relevant to the user's question?
                Does the troubleshooting process effectively address the likely causes of the issue?
                Is the proposed solution valid and safe to implement?

                User question: {{request}}

                Chatbot response: {{response}}
                """,
    intent="To measure the technical accuracy and appropriateness of network troubleshooting responses",
    model="gemini-3-flash",
)


# Run first calibration (benchmarking).
test_result = client.evaluators.calibrate_existing(
    evaluator_id=network_troubleshooting_evaluator.id,
    # The test data is a list of lists, where each inner
    # list contains an expected score for a given request and response.
    test_data=[
        [
            "0.1",
            "My internet is not working.",
            "I'm sorry to hear that your internet isn't working. Let's troubleshoot this step by step.",
        ],
        [
            "0.95",
            "My internet is not working.",
            "Okay, let's check some basics. First, can you tell me what operating system your computer is running (Windows, macOS, etc.)? Also, can you check the Ethernet cable connecting your computer to the router to ensure it is securely plugged in at both ends? After confirming these steps, open a command prompt or terminal and run `ping 8.8.8.8`. Let me know the results. If you are using wireless connection, try to move closer to the router and see if that improves the connectivity. If the ping fails consistently, the issue might be with your ISP. If the connection improves closer to the router, consider improving your wireless coverage with a range extender or by repositioning the router.",
        ],
    ],
)

print(test_result[0].result)

# Improve the evaluator with demonstrations,
# penalize the vague "I'm sorry" response by setting an expected score of 0.1
client.evaluators.update(
    evaluator_id=network_troubleshooting_evaluator.id,
    evaluator_demonstrations=[
        EvaluatorDemonstration(
            response="I'm sorry to hear that your internet isn't working. Let's troubleshoot this step by step.",
            request="My internet is not working.",
            score=0.1,
        ),
    ],
)
# Run second calibration
test_result = client.evaluators.calibrate_existing(
    evaluator_id=network_troubleshooting_evaluator.id,
    test_data=[
        [
            "0.1",
            "My internet is not working.",
            "I'm sorry to hear that your internet isn't working. Let's troubleshoot this step by step.",
        ],
    ],
)

# Check the results. See that the vague "I'm sorry" response receives a lower score.
print(test_result[0].result)
