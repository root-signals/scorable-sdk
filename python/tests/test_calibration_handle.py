import pytest

from scorable.calibration import ACalibrationExperimentHandle, CalibrationExperimentHandle


class _FakeExperiment:
    def __init__(self, status, rmse, tasks):
        self.id = "exp-1"
        self.status = status
        self.rmse = rmse
        self.tasks = tasks


def test_handle_wait__polls_until_completed():
    states = [
        _FakeExperiment("pending", None, []),
        _FakeExperiment("completed", 0.2, [{"score": 0.1}]),
    ]
    calls = {"n": 0}

    def refresher(experiment_id):
        assert experiment_id == "exp-1"
        value = states[min(calls["n"], len(states) - 1)]
        calls["n"] += 1
        return value

    handle = CalibrationExperimentHandle(_FakeExperiment("pending", None, []), refresher=refresher)
    handle.wait(poll_interval=0.0, timeout=5.0)
    assert handle.status == "completed"
    assert handle.rmse == 0.2
    assert handle.tasks == [{"score": 0.1}]


@pytest.mark.asyncio
async def test_async_handle_wait__polls_until_completed():
    states = [
        _FakeExperiment("pending", None, []),
        _FakeExperiment("completed", 0.3, []),
    ]
    calls = {"n": 0}

    async def arefresher(experiment_id):
        value = states[min(calls["n"], len(states) - 1)]
        calls["n"] += 1
        return value

    handle = ACalibrationExperimentHandle(_FakeExperiment("pending", None, []), refresher=arefresher)
    await handle.wait(poll_interval=0.0, timeout=5.0)
    assert handle.status == "completed"
    assert handle.rmse == 0.3
