from __future__ import annotations

import uuid
from contextlib import AbstractAsyncContextManager, AbstractContextManager
from enum import Enum
from functools import partial
from typing import Any, AsyncIterator, Dict, Iterator, List, Literal, Optional, Union, cast

from pydantic import BaseModel, StrictStr

from scorable.generated.openapi_aclient.models.evaluator_request import EvaluatorRequest as AEvaluatorRequest
from scorable.generated.openapi_aclient.models.paginated_evaluator_list import (
    PaginatedEvaluatorList as APaginatedEvaluatorList,
)
from scorable.generated.openapi_aclient.models.paginated_evaluator_list_output_list import (
    PaginatedEvaluatorListOutputList as APaginatedEvaluatorListOutputList,
)
from scorable.generated.openapi_client.models.evaluator_request import EvaluatorRequest
from scorable.generated.openapi_client.models.paginated_evaluator_list import PaginatedEvaluatorList

from .generated.openapi_aclient import ApiClient as AApiClient
from .generated.openapi_aclient.api.calibration_runs_api import CalibrationRunsApi as ACalibrationRunsApi
from .generated.openapi_aclient.api.evaluators_api import EvaluatorsApi as AEvaluatorsApi
from .generated.openapi_aclient.api.objectives_api import ObjectivesApi as AObjectivesApi
from .generated.openapi_aclient.models import (
    EvaluatorExecutionRequest as AEvaluatorExecutionRequest,
)
from .generated.openapi_aclient.models import (
    EvaluatorExecutionResult as AEvaluatorExecutionResult,
)
from .generated.openapi_aclient.models.calibration_run import CalibrationRun as ACalibrationRun
from .generated.openapi_aclient.models.calibration_run_create_request import (
    CalibrationRunCreateRequest as ACalibrationRunCreateRequest,
)
from .generated.openapi_aclient.models.calibration_run_source_request import (
    CalibrationRunSourceRequest as ACalibrationRunSourceRequest,
)
from .generated.openapi_aclient.models.calibration_source_type_enum import (
    CalibrationSourceTypeEnum as ACalibrationSourceTypeEnum,
)
from .generated.openapi_aclient.models.evaluator import Evaluator as AOpenAPIEvaluator
from .generated.openapi_aclient.models.evaluator import Evaluator as GeneratedEvaluator
from .generated.openapi_aclient.models.evaluator_calibration_output import (
    EvaluatorCalibrationOutput as AEvaluatorCalibrationOutput,
)
from .generated.openapi_aclient.models.evaluator_list_output import EvaluatorListOutput as AEvaluatorListOutput
from .generated.openapi_aclient.models.input_variable_request import InputVariableRequest as AInputVariableRequest
from .generated.openapi_aclient.models.message_turn_request import (
    MessageTurnRequest as AMessageTurnRequest,
)
from .generated.openapi_aclient.models.objective_request import ObjectiveRequest as AObjectiveRequest
from .generated.openapi_aclient.models.patched_evaluator_request import (
    PatchedEvaluatorRequest as APatchedEvaluatorRequest,
)
from .generated.openapi_aclient.models.reference_variable_request import (
    ReferenceVariableRequest as AReferenceVariableRequest,
)
from .generated.openapi_aclient.models.skill_test_input_request import (
    SkillTestInputRequest as ASkillTestInputRequest,
)
from .generated.openapi_client import ApiClient as ApiClient
from .generated.openapi_client.api.calibration_runs_api import CalibrationRunsApi
from .generated.openapi_client.api.evaluators_api import EvaluatorsApi as EvaluatorsApi
from .generated.openapi_client.api.objectives_api import ObjectivesApi as ObjectivesApi
from .generated.openapi_client.models.calibration_run import CalibrationRun
from .generated.openapi_client.models.calibration_run_create_request import CalibrationRunCreateRequest
from .generated.openapi_client.models.calibration_run_source_request import CalibrationRunSourceRequest
from .generated.openapi_client.models.calibration_source_type_enum import CalibrationSourceTypeEnum
from .generated.openapi_client.models.evaluator import Evaluator as SyncGeneratedEvaluator
from .generated.openapi_client.models.evaluator_calibration_output import EvaluatorCalibrationOutput
from .generated.openapi_client.models.evaluator_execution_request import EvaluatorExecutionRequest
from .generated.openapi_client.models.evaluator_execution_result import EvaluatorExecutionResult
from .generated.openapi_client.models.evaluator_list_output import EvaluatorListOutput
from .generated.openapi_client.models.input_variable_request import InputVariableRequest
from .generated.openapi_client.models.message_turn_request import MessageTurnRequest
from .generated.openapi_client.models.objective_request import ObjectiveRequest
from .generated.openapi_client.models.patched_evaluator_request import PatchedEvaluatorRequest
from .generated.openapi_client.models.reference_variable_request import ReferenceVariableRequest
from .generated.openapi_client.models.skill_test_input_request import SkillTestInputRequest
from .utils import ClientContextCallable, aiterate_cursor_list, iterate_cursor_list, with_async_client, with_sync_client

ModelName = Union[
    str,
    Literal[
        "root",  # RS-chosen model
    ],
]


class ReferenceVariable(BaseModel):
    """
    Reference variable definition.

    `name` within prompt gets populated with content from `dataset_id`.
    """

    name: str
    dataset_id: str


class InputVariable(BaseModel):
    """
    Input variable definition.

    `name` within prompt gets populated with the provided variable.
    """

    name: str


class Versions:
    """
    Version listing (sub)API

    Note that this should not be directly instantiated.
    """

    def __init__(self, client_context: ClientContextCallable):
        self.client_context = client_context

    @with_sync_client
    def list(self, evaluator_id: str, *, _client: ApiClient) -> PaginatedEvaluatorList:
        """
        List all versions of a evaluator.
        """

        api_instance = EvaluatorsApi(_client)
        return api_instance.evaluators_versions_list(id=evaluator_id)

    async def alist(self, evaluator_id: str) -> APaginatedEvaluatorList:
        """
        Asynchronously list all versions of a evaluator.
        """

        context = self.client_context()
        assert isinstance(context, AbstractAsyncContextManager), "This method is not available in synchronous mode"
        async with context as client:
            api_instance = AEvaluatorsApi(client)
            return await api_instance.evaluators_versions_list(id=evaluator_id)


class Evaluator(AOpenAPIEvaluator):
    """
    Wrapper for a single Evaluator.

    For available attributes, please check the (automatically
    generated) superclass documentation.
    """

    client_context: ClientContextCallable

    @classmethod
    def _wrap(
        cls, apiobj: Union[AOpenAPIEvaluator, "SyncGeneratedEvaluator"], client_context: ClientContextCallable
    ) -> "Evaluator":  # noqa: E501
        obj = cast(Evaluator, apiobj)
        obj.__class__ = cls
        obj.client_context = client_context
        return obj

    @with_sync_client
    def run(
        self,
        response: Optional[str] = None,
        request: Optional[str] = None,
        turns: Optional[List[MessageTurnRequest]] = None,
        tools: Optional[List[Dict[str, Any]]] = None,
        contexts: Optional[List[str]] = None,
        expected_output: Optional[str] = None,
        variables: Optional[dict[str, str]] = None,
        tags: Optional[List[str]] = None,
        user_id: Optional[str] = None,
        session_id: Optional[str] = None,
        system_prompt: Optional[str] = None,
        file_ids: Optional[List[uuid.UUID]] = None,
        project_id: Optional[str] = None,
        *,
        _client: ApiClient,
        _request_timeout: Optional[int] = None,
    ) -> EvaluatorExecutionResult:
        """
        Run the evaluator.

        Args:
          response: LLM output.
          request: The prompt sent to the LLM.
          turns: Optional multi-turn conversation as a list of turns.
          tools: Optional OpenAI-style tool catalog available to the agent during the conversation.
          contexts: Optional documents passed to RAG evaluators
          expected_output: Optional expected output for the evaluator.
          variables: Optional additional variable mappings for the evaluator. For example, if the evaluator
            predicate is "evaluate the output based on {subject}: {output}", then variables={"subject": "clarity"}.
          tags: Optional tags to add to the evaluator execution
          user_id: Optional user identifier for tracking purposes.
          session_id: Optional session identifier for tracking purposes.
          system_prompt: Optional system prompt that was used for the LLM call.
          file_ids: Optional list of file UUIDs (from Files.upload). PDFs are extracted to text
            context; images are passed directly to the model.
          project_id: Optional project to attribute the execution log to.
        """

        if not response and not request and not turns:
            raise ValueError("Either response, request, or turns must be provided")

        api_instance = EvaluatorsApi(_client)

        evaluator_execution_request = EvaluatorExecutionRequest(
            evaluator_version_id=self.version_id,
            request=request,
            response=response,
            turns=turns,
            tools=tools,
            contexts=contexts,
            expected_output=expected_output,
            variables=variables,
            tags=tags,
            user_id=user_id,
            session_id=session_id,
            system_prompt=system_prompt,
            file_ids=[str(f) for f in file_ids] if file_ids else None,
            project_id=project_id,
        )
        return api_instance.evaluators_execute_create(
            id=self.id,
            evaluator_execution_request=evaluator_execution_request,
            _request_timeout=_request_timeout,
        )


class AEvaluator(AOpenAPIEvaluator):
    """
    Wrapper for a single Evaluator.

    For available attributes, please check the (automatically
    generated) superclass documentation.
    """

    client_context: ClientContextCallable

    @classmethod
    async def _awrap(
        cls, apiobj: Union[AOpenAPIEvaluator, "GeneratedEvaluator"], client_context: ClientContextCallable
    ) -> "AEvaluator":  # noqa: E501
        obj = cast(AEvaluator, apiobj)
        obj.__class__ = cls
        obj.client_context = client_context
        return obj

    @with_async_client
    async def arun(
        self,
        response: Optional[str] = None,
        request: Optional[str] = None,
        turns: Optional[List[AMessageTurnRequest]] = None,
        tools: Optional[List[Dict[str, Any]]] = None,
        contexts: Optional[List[str]] = None,
        expected_output: Optional[str] = None,
        variables: Optional[dict[str, str]] = None,
        tags: Optional[List[str]] = None,
        user_id: Optional[str] = None,
        session_id: Optional[str] = None,
        system_prompt: Optional[str] = None,
        file_ids: Optional[List[uuid.UUID]] = None,
        project_id: Optional[str] = None,
        *,
        _client: AApiClient,
        _request_timeout: Optional[int] = None,
    ) -> AEvaluatorExecutionResult:
        """
        Asynchronously run the evaluator.

        Args:
          response: LLM output.
          request: The prompt sent to the LLM.
          turns: Optional multi-turn conversation as a list of turns.
          tools: Optional OpenAI-style tool catalog available to the agent during the conversation.
          contexts: Optional documents passed to RAG evaluators
          expected_output: Optional expected output for the evaluator.
          variables: Optional additional variable mappings for the evaluator. For example, if the evaluator
            predicate is "evaluate the output based on {subject}: {output}", then variables={"subject": "clarity"}.
          tags: Optional tags to add to the evaluator execution
          user_id: Optional user identifier for tracking purposes.
          session_id: Optional session identifier for tracking purposes.
          system_prompt: Optional system prompt that was used for the LLM call.
          file_ids: Optional list of file UUIDs (from Files.upload). PDFs are extracted to text
            context; images are passed directly to the model.
          project_id: Optional project to attribute the execution log to.
        """

        if not response and not request and not turns:
            raise ValueError("Either response, request, or turns must be provided")

        api_instance = AEvaluatorsApi(_client)

        evaluator_execution_request = AEvaluatorExecutionRequest(
            evaluator_version_id=self.version_id,
            request=request,
            response=response,
            turns=turns,
            tools=tools,
            contexts=contexts,
            expected_output=expected_output,
            variables=variables,
            tags=tags,
            user_id=user_id,
            session_id=session_id,
            system_prompt=system_prompt,
            file_ids=[str(f) for f in file_ids] if file_ids else None,
            project_id=project_id,
        )
        return await api_instance.evaluators_execute_create(
            id=self.id,
            evaluator_execution_request=evaluator_execution_request,
            _request_timeout=_request_timeout,
        )


def _to_input_variables(
    input_variables: Optional[Union[List[InputVariable], List[InputVariableRequest]]],
) -> List[InputVariableRequest]:
    def _convert_to_generated_model(entry: Union[InputVariable, InputVariableRequest]) -> InputVariableRequest:
        if not isinstance(entry, InputVariableRequest):
            return InputVariableRequest(name=entry.name)
        return entry

    return [_convert_to_generated_model(entry) for entry in input_variables or {}]


def _to_reference_variables(
    reference_variables: Optional[Union[List[ReferenceVariable], List[ReferenceVariableRequest]]],
) -> List[ReferenceVariableRequest]:
    def _convert_to_generated_model(
        entry: Union[ReferenceVariable, ReferenceVariableRequest],
    ) -> ReferenceVariableRequest:
        if not isinstance(entry, ReferenceVariableRequest):
            return ReferenceVariableRequest(name=entry.name, dataset=entry.dataset_id)
        return entry

    return [_convert_to_generated_model(entry) for entry in reference_variables or {}]


def _ato_input_variables(
    input_variables: Optional[Union[List[InputVariable], List[AInputVariableRequest]]],
) -> List[AInputVariableRequest]:
    def _convert_to_generated_model(entry: Union[InputVariable, AInputVariableRequest]) -> AInputVariableRequest:
        if not isinstance(entry, AInputVariableRequest):
            return AInputVariableRequest(name=entry.name)
        return entry

    return [_convert_to_generated_model(entry) for entry in input_variables or {}]


def _ato_reference_variables(
    reference_variables: Optional[Union[List[ReferenceVariable], List[AReferenceVariableRequest]]],
) -> List[AReferenceVariableRequest]:
    def _convert_to_generated_model(
        entry: Union[ReferenceVariable, AReferenceVariableRequest],
    ) -> AReferenceVariableRequest:
        if not isinstance(entry, AReferenceVariableRequest):
            return AReferenceVariableRequest(name=entry.name, dataset=entry.dataset_id)
        return entry

    return [_convert_to_generated_model(entry) for entry in reference_variables or {}]


class PresetEvaluatorRunner:
    client_context: ClientContextCallable

    def __init__(
        self,
        client_context: ClientContextCallable,
        evaluator_id: str,
        eval_name: str,
        evaluator_version_id: Optional[str] = None,
    ):
        self.client_context = client_context
        self.evaluator_id = evaluator_id
        self.evaluator_version_id = evaluator_version_id
        self.__name__ = eval_name

    @with_sync_client
    def __call__(
        self,
        response: Optional[str] = None,
        request: Optional[str] = None,
        turns: Optional[List[MessageTurnRequest]] = None,
        tools: Optional[List[Dict[str, Any]]] = None,
        contexts: Optional[List[str]] = None,
        expected_output: Optional[str] = None,
        variables: Optional[dict[str, str]] = None,
        tags: Optional[List[str]] = None,
        user_id: Optional[str] = None,
        session_id: Optional[str] = None,
        system_prompt: Optional[str] = None,
        project_id: Optional[str] = None,
        *,
        _client: ApiClient,
        _request_timeout: Optional[int] = None,
    ) -> EvaluatorExecutionResult:
        """
        Run the evaluator.

        Args:
            response: LLM output.
            request: The prompt sent to the LLM.
            turns: Optional multi-turn conversation as a list of turns.
            tools: Optional OpenAI-style tool catalog available to the agent during the conversation.
            contexts: Optional documents passed to RAG evaluators
            expected_output: Optional expected output for the evaluator.
            variables: Optional additional variable mappings for the evaluator. For example, if the evaluator
                predicate is "evaluate the output based on {subject}: {output}", then variables={"subject": "clarity"}.
            tags: Optional tags to add to the evaluator execution
            user_id: Optional user identifier for tracking purposes.
            session_id: Optional session identifier for tracking purposes.
            system_prompt: Optional system prompt that was used for the LLM call.
        """

        if not response and not request and not turns:
            raise ValueError("Either response, request, or turns must be provided")

        api_instance = EvaluatorsApi(_client)

        evaluator_execution_request = EvaluatorExecutionRequest(
            evaluator_version_id=self.evaluator_version_id,
            request=request,
            response=response,
            turns=turns,
            tools=tools,
            contexts=contexts,
            expected_output=expected_output,
            variables=variables,
            tags=tags,
            user_id=user_id,
            session_id=session_id,
            system_prompt=system_prompt,
            project_id=project_id,
        )
        return api_instance.evaluators_execute_create(
            id=self.evaluator_id,
            evaluator_execution_request=evaluator_execution_request,
            _request_timeout=_request_timeout,
        )


class APresetEvaluatorRunner:
    client_context: ClientContextCallable

    def __init__(
        self,
        client_context: ClientContextCallable,
        evaluator_id: str,
        eval_name: str,
        evaluator_version_id: Optional[str] = None,
    ):
        self.client_context = client_context
        self.evaluator_id = evaluator_id
        self.evaluator_version_id = evaluator_version_id
        self.__name__ = eval_name

    @with_async_client
    async def __call__(
        self,
        response: Optional[str] = None,
        request: Optional[str] = None,
        turns: Optional[List[AMessageTurnRequest]] = None,
        tools: Optional[List[Dict[str, Any]]] = None,
        contexts: Optional[List[str]] = None,
        expected_output: Optional[str] = None,
        variables: Optional[dict[str, str]] = None,
        tags: Optional[List[str]] = None,
        user_id: Optional[str] = None,
        session_id: Optional[str] = None,
        system_prompt: Optional[str] = None,
        project_id: Optional[str] = None,
        *,
        _client: AApiClient,
        _request_timeout: Optional[int] = None,
    ) -> AEvaluatorExecutionResult:
        """
        Asynchronously run the evaluator.

        Args:
            response: LLM output.
            request: The prompt sent to the LLM.
            turns: Optional multi-turn conversation as a list of turns.
            tools: Optional OpenAI-style tool catalog available to the agent during the conversation.
            contexts: Optional documents passed to RAG evaluators
            expected_output: Optional expected output for the evaluator.
            variables: Optional additional variable mappings for the evaluator. For example, if the evaluator
                predicate is "evaluate the output based on {subject}: {output}", then variables={"subject": "clarity"}.
            tags: Optional tags to add to the evaluator execution
            user_id: Optional user identifier for tracking purposes.
            session_id: Optional session identifier for tracking purposes.
            system_prompt: Optional system prompt that was used for the LLM call.
        """

        if not response and not request and not turns:
            raise ValueError("Either response, request, or turns must be provided")

        api_instance = AEvaluatorsApi(_client)

        evaluator_execution_request = AEvaluatorExecutionRequest(
            evaluator_version_id=self.evaluator_version_id,
            request=request,
            response=response,
            turns=turns,
            tools=tools,
            contexts=contexts,
            expected_output=expected_output,
            variables=variables,
            tags=tags,
            user_id=user_id,
            session_id=session_id,
            system_prompt=system_prompt,
            project_id=project_id,
        )
        return await api_instance.evaluators_execute_create(
            id=self.evaluator_id,
            evaluator_execution_request=evaluator_execution_request,
            _request_timeout=_request_timeout,
        )


class Evaluators:
    """Evaluators (sub) API

    Note:

      The construction of the API instance should be handled by
      accesing an attribute of a :class:`scorable.client.Scorable` instance.
    """

    def _validate_create_params_sanitize_name(
        self, name: Optional[str], intent: Optional[str], objective_id: Optional[str]
    ) -> str:
        if objective_id is not None:
            if intent:
                raise ValueError("Supplying both objective_id and intent is not supported")
        if name is None:
            name = "<unnamed>"
        return name

    def __init__(self, client_context: ClientContextCallable):
        self.client_context = client_context
        self.versions = Versions(client_context)

    def _to_objective_request(self, *, intent: Optional[str] = None) -> ObjectiveRequest:
        return ObjectiveRequest(
            intent=intent,
        )

    async def _ato_objective_request(self, *, intent: Optional[str] = None) -> AObjectiveRequest:
        return AObjectiveRequest(
            intent=intent,
        )

    @with_sync_client
    def run(
        self,
        evaluator_id: str,
        *,
        request: Optional[str] = None,
        response: Optional[str] = None,
        turns: Optional[List[MessageTurnRequest]] = None,
        tools: Optional[List[Dict[str, Any]]] = None,
        contexts: Optional[List[str]] = None,
        expected_output: Optional[str] = None,
        evaluator_version_id: Optional[str] = None,
        variables: Optional[dict[str, str]] = None,
        tags: Optional[List[str]] = None,
        user_id: Optional[str] = None,
        session_id: Optional[str] = None,
        system_prompt: Optional[str] = None,
        project_id: Optional[str] = None,
        _request_timeout: Optional[int] = None,
        _client: ApiClient,
    ) -> EvaluatorExecutionResult:
        """
        Run the evaluator.

        Args:
            evaluator_id: The ID of the evaluator to run.
            request: The prompt sent to the LLM.
            response: LLM output.
            turns: Optional multi-turn conversation as a list of turns.
            tools: Optional OpenAI-style tool catalog available to the agent during the conversation.
            contexts: Optional documents passed to RAG evaluators.
            expected_output: Optional expected output for the evaluator.
            evaluator_version_id: Version ID of the evaluator to run. If omitted, the latest version is used.
            variables: Optional additional variable mappings for the evaluator. For example, if the evaluator
                predicate is "evaluate the output based on {subject}: {output}", then variables={"subject": "clarity"}.
            tags: Optional tags to add to the evaluator execution
            user_id: Optional user identifier for tracking purposes.
            session_id: Optional session identifier for tracking purposes.
            system_prompt: Optional system prompt that was used for the LLM call.
            project_id: Optional project to attribute the execution log to.
            _request_timeout: Optional timeout for the request.
        """

        if not response and not request and not turns:
            raise ValueError("Either response, request, or turns must be provided")

        api_instance = EvaluatorsApi(_client)

        evaluator_execution_request = EvaluatorExecutionRequest(
            evaluator_version_id=evaluator_version_id,
            request=request,
            response=response,
            turns=turns,
            tools=tools,
            contexts=contexts,
            expected_output=expected_output,
            variables=variables,
            tags=tags,
            user_id=user_id,
            session_id=session_id,
            system_prompt=system_prompt,
            project_id=project_id,
        )
        return api_instance.evaluators_execute_create(
            id=evaluator_id,
            evaluator_execution_request=evaluator_execution_request,
            _request_timeout=_request_timeout,
        )

    @with_async_client
    async def arun(
        self,
        evaluator_id: str,
        *,
        request: Optional[str] = None,
        response: Optional[str] = None,
        turns: Optional[List[AMessageTurnRequest]] = None,
        tools: Optional[List[Dict[str, Any]]] = None,
        contexts: Optional[List[str]] = None,
        expected_output: Optional[str] = None,
        evaluator_version_id: Optional[str] = None,
        variables: Optional[dict[str, str]] = None,
        tags: Optional[List[str]] = None,
        user_id: Optional[str] = None,
        session_id: Optional[str] = None,
        system_prompt: Optional[str] = None,
        project_id: Optional[str] = None,
        _request_timeout: Optional[int] = None,
        _client: AApiClient,
    ) -> AEvaluatorExecutionResult:
        """
        Asynchronously run the evaluator.

        Args:
            evaluator_id: The ID of the evaluator to run.
            request: The prompt sent to the LLM.
            response: LLM output.
            turns: Optional multi-turn conversation as a list of turns.
            tools: Optional OpenAI-style tool catalog available to the agent during the conversation.
            contexts: Optional documents passed to RAG evaluators.
            expected_output: Optional expected output for the evaluator.
            evaluator_version_id: Version ID of the evaluator to run. If omitted, the latest version is used.
            variables: Optional additional variable mappings for the evaluator. For example, if the evaluator
                predicate is "evaluate the output based on {subject}: {output}", then variables={"subject": "clarity"}.
            tags: Optional tags to add to the evaluator execution
            user_id: Optional user identifier for tracking purposes.
            session_id: Optional session identifier for tracking purposes.
            system_prompt: Optional system prompt that was used for the LLM call.
            project_id: Optional project to attribute the execution log to.
            _request_timeout: Optional timeout for the request.
        """

        if not response and not request and not turns:
            raise ValueError("Either response, request, or turns must be provided")

        api_instance = AEvaluatorsApi(_client)
        evaluator_execution_request = AEvaluatorExecutionRequest(
            evaluator_version_id=evaluator_version_id,
            request=request,
            response=response,
            turns=turns,
            tools=tools,
            contexts=contexts,
            expected_output=expected_output,
            variables=variables,
            tags=tags,
            user_id=user_id,
            session_id=session_id,
            system_prompt=system_prompt,
            project_id=project_id,
        )
        return await api_instance.evaluators_execute_create(
            id=evaluator_id,
            evaluator_execution_request=evaluator_execution_request,
            _request_timeout=_request_timeout,
        )

    @with_sync_client
    def calibrate_run(
        self,
        evaluator_id: str,
        *,
        dataset_id: str,
        score_config_id: Optional[str] = None,
        _request_timeout: Optional[int] = None,
        _client: ApiClient,
    ) -> CalibrationRun:
        """Start a calibration run for a saved evaluator against a labelled dataset.

        Returns the run with ``status="pending"``; poll ``client.calibration_runs.get(run.id)`` for
        its agreement metrics and per-item results.

        Args:
          evaluator_id: The saved evaluator to calibrate.
          dataset_id: The dataset whose published annotations to calibrate against.
          score_config_id: Optional score config; omitting it uses the dataset's continuous scores.
        """

        request = CalibrationRunCreateRequest(
            evaluator_external_id=evaluator_id,
            source=CalibrationRunSourceRequest(type=CalibrationSourceTypeEnum("dataset"), dataset_id=dataset_id),
            score_config_id=score_config_id,
        )
        api_instance = CalibrationRunsApi(_client)
        return api_instance.calibration_runs_create(
            calibration_run_create_request=request, _request_timeout=_request_timeout
        )

    @with_async_client
    async def acalibrate_run(
        self,
        evaluator_id: str,
        *,
        dataset_id: str,
        score_config_id: Optional[str] = None,
        _request_timeout: Optional[int] = None,
        _client: AApiClient,
    ) -> ACalibrationRun:
        """Asynchronously start a calibration run for a saved evaluator against a labelled dataset.

        Returns the run with ``status="pending"``; poll ``client.calibration_runs.get(run.id)`` for
        its agreement metrics and per-item results.

        Args:
          evaluator_id: The saved evaluator to calibrate.
          dataset_id: The dataset whose published annotations to calibrate against.
          score_config_id: Optional score config; omitting it uses the dataset's continuous scores.
        """

        request = ACalibrationRunCreateRequest(
            evaluator_external_id=evaluator_id,
            source=ACalibrationRunSourceRequest(type=ACalibrationSourceTypeEnum("dataset"), dataset_id=dataset_id),
            score_config_id=score_config_id,
        )
        api_instance = ACalibrationRunsApi(_client)
        return await api_instance.calibration_runs_create(
            calibration_run_create_request=request, _request_timeout=_request_timeout
        )

    @with_sync_client
    def calibrate(
        self,
        *,
        name: str,
        test_dataset_id: Optional[str] = None,
        test_data: Optional[List[List[str]]] = None,
        prompt: str,
        model: ModelName,
        reference_variables: Optional[Union[List[ReferenceVariable], List[ReferenceVariableRequest]]] = None,
        input_variables: Optional[Union[List[InputVariable], List[InputVariableRequest]]] = None,
        _request_timeout: Optional[int] = None,
        _client: ApiClient,
    ) -> List[EvaluatorCalibrationOutput]:
        """
        Run calibration set for an evaluator definition.
        See the create evaluator method for more details on the parameters.
        """

        if not test_dataset_id and not test_data:
            raise ValueError("Either test_dataset_id or test_data must be provided")
        if test_dataset_id and test_data:
            raise ValueError("Only one of test_dataset_id or test_data must be provided")
        api_instance = EvaluatorsApi(_client)
        evaluator_test_request = SkillTestInputRequest(
            name=name,
            test_dataset_id=test_dataset_id,
            test_data=test_data,
            prompt=prompt,
            models=[model],
            is_evaluator=True,
            objective=ObjectiveRequest(intent="Calibration"),
            reference_variables=_to_reference_variables(reference_variables),
            input_variables=_to_input_variables(input_variables),
        )
        return api_instance.evaluators_calibrate_create(evaluator_test_request, _request_timeout=_request_timeout)

    @with_async_client
    async def acalibrate(
        self,
        *,
        name: str,
        test_dataset_id: Optional[str] = None,
        test_data: Optional[List[List[str]]] = None,
        prompt: str,
        model: ModelName,
        reference_variables: Optional[Union[List[ReferenceVariable], List[AReferenceVariableRequest]]] = None,
        input_variables: Optional[Union[List[InputVariable], List[AInputVariableRequest]]] = None,
        _request_timeout: Optional[int] = None,
        _client: AApiClient,
    ) -> List[AEvaluatorCalibrationOutput]:
        """
        Asynchronously run calibration set for an evaluator definition.
        See the create evaluator method for more details on the parameters.
        """

        if not test_dataset_id and not test_data:
            raise ValueError("Either test_dataset_id or test_data must be provided")
        if test_dataset_id and test_data:
            raise ValueError("Only one of test_dataset_id or test_data must be provided")
        api_instance = AEvaluatorsApi(_client)
        evaluator_test_request = ASkillTestInputRequest(
            name=name,
            test_dataset_id=test_dataset_id,
            test_data=test_data,
            prompt=prompt,
            models=[model],
            is_evaluator=True,
            objective=AObjectiveRequest(intent="Calibration"),
            reference_variables=_ato_reference_variables(reference_variables),
            input_variables=_ato_input_variables(input_variables),
        )
        return await api_instance.evaluators_calibrate_create(evaluator_test_request, _request_timeout=_request_timeout)

    @with_sync_client
    def get_by_name(
        self,
        name: str,
        *,
        _client: ApiClient,
    ) -> Evaluator:
        """Get an evaluator instance by name.

        Args:
        name: The evaluator to be fetched. Note this only works for uniquely named evaluators.
        """

        api_instance = EvaluatorsApi(_client)

        evaluator_list: List[EvaluatorListOutput] = list(
            iterate_cursor_list(
                partial(api_instance.evaluators_list, name=name),
                limit=1,
            )
        )

        if not evaluator_list:
            raise ValueError(f"No evaluator found with name '{name}'")

        evaluator = evaluator_list[0]
        api_response = api_instance.evaluators_retrieve(id=evaluator.id)

        return Evaluator._wrap(api_response, self.client_context)

    @with_async_client
    async def aget_by_name(
        self,
        name: str,
        *,
        _client: ApiClient,
    ) -> AEvaluator:
        """Asynchronously get an evaluator instance by name.

        Args:
        name: The evaluator to be fetched. Note this only works for uniquely named evaluators.
        """

        context = self.client_context()

        assert isinstance(context, AbstractAsyncContextManager), "This method is not available in synchronous mode"

        async with context as client:
            api_instance = AEvaluatorsApi(client)

            evaluator_list: List[AEvaluatorListOutput] = []
            async for evaluator in aiterate_cursor_list(  # type: ignore[var-annotated]
                partial(api_instance.evaluators_list, name=name),
                limit=1,
            ):
                evaluator_list.extend(evaluator)

            if not evaluator_list:
                raise ValueError(f"No evaluator found with name '{name}'")

            evaluator = evaluator_list[0]
            api_response = await api_instance.evaluators_retrieve(id=evaluator.id)

            return await AEvaluator._awrap(api_response, self.client_context)

    @with_sync_client
    def create(
        self,
        scoring_criteria: str = "",
        *,
        name: Optional[str] = None,
        intent: Optional[str] = None,
        model: Optional[ModelName] = None,
        fallback_models: Optional[List[ModelName]] = None,
        input_variables: Optional[Union[List[InputVariable], List[InputVariableRequest]]] = None,
        demonstration_dataset_id: Optional[str] = None,
        objective_id: Optional[str] = None,
        overwrite: bool = False,
        project_id: Optional[str] = None,
        _client: ApiClient,
        _request_timeout: Optional[int] = None,
    ) -> Evaluator:
        """Create a new evaluator and return the result

        Args:
          scoring_criteria: The scoring criteria used to evaluate the output

          name: Name of the evaluator (defaulting to <unnamed>)

          objective_id: Optional pre-existing objective id to assign to the evaluator.

          intent: The intent of the evaluator (defaulting to name); not available if objective_id is set.

          model: The model to use (defaults to 'root', which means
            Scorable default at the time of evaluator creation)

          fallback_models: The fallback models to use in case the primary model fails.

          input_variables: An optional list of input variables for
            the evaluator.

          demonstration_dataset_id: An optional dataset of labelled examples whose published
            annotations are resolved into few-shot demonstrations at evaluation time.

          overwrite: Whether to overwrite an evaluator with the same name if it exists.
        """

        name = self._validate_create_params_sanitize_name(name, intent, objective_id)
        api_instance = EvaluatorsApi(_client)
        objective: Optional[ObjectiveRequest] = None
        if objective_id is None:
            if intent is None:
                intent = name
            objective = self._to_objective_request(
                intent=intent,
            )
            objectives_api_instance = ObjectivesApi(_client)
            objective_id = objectives_api_instance.objectives_create(objective_request=objective).id

        evaluator_request = EvaluatorRequest(
            name=name,
            objective_id=objective_id,
            scoring_criteria=scoring_criteria,
            models=[model for model in [model] + (fallback_models or []) if model is not None],
            input_variables=_to_input_variables(input_variables),
            demonstration_dataset_id=demonstration_dataset_id,
            overwrite=overwrite,
            project_id=project_id,
        )

        evaluator = api_instance.evaluators_create(
            evaluator_request=evaluator_request, _request_timeout=_request_timeout
        )

        return Evaluator._wrap(evaluator, self.client_context)

    @with_async_client
    async def acreate(
        self,
        scoring_criteria: str = "",
        *,
        name: Optional[str] = None,
        intent: Optional[str] = None,
        model: Optional[ModelName] = None,
        fallback_models: Optional[List[ModelName]] = None,
        input_variables: Optional[Union[List[InputVariable], List[AInputVariableRequest]]] = None,
        demonstration_dataset_id: Optional[str] = None,
        objective_id: Optional[str] = None,
        overwrite: bool = False,
        project_id: Optional[str] = None,
        _client: ApiClient,
        _request_timeout: Optional[int] = None,
    ) -> AEvaluator:
        """
        Asynchronously create a new evaluator and return the result

        Args:
          scoring_criteria: The scoring criteria used to evaluate the output

          name: Name of the evaluator (defaulting to <unnamed>)

          objective_id: Optional pre-existing objective id to assign to the evaluator.

          intent: The intent of the evaluator (defaulting to name); not available if objective_id is set.

          model: The model to use (defaults to 'root', which means
            Scorable default at the time of evaluator creation)

          fallback_models: The fallback models to use in case the primary model fails.

          input_variables: An optional list of input variables for
            the evaluator.

          demonstration_dataset_id: An optional dataset of labelled examples whose published
            annotations are resolved into few-shot demonstrations at evaluation time.

          overwrite: Whether to overwrite an evaluator with the same name if it exists.
        """

        name = self._validate_create_params_sanitize_name(name, intent, objective_id)
        api_instance = AEvaluatorsApi(_client)
        objective: Optional[AObjectiveRequest] = None
        if objective_id is None:
            if intent is None:
                intent = name
            objective = await self._ato_objective_request(intent=intent)
            objectives_api_instance = AObjectivesApi(_client)
            new_objective = await objectives_api_instance.objectives_create(objective_request=objective)
            objective_id = new_objective.id

        evaluator_request = AEvaluatorRequest(
            name=name,
            objective_id=objective_id,
            scoring_criteria=scoring_criteria,
            models=[model for model in [model] + (fallback_models or []) if model is not None],
            input_variables=_ato_input_variables(input_variables),
            demonstration_dataset_id=demonstration_dataset_id,
            overwrite=overwrite,
            project_id=project_id,
        )

        evaluator = await api_instance.evaluators_create(
            evaluator_request=evaluator_request, _request_timeout=_request_timeout
        )

        return await AEvaluator._awrap(evaluator, self.client_context)

    @with_sync_client
    def update(
        self,
        evaluator_id: str,
        *,
        change_note: Optional[str] = None,
        fallback_models: Optional[List[ModelName]] = None,
        input_variables: Optional[Union[List[InputVariable], List[InputVariableRequest]]] = None,
        model: Optional[ModelName] = None,
        name: Optional[str] = None,
        scoring_criteria: Optional[str] = None,
        demonstration_dataset_id: Optional[str] = None,
        objective_id: Optional[str] = None,
        project_id: Optional[str] = None,
        _request_timeout: Optional[int] = None,
        _client: ApiClient,
    ) -> Evaluator:
        """
        Update an evaluator and return the result.

        Pass `project_id=` to move this resource to a different project within your organization.

        See the create method for more information on the arguments.
        """

        api_instance = EvaluatorsApi(_client)
        request = PatchedEvaluatorRequest(
            change_note=change_note or "",
            input_variables=_to_input_variables(input_variables) if input_variables else None,
            models=[model for model in [model] + (fallback_models or []) if model is not None]
            if model or fallback_models
            else None,
            name=name,
            scoring_criteria=scoring_criteria,
            objective_id=objective_id,
            demonstration_dataset_id=demonstration_dataset_id,
            project_id=project_id,
        )

        api_response = api_instance.evaluators_partial_update(
            id=evaluator_id,
            patched_evaluator_request=request,
            _request_timeout=_request_timeout,
        )
        return Evaluator._wrap(api_response, self.client_context)

    @with_async_client
    async def aupdate(
        self,
        evaluator_id: str,
        *,
        change_note: Optional[str] = None,
        fallback_models: Optional[List[ModelName]] = None,
        input_variables: Optional[Union[List[InputVariable], List[AInputVariableRequest]]] = None,
        model: Optional[ModelName] = None,
        name: Optional[str] = None,
        scoring_criteria: Optional[str] = None,
        demonstration_dataset_id: Optional[str] = None,
        objective_id: Optional[str] = None,
        project_id: Optional[str] = None,
        _request_timeout: Optional[int] = None,
        _client: AApiClient,
    ) -> AEvaluator:
        """
        Asynchronously update an evaluator and return the result.

        Pass `project_id=` to move this resource to a different project within your organization.

        See the create method for more information on the arguments.
        """
        api_instance = AEvaluatorsApi(_client)

        request = APatchedEvaluatorRequest(
            change_note=change_note or "",
            input_variables=_ato_input_variables(input_variables) if input_variables else None,
            models=[model for model in [model] + (fallback_models or []) if model is not None]
            if model or fallback_models
            else None,
            name=name,
            objective_id=objective_id,
            scoring_criteria=scoring_criteria,
            demonstration_dataset_id=demonstration_dataset_id,
            project_id=project_id,
        )
        api_response = await api_instance.evaluators_partial_update(
            id=evaluator_id,
            patched_evaluator_request=request,
            _request_timeout=_request_timeout,
        )
        return await AEvaluator._awrap(api_response, self.client_context)

    @with_sync_client
    def get(
        self,
        evaluator_id: str,
        *,
        _request_timeout: Optional[int] = None,
        _client: ApiClient,
    ) -> Evaluator:
        """
        Get a Evaluator instance by ID.
        """

        api_instance = EvaluatorsApi(_client)
        api_response = api_instance.evaluators_retrieve(id=evaluator_id, _request_timeout=_request_timeout)
        return Evaluator._wrap(api_response, self.client_context)

    @with_async_client
    async def aget(
        self,
        evaluator_id: str,
        *,
        _request_timeout: Optional[int] = None,
        _client: AApiClient,
    ) -> AEvaluator:
        """
        Asynchronously get a Evaluator instance by ID.
        """

        api_instance = AEvaluatorsApi(_client)
        api_response = await api_instance.evaluators_retrieve(id=evaluator_id, _request_timeout=_request_timeout)
        return await AEvaluator._awrap(api_response, self.client_context)

    @with_sync_client
    def list(
        self,
        search_term: Optional[str] = None,
        *,
        limit: int = 100,
        name: Optional[str] = None,
        only_root_evaluators: bool = False,
        project_id: Optional[str] = None,
        _client: ApiClient,
    ) -> Iterator[EvaluatorListOutput]:
        """
        Iterate through the evaluators.

        Args:
          search_term: Can be used to limit returned evaluators.
          limit: Number of entries to iterate through at most.
          name: Specific name the returned evaluators must match.
          only_root_evaluators: Returns only Scorable defined evaluators.
          project_id: Optional project filter.
        """

        api_instance = EvaluatorsApi(_client)
        yield from iterate_cursor_list(
            partial(
                api_instance.evaluators_list,
                name=name,
                search=search_term,
                is_root_evaluator=True if only_root_evaluators else None,
                project_id=project_id,
            ),
            limit=limit,
        )

    async def alist(
        self,
        search_term: Optional[str] = None,
        *,
        limit: int = 100,
        name: Optional[str] = None,
        only_root_evaluators: bool = False,
        project_id: Optional[str] = None,
    ) -> AsyncIterator[AEvaluatorListOutput]:
        """
        Asynchronously iterate through the evaluators.

        Args:
          search_term: Can be used to limit returned evaluators.
          limit: Number of entries to iterate through at most.
          name: Specific name the returned evaluators must match.
          only_root_evaluators: Returns only Scorable defined evaluators.
          project_id: Optional project filter.
        """

        context = self.client_context()
        assert isinstance(context, AbstractAsyncContextManager), "This method is not available in synchronous mode"
        async with context as client:
            api_instance = AEvaluatorsApi(client)
            partial_list = partial(
                api_instance.evaluators_list,
                name=name,
                search=search_term,
                is_root_evaluator=True if only_root_evaluators else None,
                project_id=project_id,
            )

            cursor: Optional[StrictStr] = None
            while limit > 0:
                result: APaginatedEvaluatorListOutputList = await partial_list(page_size=limit, cursor=cursor)
                if not result.results:
                    return

                used_results = result.results[:limit]
                limit -= len(used_results)
                for used_result in used_results:
                    yield used_result

                if not (cursor := result.next):
                    return

    @with_sync_client
    def run_by_name(
        self,
        name: str,
        *,
        request: Optional[str] = None,
        response: Optional[str] = None,
        turns: Optional[List[MessageTurnRequest]] = None,
        tools: Optional[List[Dict[str, Any]]] = None,
        contexts: Optional[List[str]] = None,
        expected_output: Optional[str] = None,
        evaluator_version_id: Optional[str] = None,
        variables: Optional[dict[str, str]] = None,
        tags: Optional[List[str]] = None,
        user_id: Optional[str] = None,
        session_id: Optional[str] = None,
        system_prompt: Optional[str] = None,
        project_id: Optional[str] = None,
        _request_timeout: Optional[int] = None,
        _client: ApiClient,
    ) -> EvaluatorExecutionResult:
        """
        Run an evaluator by name.

        Args:
            name: The name of the evaluator to run.
            request: The prompt sent to the LLM.
            response: LLM output.
            turns: Optional multi-turn conversation as a list of turns.
            tools: Optional OpenAI-style tool catalog available to the agent during the conversation.
            contexts: Optional documents passed to RAG evaluators.
            expected_output: Optional expected output for the evaluator.
            evaluator_version_id: Version ID of the evaluator to run. If omitted, the latest version is used.
            variables: Optional additional variable mappings for the evaluator. For example, if the evaluator
                predicate is "evaluate the output based on {subject}: {output}", then variables={"subject": "clarity"}.
            tags: Optional tags to add to the evaluator execution
            user_id: Optional user identifier for tracking purposes.
            session_id: Optional session identifier for tracking purposes.
            system_prompt: Optional system prompt that was used for the LLM call.
            project_id: Optional project to attribute the execution log to.
            _request_timeout: Optional timeout for the request.
        """

        if not response and not request and not turns:
            raise ValueError("Either response, request, or turns must be provided")

        api_instance = EvaluatorsApi(_client)

        evaluator_execution_request = EvaluatorExecutionRequest(
            evaluator_version_id=evaluator_version_id,
            request=request,
            response=response,
            turns=turns,
            tools=tools,
            contexts=contexts,
            expected_output=expected_output,
            variables=variables,
            tags=tags,
            user_id=user_id,
            session_id=session_id,
            system_prompt=system_prompt,
            project_id=project_id,
        )
        return api_instance.evaluators_execute_by_name_create(
            name=name,
            evaluator_execution_request=evaluator_execution_request,
            _request_timeout=_request_timeout,
        )

    @with_sync_client
    def delete(self, evaluator_id: str, *, _client: ApiClient) -> None:
        """
        Delete the evaluator.
        """

        api_instance = EvaluatorsApi(_client)
        return api_instance.evaluators_destroy(id=evaluator_id)

    @with_async_client
    async def adelete(self, evaluator_id: str, *, _client: AApiClient) -> None:
        """
        Delete the evaluator.
        """

        api_instance = AEvaluatorsApi(_client)
        return await api_instance.evaluators_destroy(id=evaluator_id)

    @with_async_client
    async def arun_by_name(
        self,
        name: str,
        *,
        request: Optional[str] = None,
        response: Optional[str] = None,
        turns: Optional[List[AMessageTurnRequest]] = None,
        tools: Optional[List[Dict[str, Any]]] = None,
        contexts: Optional[List[str]] = None,
        expected_output: Optional[str] = None,
        evaluator_version_id: Optional[str] = None,
        variables: Optional[dict[str, str]] = None,
        tags: Optional[List[str]] = None,
        user_id: Optional[str] = None,
        session_id: Optional[str] = None,
        system_prompt: Optional[str] = None,
        project_id: Optional[str] = None,
        _request_timeout: Optional[int] = None,
        _client: AApiClient,
    ) -> AEvaluatorExecutionResult:
        """
        Asynchronously run an evaluator by name.

        Args:
            name: The name of the evaluator to run.
            request: The prompt sent to the LLM.
            response: LLM output.
            turns: Optional multi-turn conversation as a list of turns.
            tools: Optional OpenAI-style tool catalog available to the agent during the conversation.
            contexts: Optional documents passed to RAG evaluators.
            expected_output: Optional expected output for the evaluator.
            evaluator_version_id: Version ID of the evaluator to run. If omitted, the latest version is used.
            variables: Optional additional variable mappings for the evaluator. For example, if the evaluator
                predicate is "evaluate the output based on {subject}: {output}", then variables={"subject": "clarity"}.
            tags: Optional tags to add to the evaluator execution
            user_id: Optional user identifier for tracking purposes.
            session_id: Optional session identifier for tracking purposes.
            system_prompt: Optional system prompt that was used for the LLM call.
            project_id: Optional project to attribute the execution log to.
            _request_timeout: Optional timeout for the request.
        """

        if not response and not request and not turns:
            raise ValueError("Either response, request, or turns must be provided")

        api_instance = AEvaluatorsApi(_client)
        evaluator_execution_request = AEvaluatorExecutionRequest(
            evaluator_version_id=evaluator_version_id,
            request=request,
            response=response,
            turns=turns,
            tools=tools,
            contexts=contexts,
            expected_output=expected_output,
            variables=variables,
            tags=tags,
            user_id=user_id,
            session_id=session_id,
            system_prompt=system_prompt,
            project_id=project_id,
        )
        return await api_instance.evaluators_execute_by_name_create(
            name=name,
            evaluator_execution_request=evaluator_execution_request,
            _request_timeout=_request_timeout,
        )

    EvaluatorName = Literal[
        "Faithfulness",
        "Relevance",
        "Clarity",
        "Non_toxicity",
        "Helpfulness",
        "Politeness",
        "Formality",
        "Harmlessness",
        "Confidentiality",
        "Persuasiveness",
        "Sentiment_recognition",
        "Safety_for_Children",
        "Precision",
        "Originality",
        "Engagingness",
        "Conciseness",
        "Coherence",
        "Quality_of_Writing_Professional",
        "Quality_of_Writing_Creative",
        "Truthfulness",
        "Compliance_Preview",
        "Faithfulness_Swift",
        "Truthfulness_Swift",
        "Completeness",
        "Reading_Ease",
        "Answer_Willingness",
        "Information_Density",
        "Planning_Efficiency",
        "Faithfulness_to_Citations",
        "Translation_Quality",
        "Context_Completeness",
        "Summarization_Quality",
        "Tool_Selection",
        "Knowledge_Retention",
    ]

    class Eval(Enum):
        # TODO: These eval names should be retrieved automatically from the API or a shared config file
        Faithfulness = "901794f9-634c-4852-9e41-7c558f1ff1ab"
        Relevance = "bd789257-f458-4e9e-8ce9-fa6e86dc3fb9"
        Clarity = "9976d9f3-7265-4732-b518-d61c2642b14e"
        Non_toxicity = "e296e374-7539-4eb2-a74a-47847dd26fb8"
        Helpfulness = "88bc92d5-bebf-45e4-9cd1-dfa33309c320"
        Politeness = "2856903a-e48c-4548-b3fe-520fd88c4f25"
        Formality = "8ab6cf1a-42b5-4a23-a15c-21372816483d"
        Harmlessness = "379fee0a-4fd1-4942-833b-7d78d78b334d"
        Confidentiality = "2eaa0a02-47a9-48f7-9b47-66ad257f93eb"
        Persuasiveness = "85bb6a74-f5dd-4130-8dcc-cffdf72327cc"
        Sentiment_recognition = "e3782c1e-eaf4-4b2d-8d26-53db2160f1fd"
        Safety_for_Children = "39a8b5ba-de77-4726-a6b0-621d40b3cdf5"
        Precision = "767bdd49-5f8c-48ca-8324-dfd6be7f8a79"
        Originality = "e72cb54f-548a-44f9-a6ca-4e14e5ade7f7"
        Engagingness = "64729487-d4a8-42d8-bd9e-72fd8390c134"
        Conciseness = "be828d33-158a-4e92-a2eb-f4d96c13f956"
        Coherence = "e599886c-c338-458f-91b3-5d7eba452618"
        Quality_of_Writing_Professional = "059affa9-2d1c-48de-8e97-f81dd3fc3cbe"
        Quality_of_Writing_Creative = "060abfb6-57c9-43b5-9a6d-8a1a9bb853b8"
        Truthfulness = "053df10f-b0c7-400b-892e-46ce3aa1e430"
        Compliance_Preview = "4613f248-b60e-403a-bcdc-157d1c44194a"
        Faithfulness_Swift = "a3a5e97b-7fcb-441e-92f2-6e59aa473b89"
        Truthfulness_Swift = "c8c65e61-2dc8-4f29-865a-a5e59127d208"
        Completeness = "f0832c32-6beb-4383-a1ea-cdeb883d9044"
        Reading_Ease = "119d9587-9b33-4d43-a6b6-ba116dfee31b"
        Answer_Willingness = "c81034ae-9439-4c93-bab3-d159eaf072bf"
        Information_Density = "789a3dd8-7794-4f01-b229-3a99088c82fc"
        Planning_Efficiency = "ed3e16c2-2d4e-4ec2-b4af-b4b54a24009d"
        Faithfulness_to_Citations = "2569dddd-9b2c-4811-b35a-06fcfdc62d7a"
        Translation_Quality = "44e6722e-43e0-4791-a84f-0e1480adccd6"
        Context_Completeness = "7c8f9e3a-1b2d-4c5e-9f8a-6d7c4b3e2a1f"
        Summarization_Quality = "e7548186-af7c-49ef-be24-eda7c47adb6d"
        Tool_Selection = "dd120733-d107-4e77-a78b-5f04ade1a969"
        Knowledge_Retention = "193d0c31-6953-4f4d-840a-d42bdb23e5a7"

    def __getattr__(self, name: Union[EvaluatorName, str]) -> Union["PresetEvaluatorRunner", "APresetEvaluatorRunner"]:
        if name in self.Eval.__members__:
            context = self.client_context()
            if isinstance(context, AbstractContextManager):
                return PresetEvaluatorRunner(self.client_context, self.Eval.__members__[name].value, name)
            else:
                return APresetEvaluatorRunner(self.client_context, self.Eval.__members__[name].value, name)
        raise AttributeError(f"{name} is not a valid attribute")
