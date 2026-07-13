import time

from scorable import Scorable

client = Scorable()


def wait_for_completion(run, timeout: float = 120.0):
    deadline = time.monotonic() + timeout
    while run.status in ("pending", "running"):
        if time.monotonic() > deadline:
            raise TimeoutError(f"Calibration run {run.id} did not finish within {timeout}s")
        time.sleep(2)
        run = client.calibration_runs.get(run.id)
    if run.status == "failed":
        raise RuntimeError(f"Calibration run {run.id} failed: {run.error}")
    return run


# Create an evaluator
network_troubleshooting_evaluator = client.evaluators.create(
    name="Advanced Network Troubleshooting",
    scoring_criteria="""Assess the response for technical accuracy and appropriateness in the context of network troubleshooting.
                Is the advice technically sound and relevant to the user's question?
                Does the troubleshooting process effectively address the likely causes of the issue?
                Is the proposed solution valid and safe to implement?

                User question: {{request}}

                Chatbot response: {{response}}
                """,
    intent="To measure the technical accuracy and appropriateness of network troubleshooting responses",
    model="gemini-3-flash",
    overwrite=True,
)

# Build a labelled dataset: add example request/response pairs, then annotate each with the
# expected score. Omitting a score config defaults to the global identity "Score" config, so the
# annotation value is the expected score directly.
dataset = client.datasets.create(name="Network troubleshooting calibration set", type="test")
assert dataset is not None

vague = client.datasets.add_item(
    dataset.id,
    request="My internet is not working.",
    response="I'm sorry to hear that your internet isn't working. Let's troubleshoot this step by step.",
)
thorough = client.datasets.add_item(
    dataset.id,
    request="My internet is not working.",
    response="Okay, let's check some basics. First, what operating system is your computer running? "
    "Check the Ethernet cable is securely plugged in at both ends, then run `ping 8.8.8.8` and share "
    "the results. If the ping fails consistently the issue may be with your ISP.",
)

client.annotations.create(dataset_item_id=vague.id, value=0.1)
client.annotations.create(dataset_item_id=thorough.id, value=0.95)

# Run a calibration run: measure how well the evaluator agrees with the human labels.
run = client.evaluators.calibrate_run(network_troubleshooting_evaluator.id, dataset_id=dataset.id)
run = wait_for_completion(run)
print("Calibration metrics:", run.metrics)

# Improve the evaluator by pointing it at the labelled dataset as few-shot demonstrations.
client.evaluators.update(
    network_troubleshooting_evaluator.id,
    demonstration_dataset_id=dataset.id,
)

# Re-run calibration and compare the metrics.
run = client.evaluators.calibrate_run(network_troubleshooting_evaluator.id, dataset_id=dataset.id)
run = wait_for_completion(run)
print("Calibration metrics after demonstrations:", run.metrics)
