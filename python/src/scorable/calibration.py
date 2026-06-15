from typing import Any, Awaitable, Callable, List, Optional

from ._polling import DEFAULT_POLL_INTERVAL, DEFAULT_TIMEOUT, apoll_until, poll_until

_RUNNING_STATUS = "pending"


class CalibrationExperimentHandle:
    """Handle to a calibration experiment. Drive completion with wait()."""

    def __init__(self, experiment: Any, *, refresher: Callable[[str], Any]) -> None:
        self._experiment = experiment
        self._refresher = refresher

    @property
    def id(self) -> str:
        return self._experiment.id

    @property
    def status(self) -> str:
        return self._experiment.status

    @property
    def rmse(self) -> Optional[float]:
        return self._experiment.rmse

    @property
    def tasks(self) -> List[Any]:
        return self._experiment.tasks

    def refresh(self) -> "CalibrationExperimentHandle":
        self._experiment = self._refresher(self.id)
        return self

    def wait(
        self, *, poll_interval: float = DEFAULT_POLL_INTERVAL, timeout: float = DEFAULT_TIMEOUT
    ) -> "CalibrationExperimentHandle":
        self._experiment = poll_until(
            lambda: self._refresher(self.id),
            predicate=lambda exp: exp.status != _RUNNING_STATUS,
            poll_interval=poll_interval,
            timeout=timeout,
        )
        return self


class ACalibrationExperimentHandle:
    """Async handle to a calibration experiment. Drive completion with await wait()."""

    def __init__(self, experiment: Any, *, refresher: Callable[[str], Awaitable[Any]]) -> None:
        self._experiment = experiment
        self._refresher = refresher

    @property
    def id(self) -> str:
        return self._experiment.id

    @property
    def status(self) -> str:
        return self._experiment.status

    @property
    def rmse(self) -> Optional[float]:
        return self._experiment.rmse

    @property
    def tasks(self) -> List[Any]:
        return self._experiment.tasks

    async def refresh(self) -> "ACalibrationExperimentHandle":
        self._experiment = await self._refresher(self.id)
        return self

    async def wait(
        self, *, poll_interval: float = DEFAULT_POLL_INTERVAL, timeout: float = DEFAULT_TIMEOUT
    ) -> "ACalibrationExperimentHandle":
        self._experiment = await apoll_until(
            lambda: self._refresher(self.id),
            predicate=lambda exp: exp.status != _RUNNING_STATUS,
            poll_interval=poll_interval,
            timeout=timeout,
        )
        return self
