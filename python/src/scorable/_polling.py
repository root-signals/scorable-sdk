import asyncio
import time
from typing import Awaitable, Callable, TypeVar

T = TypeVar("T")

DEFAULT_POLL_INTERVAL = 2.0
DEFAULT_TIMEOUT = 600.0


def poll_until(
    fetch: Callable[[], T],
    *,
    predicate: Callable[[T], bool],
    poll_interval: float = DEFAULT_POLL_INTERVAL,
    timeout: float = DEFAULT_TIMEOUT,
) -> T:
    deadline = time.monotonic() + timeout
    while True:
        value = fetch()
        if predicate(value):
            return value
        if time.monotonic() >= deadline:
            raise TimeoutError("Timed out waiting for condition")
        time.sleep(poll_interval)


async def apoll_until(
    fetch: Callable[[], Awaitable[T]],
    *,
    predicate: Callable[[T], bool],
    poll_interval: float = DEFAULT_POLL_INTERVAL,
    timeout: float = DEFAULT_TIMEOUT,
) -> T:
    deadline = time.monotonic() + timeout
    while True:
        value = await fetch()
        if predicate(value):
            return value
        if time.monotonic() >= deadline:
            raise TimeoutError("Timed out waiting for condition")
        await asyncio.sleep(poll_interval)
