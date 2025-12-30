from __future__ import annotations

from contextlib import AbstractAsyncContextManager
from functools import partial
from typing import AsyncIterator, Dict, Iterator, List, Literal, Optional, Union, cast

from pydantic import StrictStr

from scorable.generated.openapi_aclient.models.judge_generator_request import (
    JudgeGeneratorRequest as AJudgeGeneratorRequest,
)
from scorable.generated.openapi_aclient.models.judge_generator_response import (
    JudgeGeneratorResponse as AJudgeGeneratorResponse,
)
from scorable.generated.openapi_aclient.models.judge_generator_visibility_enum import (
    JudgeGeneratorVisibilityEnum as AJudgeGeneratorVisibilityEnum,
)
from scorable.generated.openapi_aclient.models.judge_request import (
    JudgeRequest as AJudgeRequest,
)
from scorable.generated.openapi_aclient.models.status_enum import (
    StatusEnum as AStatusEnum,
)
from scorable.generated.openapi_client.models.judge_generator_request import JudgeGeneratorRequest
from scorable.generated.openapi_client.models.judge_generator_response import JudgeGeneratorResponse
from scorable.generated.openapi_client.models.judge_generator_visibility_enum import JudgeGeneratorVisibilityEnum
from scorable.generated.openapi_client.models.judge_request import JudgeRequest
from scorable.generated.openapi_client.models.status_enum import StatusEnum

from .generated.openapi_aclient import ApiClient as AApiClient
from .generated.openapi_aclient.api.judges_api import JudgesApi as AJudgesApi
from .generated.openapi_aclient.models.evaluator_reference_request import (
    EvaluatorReferenceRequest as AEvaluatorReferenceRequest,
)
from .generated.openapi_aclient.models.judge import Judge as AOpenApiJudge
from .generated.openapi_aclient.models.judge_execution_request import (
    JudgeExecutionRequest as AJudgeExecutionRequest,
)
from .generated.openapi_aclient.models.judge_execution_response import (
    JudgeExecutionResponse as AJudgeExecutionResponse,
)
from .generated.openapi_aclient.models.judge_list import JudgeList as AJudgeList
from .generated.openapi_aclient.models.paginated_judge_list_list import (
    PaginatedJudgeListList as APaginatedJudgeListList,
)
from .generated.openapi_aclient.models.patched_judge_request import (
    PatchedJudgeRequest as APatchedJudgeRequest,
)
from .generated.openapi_client import ApiClient
from .generated.openapi_client.api.judges_api import JudgesApi
from .generated.openapi_client.models.evaluator_reference_request import EvaluatorReferenceRequest
from .generated.openapi_client.models.judge import Judge as OpenApiJudge
from .generated.openapi_client.models.judge_execution_request import JudgeExecutionRequest
from .generated.openapi_client.models.judge_execution_response import JudgeExecutionResponse
from .generated.openapi_client.models.judge_list import JudgeList
from .generated.openapi_client.models.paginated_judge_list_list import PaginatedJudgeListList
from .generated.openapi_client.models.patched_judge_request import PatchedJudgeRequest
from .utils import ClientContextCallable, with_async_client, with_sync_client


class Judge(OpenApiJudge):
    """Wrapper for a single Judge.

    For available attributes, please check the (automatically
    generated) superclass documentation.
    """

    client_context: ClientContextCallable

    @classmethod
    def _wrap(cls, apiobj: Union[OpenApiJudge, JudgeList], client_context: ClientContextCallable) -> Judge:
        """Wrap API object into a Judge instance."""
        if not isinstance(apiobj, (OpenApiJudge, JudgeList)):
            raise ValueError(f"Wrong instance in _wrap: {apiobj!r}")
        obj = cast(Judge, apiobj)
        obj.__class__ = cls
        obj.client_context = client_context
        return obj

    @with_sync_client
    def run(
        self,
        *,
        response: str,
        request: Optional[str] = None,
        contexts: Optional[List[str]] = None,
        expected_output: Optional[str] = None,
        tags: Optional[List[str]] = None,
        user_id: Optional[str] = None,
        session_id: Optional[str] = None,
        system_prompt: Optional[str] = None,
        _request_timeout: Optional[int] = None,
        _client: ApiClient,
    ) -> JudgeExecutionResponse:
        """
        Run the judge.

        Args:
          response: LLM output to evaluate
          request: The prompt sent to the LLM. Optional.
          contexts: Optional documents passed to RAG evaluators
          expected_output: Optional expected output
          tags: Optional tags to add to the judge execution
          user_id: Optional user identifier for tracking purposes.
          session_id: Optional session identifier for tracking purposes.
          system_prompt: Optional system prompt that was used for the LLM call.
          _request_timeout: Optional timeout for the request
        """
        api_instance = JudgesApi(_client)
        execution_request = JudgeExecutionRequest(
            request=request,
            response=response,
            contexts=contexts,
            expected_output=expected_output,
            tags=tags,
            user_id=user_id,
            session_id=session_id,
            system_prompt=system_prompt,
        )
        return api_instance.judges_execute_create(
            judge_id=self.id,
            judge_execution_request=execution_request,
            _request_timeout=_request_timeout,
        )


class AJudge(AOpenApiJudge):
    """
    Async wrapper for a single Judge.

    For available attributes, please check the (automatically
    generated) superclass documentation.
    """

    client_context: ClientContextCallable

    @classmethod
    async def _awrap(cls, apiobj: Union[AOpenApiJudge, AJudgeList], client_context: ClientContextCallable) -> AJudge:
        if not isinstance(apiobj, (AOpenApiJudge, AJudgeList)):
            raise ValueError(f"Wrong instance in _wrap: {apiobj!r}")
        obj = cast(AJudge, apiobj)
        obj.__class__ = cls
        obj.client_context = client_context
        return obj

    @with_async_client
    async def arun(
        self,
        *,
        response: str,
        request: Optional[str] = None,
        contexts: Optional[List[str]] = None,
        expected_output: Optional[str] = None,
        tags: Optional[List[str]] = None,
        user_id: Optional[str] = None,
        session_id: Optional[str] = None,
        system_prompt: Optional[str] = None,
        _request_timeout: Optional[int] = None,
        _client: AApiClient,
    ) -> AJudgeExecutionResponse:
        """
        Asynchronously run the judge.

        Args:
          response: LLM output to evaluate
          request: The prompt sent to the LLM. Optional.
          contexts: Optional documents passed to RAG evaluators
          expected_output: Optional expected output
          tags: Optional tags to add to the judge execution
          user_id: Optional user identifier for tracking purposes.
          session_id: Optional session identifier for tracking purposes.
          system_prompt: Optional system prompt that was used for the LLM call.
          _request_timeout: Optional timeout for the request
        """
        api_instance = AJudgesApi(_client)
        execution_request = AJudgeExecutionRequest(
            contexts=contexts,
            expected_output=expected_output,
            request=request,
            response=response,
            tags=tags,
            user_id=user_id,
            session_id=session_id,
            system_prompt=system_prompt,
        )
        return await api_instance.judges_execute_create(
            judge_id=self.id,
            judge_execution_request=execution_request,
            _request_timeout=_request_timeout,
        )


class Judges:
    """
    Judges API

    Note:
        The construction of the API instance should be handled by
        accessing an attribute of a :class:`scorable.client.Scorable` instance.
    """

    def __init__(self, client_context: ClientContextCallable):
        self.client_context = client_context

    @with_sync_client
    def generate(
        self,
        *,
        intent: str,
        visibility: Literal["public", "unlisted"] = "unlisted",
        judge_id: Optional[str] = None,
        file_id: Optional[str] = None,
        stage: Optional[str] = None,
        extra_contexts: Optional[Dict[str, str | None]] = None,
        strict: bool = False,
        name: Optional[str] = None,
        overwrite: bool = False,
        _request_timeout: Optional[int] = None,
        _client: ApiClient,
    ) -> JudgeGeneratorResponse:
        """
        Generate a judge.

        Args:
          intent: Describe what you want the judge to build for.
            Example: I am building a chatbot for ecommerce and I would like to measure the quality of the responses.
          visibility: Whether the judge should be visible to everyone or only to your organization.
          judge_id: ID of an existing judge. If provided, the existing judge will be edited instead
            of generating a new one.
          file_id: ID of the file to use as context for the judge.
          stage: If the intent is ambiguous, you can specify the stage of the judge.
            Example: For a chatbot judge, we can specify the stage to be "response generation".
          extra_contexts: Extra contexts to be passed to the judge.
            Example: {"domain": "Ecommerce selling clothing"}, {"audience": "Women aged 25-35"}
          strict: Whether to fail generation if the intent is ambiguous.
          name: Name of the judge to generate. If not provided, a name will be generated for you.
          overwrite: Whether to overwrite an existing judge with the same name.
          _request_timeout: Optional timeout for the request

        Returns:
          Wrapper for the judge id and optionally an error code if the generation failed.
        """
        api_instance = JudgesApi(_client)
        judge_request = JudgeGeneratorRequest(
            intent=intent,
            stage=stage,
            extra_contexts=extra_contexts,
            strict=strict,
            overwrite=overwrite,
            name=name,
            judge_id=judge_id,
            file_id=file_id,
            visibility=JudgeGeneratorVisibilityEnum.GLOBAL
            if visibility == "public"
            else JudgeGeneratorVisibilityEnum.UNLISTED,
        )
        return api_instance.judges_generate_create(
            judge_generator_request=judge_request, _request_timeout=_request_timeout
        )

    @with_async_client
    async def agenerate(
        self,
        *,
        intent: str,
        visibility: Literal["public", "unlisted"] = "unlisted",
        judge_id: Optional[str] = None,
        file_id: Optional[str] = None,
        stage: Optional[str] = None,
        extra_contexts: Optional[Dict[str, str | None]] = None,
        strict: bool = False,
        name: Optional[str] = None,
        overwrite: bool = False,
        _request_timeout: Optional[int] = None,
        _client: AApiClient,
    ) -> AJudgeGeneratorResponse:
        """
        Asynchronously generate a judge.

        Args:
          intent: Describe what you want the judge to build for.
            Example: I am building a chatbot for ecommerce and I would like to measure the quality of the responses.
          visibility: Whether the judge should be visible to everyone or only to your organization.
          judge_id: ID of an existing judge. If provided, the existing judge will be edited instead
            of generating a new one.
          file_id: ID of the file to use as context for the judge.
          stage: If the intent is ambiguous, you can specify the stage of the judge.
            Example: For a chatbot judge, we can specify the stage to be "response generation".
          extra_contexts: Extra contexts to be passed to the judge.
            Example: {"domain": "Ecommerce selling clothing"}, {"audience": "Women aged 25-35"}
          strict: Whether to fail generation if the intent is ambiguous.
          name: Name of the judge to generate. If not provided, a name will be generated for you.
          overwrite: Whether to overwrite an existing judge with the same name.
          _request_timeout: Optional timeout for the request

        Returns:
          Wrapper for the judge id and optionally an error code if the generation failed.
        """
        api_instance = AJudgesApi(_client)
        judge_request = AJudgeGeneratorRequest(
            intent=intent,
            stage=stage,
            extra_contexts=extra_contexts,
            strict=strict,
            overwrite=overwrite,
            name=name,
            judge_id=judge_id,
            file_id=file_id,
            visibility=AJudgeGeneratorVisibilityEnum.GLOBAL
            if visibility == "public"
            else AJudgeGeneratorVisibilityEnum.UNLISTED,
        )
        return await api_instance.judges_generate_create(
            judge_generator_request=judge_request, _request_timeout=_request_timeout
        )

    @with_sync_client
    def create(
        self,
        *,
        name: str,
        intent: str,
        evaluator_references: Optional[List[EvaluatorReferenceRequest]] = None,
        stage: Optional[str] = None,
        status: Literal["unlisted", "listed", "public", "public_unlisted"] = "unlisted",
        _request_timeout: Optional[int] = None,
        _client: ApiClient,
    ) -> Judge:
        """
        Create a new judge with a name, intent, and list of evaluators.

        Args:
          name: Name for the judge
          intent: Intent for the judge
          evaluator_references: List of evaluator references to include in the judge
          stage: Stage for the judge
          status: Status of the judge
          _request_timeout: Optional timeout for the request
        """
        api_instance = JudgesApi(_client)
        request = JudgeRequest(
            name=name,
            intent=intent,
            evaluator_references=evaluator_references,
            stage=stage,
            status=StatusEnum(status),
        )
        return Judge._wrap(
            api_instance.judges_create(judge_request=request, _request_timeout=_request_timeout),
            client_context=self.client_context,
        )

    @with_async_client
    async def acreate(
        self,
        *,
        name: str,
        intent: str,
        evaluator_references: Optional[List[AEvaluatorReferenceRequest]] = None,
        stage: Optional[str] = None,
        status: Literal["unlisted", "listed", "public", "public_unlisted"] = "unlisted",
        _request_timeout: Optional[int] = None,
        _client: AApiClient,
    ) -> AJudge:
        """
        Asynchronously create a new judge with a name, intent, and list of evaluators.

        Args:
          name: Name for the judge
          intent: Intent for the judge
          evaluator_references: List of evaluator references to include in the judge
          stage: Stage for the judge
          status: Status of the judge
          _request_timeout: Optional timeout for the request
        """
        api_instance = AJudgesApi(_client)
        request = AJudgeRequest(
            name=name,
            intent=intent,
            evaluator_references=evaluator_references,
            stage=stage,
            status=AStatusEnum(status),
        )
        return await AJudge._awrap(
            await api_instance.judges_create(judge_request=request, _request_timeout=_request_timeout),
            client_context=self.client_context,
        )

    @with_sync_client
    def get(self, judge_id: str, *, _request_timeout: Optional[int] = None, _client: ApiClient) -> Judge:
        """
        Get a judge by ID.

        Args:
          judge_id: The judge to be fetched.
        """
        api_instance = JudgesApi(_client)
        return Judge._wrap(
            api_instance.judges_retrieve(id=judge_id, _request_timeout=_request_timeout),
            client_context=self.client_context,
        )

    @with_async_client
    async def aget(self, judge_id: str, *, _request_timeout: Optional[int] = None, _client: AApiClient) -> AJudge:
        """
        Asynchronously get a judge by ID.

        Args:
          judge_id: The judge to be fetched.
        """
        api_instance = AJudgesApi(_client)
        return await AJudge._awrap(
            await api_instance.judges_retrieve(id=judge_id, _request_timeout=_request_timeout),
            client_context=self.client_context,
        )

    @with_sync_client
    def delete(self, judge_id: str, *, _request_timeout: Optional[int] = None, _client: ApiClient) -> None:
        """
        Delete the judge.

        Args:
          judge_id: The judge to be deleted.
        """
        api_instance = JudgesApi(_client)
        return api_instance.judges_destroy(id=judge_id, _request_timeout=_request_timeout)

    @with_async_client
    async def adelete(self, judge_id: str, *, _request_timeout: Optional[int] = None, _client: AApiClient) -> None:
        """
        Asynchronously delete the judge.

        Args:
          judge_id: The judge to be deleted.
        """
        api_instance = AJudgesApi(_client)
        return await api_instance.judges_destroy(id=judge_id, _request_timeout=_request_timeout)

    @with_sync_client
    def list(self, *, limit: int = 100, _client: ApiClient) -> Iterator[Judge]:
        """
        Iterate through the judges.

        Args:
          limit: Number of entries to iterate through at most.
        """
        api_instance = JudgesApi(_client)
        cursor: Optional[StrictStr] = None
        while limit > 0:
            result: PaginatedJudgeListList = api_instance.judges_list(page_size=limit, cursor=cursor)
            if not result.results:
                return

            used_results = result.results[:limit]
            limit -= len(used_results)
            for judge in used_results:
                yield Judge._wrap(judge, client_context=self.client_context)

            if not (cursor := result.next):
                return

    async def alist(self, *, limit: int = 100) -> AsyncIterator[AJudge]:
        """
        Asynchronously iterate through the judges.

        Args:
          limit: Number of entries to iterate through at most.
        """
        context = self.client_context()
        assert isinstance(context, AbstractAsyncContextManager), "This method is not available in synchronous mode"
        async with context as client:
            api_instance = AJudgesApi(client)
            partial_list = partial(api_instance.judges_list)

            cursor: Optional[StrictStr] = None
            while limit > 0:
                result: APaginatedJudgeListList = await partial_list(page_size=limit, cursor=cursor)
                if not result.results:
                    return

                used_results = result.results[:limit]
                limit -= len(used_results)
                for judge in used_results:
                    yield await AJudge._awrap(judge, client_context=self.client_context)

                if not (cursor := result.next):
                    return

    @with_sync_client
    def update(
        self,
        judge_id: str,
        *,
        name: Optional[str] = None,
        evaluator_references: Optional[List[EvaluatorReferenceRequest]] = None,
        _request_timeout: Optional[int] = None,
        _client: ApiClient,
    ) -> Judge:
        """
        Update an existing judge.

        Args:
          judge_id: The judge to be updated.
          name: New name for the judge
          evaluator_references: New list of evaluator references
        """
        api_instance = JudgesApi(_client)
        request = PatchedJudgeRequest(
            name=name,
            evaluator_references=evaluator_references,
        )
        return Judge._wrap(
            api_instance.judges_partial_update(
                id=judge_id,
                patched_judge_request=request,
                _request_timeout=_request_timeout,
            ),
            client_context=self.client_context,
        )

    @with_async_client
    async def aupdate(
        self,
        judge_id: str,
        *,
        name: Optional[str] = None,
        evaluator_references: Optional[List[AEvaluatorReferenceRequest]] = None,
        _request_timeout: Optional[int] = None,
        _client: AApiClient,
    ) -> AJudge:
        """
        Asynchronously update an existing judge.

        Args:
          judge_id: The judge to be updated.
          name: New name for the judge
          evaluator_references: New list of evaluator references
        """
        api_instance = AJudgesApi(_client)
        request = APatchedJudgeRequest(
            name=name,
            evaluator_references=evaluator_references,
        )
        return await AJudge._awrap(
            await api_instance.judges_partial_update(
                id=judge_id,
                patched_judge_request=request,
                _request_timeout=_request_timeout,
            ),
            client_context=self.client_context,
        )

    @with_sync_client
    def run(
        self,
        judge_id: str,
        *,
        response: str,
        request: Optional[str] = None,
        contexts: Optional[List[str]] = None,
        expected_output: Optional[str] = None,
        tags: Optional[List[str]] = None,
        user_id: Optional[str] = None,
        session_id: Optional[str] = None,
        system_prompt: Optional[str] = None,
        _request_timeout: Optional[int] = None,
        _client: ApiClient,
    ) -> JudgeExecutionResponse:
        """
        Run a judge directly by ID.

        Args:
          judge_id: ID of the judge to run
          response: LLM output to evaluate
          request: The prompt sent to the LLM. Optional.
          contexts: Optional documents passed to RAG evaluators
          expected_output: Optional expected output
          tags: Optional tags to add to the judge execution
          user_id: Optional user identifier for tracking purposes.
          session_id: Optional session identifier for tracking purposes.
          system_prompt: Optional system prompt that was used for the LLM call.
          _request_timeout: Optional timeout for the request
        """
        api_instance = JudgesApi(_client)
        execution_request = JudgeExecutionRequest(
            request=request,
            response=response,
            contexts=contexts,
            expected_output=expected_output,
            tags=tags,
            user_id=user_id,
            session_id=session_id,
            system_prompt=system_prompt,
        )
        return api_instance.judges_execute_create(
            judge_id=judge_id,
            judge_execution_request=execution_request,
            _request_timeout=_request_timeout,
        )

    @with_async_client
    async def arun(
        self,
        judge_id: str,
        *,
        response: str,
        request: Optional[str] = None,
        contexts: Optional[List[str]] = None,
        expected_output: Optional[str] = None,
        tags: Optional[List[str]] = None,
        user_id: Optional[str] = None,
        session_id: Optional[str] = None,
        system_prompt: Optional[str] = None,
        _request_timeout: Optional[int] = None,
        _client: AApiClient,
    ) -> AJudgeExecutionResponse:
        """
        Asynchronously run a judge directly by ID.

        Args:
          judge_id: ID of the judge to run
          response: LLM output to evaluate
          request: The prompt sent to the LLM. Optional.
          contexts: Optional documents passed to RAG evaluators
          expected_output: Optional expected output
          tags: Optional tags to add to the judge execution
          user_id: Optional user identifier for tracking purposes.
          session_id: Optional session identifier for tracking purposes.
          system_prompt: Optional system prompt that was used for the LLM call.
          _request_timeout: Optional timeout for the request
        """
        api_instance = AJudgesApi(_client)
        execution_request = AJudgeExecutionRequest(
            contexts=contexts,
            expected_output=expected_output,
            request=request,
            response=response,
            tags=tags,
            user_id=user_id,
            session_id=session_id,
            system_prompt=system_prompt,
        )
        return await api_instance.judges_execute_create(
            judge_id=judge_id,
            judge_execution_request=execution_request,
            _request_timeout=_request_timeout,
        )

    @with_sync_client
    def run_by_name(
        self,
        name: str,
        *,
        response: str,
        request: Optional[str] = None,
        contexts: Optional[List[str]] = None,
        expected_output: Optional[str] = None,
        tags: Optional[List[str]] = None,
        user_id: Optional[str] = None,
        session_id: Optional[str] = None,
        system_prompt: Optional[str] = None,
        _request_timeout: Optional[int] = None,
        _client: ApiClient,
    ) -> JudgeExecutionResponse:
        """
        Run a judge by name.

        Args:
          name: Name of the judge to run
          response: LLM output to evaluate
          request: The prompt sent to the LLM. Optional.
          contexts: Optional documents passed to RAG evaluators
          expected_output: Optional expected output
          tags: Optional tags to add to the judge execution
          user_id: Optional user identifier for tracking purposes.
          session_id: Optional session identifier for tracking purposes.
          system_prompt: Optional system prompt that was used for the LLM call.
          _request_timeout: Optional timeout for the request
        """
        api_instance = JudgesApi(_client)
        execution_request = JudgeExecutionRequest(
            request=request,
            response=response,
            contexts=contexts,
            expected_output=expected_output,
            tags=tags,
            user_id=user_id,
            session_id=session_id,
            system_prompt=system_prompt,
        )
        return api_instance.judges_execute_by_name_create(
            name=name,
            judge_execution_request=execution_request,
            _request_timeout=_request_timeout,
        )

    @with_async_client
    async def arun_by_name(
        self,
        name: str,
        *,
        response: str,
        request: Optional[str] = None,
        contexts: Optional[List[str]] = None,
        expected_output: Optional[str] = None,
        tags: Optional[List[str]] = None,
        user_id: Optional[str] = None,
        session_id: Optional[str] = None,
        system_prompt: Optional[str] = None,
        _request_timeout: Optional[int] = None,
        _client: AApiClient,
    ) -> AJudgeExecutionResponse:
        """
        Asynchronously run a judge by name.

        Args:
          name: Name of the judge to run
          response: LLM output to evaluate
          request: The prompt sent to the LLM. Optional.
          contexts: Optional documents passed to RAG evaluators
          expected_output: Optional expected output
          tags: Optional tags to add to the judge execution
          user_id: Optional user identifier for tracking purposes.
          session_id: Optional session identifier for tracking purposes.
          system_prompt: Optional system prompt that was used for the LLM call.
          _request_timeout: Optional timeout for the request
        """
        api_instance = AJudgesApi(_client)
        execution_request = AJudgeExecutionRequest(
            contexts=contexts,
            expected_output=expected_output,
            request=request,
            response=response,
            tags=tags,
            user_id=user_id,
            session_id=session_id,
            system_prompt=system_prompt,
        )
        return await api_instance.judges_execute_by_name_create(
            name=name,
            judge_execution_request=execution_request,
            _request_timeout=_request_timeout,
        )
