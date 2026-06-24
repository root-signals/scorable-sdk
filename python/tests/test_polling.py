import pytest

from scorable._polling import apoll_until, poll_until


def test_poll_until__returns_when_predicate_true_after_retries():
    calls = {"n": 0}

    def fetch():
        calls["n"] += 1
        return calls["n"]

    result = poll_until(fetch, predicate=lambda v: v >= 3, poll_interval=0.0, timeout=5.0)
    assert result == 3
    assert calls["n"] == 3


def test_poll_until__raises_timeout_when_predicate_never_true():
    with pytest.raises(TimeoutError):
        poll_until(lambda: 1, predicate=lambda v: v == 2, poll_interval=0.0, timeout=0.05)


@pytest.mark.asyncio
async def test_apoll_until__returns_when_predicate_true_after_retries():
    calls = {"n": 0}

    async def fetch():
        calls["n"] += 1
        return calls["n"]

    result = await apoll_until(fetch, predicate=lambda v: v >= 2, poll_interval=0.0, timeout=5.0)
    assert result == 2
