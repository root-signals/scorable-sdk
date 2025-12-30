#!/usr/bin/env -S uv run --quiet --script
# /// script
# dependencies = [
#   "click",
#   "requests",
#   "pydantic",
#   "rich",
#   "pyyaml"
# ]
# ///

import json
import os
import sys
import time
import tempfile
from typing import Any, Optional, Union

import click
import requests
import yaml
from pydantic import BaseModel, model_validator
from rich.console import Console
from rich.live import Live
from rich.spinner import Spinner
from rich.syntax import Syntax
from rich.table import Table

console = Console()


# --- Pydantic Models for API Responses ---


class EvaluatorReference(BaseModel):
    """Model for evaluator reference objects."""

    id: str


class Judge(BaseModel):
    """Model for individual judge response."""

    id: str
    name: str
    intent: str
    created_at: str
    status: Optional[str] = None
    stage: Optional[str] = None
    evaluator_references: Optional[list[EvaluatorReference]] = None


class JudgeListResponse(BaseModel):
    """Model for paginated judge list response."""

    results: list[Judge]
    next: Optional[str] = None


class JudgeExecutionResponse(BaseModel):
    """Model for judge execution response."""

    # Using a flexible model since execution responses can vary significantly
    model_config = {"extra": "allow"}


class ApiResponse(BaseModel):
    """Generic API response model that allows any additional fields."""

    model_config = {"extra": "allow"}


class EvaluatorConfig(BaseModel):
    id: Optional[str] = None
    name: Optional[str] = None
    version_id: Optional[str] = None

    @model_validator(mode="after")
    def check_id_or_name(self):
        if self.name is None and self.id is None:
            raise ValueError('Either "id" or "name" must be provided for an evaluator.')
        if self.name is not None and self.id is not None:
            raise ValueError(
                'Provide either "id" or "name" for an evaluator, not both.'
            )
        return self


class PromptTestInput(BaseModel):
    vars: dict[str, Any]


class PromptTestConfig(BaseModel):
    prompts: list[str]
    inputs: list[PromptTestInput]
    models: list[str]
    evaluators: list[EvaluatorConfig]
    response_schema: Optional[dict[str, Any]] = None
    dataset_id: Optional[str] = None


class PromptTestEvaluatorReference(BaseModel):
    id: str
    name: str


class EvaluationResult(PromptTestEvaluatorReference):
    score: float | None
    justification: str | None


class Task(BaseModel):
    id: str
    status: str
    cost: Optional[str] = None
    llm_output: Optional[str] = None
    model_call_duration: Optional[float] = None
    evaluation_results: list[EvaluationResult] = []
    variables: dict[str, Any] = {}


class PromptTest(BaseModel):
    id: str
    model: str
    prompt: str
    tasks: list[Task] = []
    avg_cost: Optional[str] = None
    avg_model_call_duration: Optional[float] = None
    evaluators: list[PromptTestEvaluatorReference] = []


# --- Helper Functions ---


def print_json(data):
    console.print(
        Syntax(json.dumps(data, indent=2), "json", theme="native", line_numbers=False)
    )


def print_message(msg, style=""):
    console.print(msg, style=style)


def print_error(msg):
    console.print(f"[bold red]Error:[/bold red] {msg}")


def print_success(msg):
    console.print(f"[bold green]Success:[/bold green] {msg}")


def print_info(msg):
    console.print(f"[bold blue]Info:[/bold blue] {msg}")


def print_warning(msg):
    console.print(f"[bold yellow]Warning:[/bold yellow] {msg}")


API_KEY = os.getenv("SCORABLE_API_KEY")
BASE_URL = os.getenv("SCORABLE_API_URL", "https://api.scorable.ai")

session = requests.Session()


def _config_dir() -> str:
    return os.path.join(os.path.expanduser("~"), ".scorable")


def _settings_path() -> str:
    return os.path.join(_config_dir(), "settings.json")


def _load_settings() -> dict:
    try:
        path = _settings_path()
        if not os.path.exists(path):
            return {}
        with open(path, "r") as f:
            data = json.load(f)
            if isinstance(data, dict):
                return data
            return {}
    except Exception:
        return {}


def _save_settings(settings: dict) -> None:
    try:
        cfg_dir = _config_dir()
        os.makedirs(cfg_dir, mode=0o700, exist_ok=True)
        fd, tmp_path = tempfile.mkstemp(dir=cfg_dir)
        try:
            with os.fdopen(fd, "w") as tmp:
                json.dump(settings, tmp, indent=2)
            os.chmod(tmp_path, 0o600)
            os.replace(tmp_path, _settings_path())
        finally:
            if os.path.exists(tmp_path):
                try:
                    os.remove(tmp_path)
                except Exception:
                    pass
    except Exception:
        pass


# --- API Helper Functions ---


def _request(
    method: str,
    endpoint_segment: str,
    payload: Optional[dict] = None,
    params: Optional[dict] = None,
    response_model: Optional[type[BaseModel]] = None,
    raise_on_validation_error: bool = False,
) -> Union[BaseModel, str, None]:
    """A centralized function to handle all API requests with typed responses."""
    # Ensure the session is configured before the first request
    if not session.headers.get("Authorization"):
        effective_api_key = API_KEY or os.getenv("SCORABLE_API_KEY")
        if not effective_api_key:
            settings = _load_settings()
            if settings:
                effective_api_key = settings.get("temporary_api_key")
        if not effective_api_key:
            print_error("SCORABLE_API_KEY environment variable not set.")
            shell = os.environ.get("SHELL", "")
            if "fish" in shell:
                print_info("Run: set -x SCORABLE_API_KEY <your_key>")
            else:
                print_info("Run: export SCORABLE_API_KEY='<your_key>'")
            if sys.stdin.isatty() and sys.stdout.isatty():
                if click.confirm(
                    "No API key found. Create a temporary key now?", default=True
                ):
                    try:
                        resp = requests.post(
                            f"{BASE_URL}/create-demo-user/", timeout=60
                        )
                        resp.raise_for_status()
                        demo_user_contents = resp.json()
                        temp_key = demo_user_contents.get("api_key")
                        if temp_key:
                            os.environ["SCORABLE_API_KEY"] = temp_key
                            effective_api_key = temp_key
                            try:
                                current = _load_settings()
                                if not isinstance(current, dict):
                                    current = {}
                                current["temporary_api_key"] = temp_key
                                _save_settings(current)
                                print_success(
                                    "Temporary API key saved to ~/.scorable/settings.json"
                                )
                            except Exception:
                                pass
                            shell = os.environ.get("SHELL", "")
                            if "fish" in shell:
                                print_info(
                                    "To persist in your shell: set -x SCORABLE_API_KEY <paste_key_here>"
                                )
                            else:
                                print_info(
                                    "To persist in your shell: export SCORABLE_API_KEY='<paste_key_here>'"
                                )
                        else:
                            print_error(
                                "Temporary key response did not include 'api_key'."
                            )
                            sys.exit(1)
                    except requests.RequestException as e:
                        print_error(f"Failed to create temporary API key: {e}")
                        sys.exit(1)
                else:
                    print_info("Aborted. Please set SCORABLE_API_KEY and try again.")
                    sys.exit(1)
            else:
                print_info(
                    "Set SCORABLE_API_KEY and retry. Non-interactive session cannot prompt."
                )
                sys.exit(1)
        session.headers.update(
            {
                "Authorization": f"Api-Key {effective_api_key}",
                "Content-Type": "application/json",
                "Accept": "application/json",
                "User-Agent": "scorable-cli/1.0",
            }
        )

    if not endpoint_segment.endswith("/"):
        endpoint_segment += "/"

    url = f"{BASE_URL}/{endpoint_segment}"

    try:
        response = session.request(method, url, params, json=payload, timeout=60)
        response.raise_for_status()
        if response.status_code == 204:  # No Content
            return None

        # Parse JSON response
        json_data = response.json()

        try:
            # If a specific response model is provided, use it
            if response_model:
                return response_model.model_validate(json_data)

            # Auto-detect response type based on endpoint and data structure
            if endpoint_segment.strip("/") == "judges" and method == "GET":
                return JudgeListResponse.model_validate(json_data)
            elif (
                endpoint_segment.startswith("judges/")
                and endpoint_segment.count("/") == 2
                and method == "GET"
            ):
                return Judge.model_validate(json_data)
            elif "/execute/" in endpoint_segment and method == "POST":
                return JudgeExecutionResponse.model_validate(json_data)
            elif (
                endpoint_segment.startswith("judges/") and method in ["POST", "PATCH"]
            ) or endpoint_segment.endswith("/duplicate"):
                return Judge.model_validate(json_data)
            else:
                # Generic response for other endpoints
                return ApiResponse.model_validate(json_data)
        except Exception as validation_error:
            print_error(validation_error)
            if raise_on_validation_error:
                raise validation_error
            return None

    except requests.exceptions.HTTPError as e:
        print_error(
            f"API Error: {e.response.status_code} for {e.request.method} {e.request.url}"
        )
        try:
            print_json(e.response.json())
        except json.JSONDecodeError:
            print_error(f"Response content: {e.response.text}")
        return None
    except requests.exceptions.RequestException as e:
        print_error(f"Request failed: {e}")
        return None
    except json.JSONDecodeError:
        print_error(f"Failed to decode JSON response from API for {url}.")
        return None


# --- Core API Logic Functions ---
# These functions contain the primary logic and are called by the click commands.


def _list_judges(
    page_size,
    cursor,
    search,
    name,
    ordering,
    is_preset,
    is_public,
    show_global,
):
    """lists judges based on provided query parameters."""
    params = {
        "page_size": page_size,
        "cursor": cursor,
        "search": search,
        "name": name,
        "ordering": ordering,
        "is_preset": is_preset,
        "is_public": is_public,
        "show_global": show_global,
    }
    # Filter out None values so they aren't sent as query params
    actual_params = {k: v for k, v in params.items() if v is not None}

    print_info(f"Fetching judges with params: {actual_params}...")
    response_data = _request("GET", "judges", params=actual_params)

    if isinstance(response_data, JudgeListResponse):
        if not response_data.results:
            print_message("No judges found.")
            return

        table = Table(title="Judges")
        table.add_column("ID", style="cyan", no_wrap=True)
        table.add_column("Name", style="magenta")
        table.add_column("Intent", style="green", overflow="fold")
        table.add_column("Created At", style="blue")
        table.add_column("Status", style="yellow")

        for judge in response_data.results:
            table.add_row(
                judge.id, judge.name, judge.intent, judge.created_at, judge.status or ""
            )
        console.print(table)

        if response_data.next:
            print_info(
                f'Next page available. Use --cursor "{response_data.next.split("cursor=")[-1]}"'
            )
    elif response_data:
        print_json(
            response_data.model_dump()
            if isinstance(response_data, BaseModel)
            else response_data
        )


def _get_judge(judge_id):
    """Gets a specific judge by ID."""
    print_info(f"Fetching judge with ID: {judge_id}...")
    judge = _request("GET", f"judges/{judge_id}")
    if isinstance(judge, Judge):
        print_success(f"Judge '{judge.name}' details:")
        print_json(judge.model_dump())
    elif judge:
        print_json(judge.model_dump() if isinstance(judge, BaseModel) else judge)


def _create_judge(name, intent, stage, evaluator_references_json):
    """Creates a new judge."""
    payload = {"name": name, "intent": intent}
    if stage:
        payload["stage"] = stage
    if evaluator_references_json:
        try:
            payload["evaluator_references"] = json.loads(evaluator_references_json)
        except json.JSONDecodeError:
            print_error("Invalid JSON format for --evaluator-references.")
            return

    print_info("Attempting to create judge with payload:")
    print_json(payload)
    new_judge = _request("POST", "judges", payload=payload)
    if isinstance(new_judge, Judge):
        print_success("Judge created successfully!")
        print_json(new_judge.model_dump())
    elif new_judge:
        print_json(
            new_judge.model_dump() if isinstance(new_judge, BaseModel) else new_judge
        )


def _update_judge(judge_id, name, stage, evaluator_references_json):
    """Updates an existing judge."""
    payload = {}
    if name is not None:
        payload["name"] = name
    if stage is not None:
        payload["stage"] = stage
    if evaluator_references_json is not None:
        try:
            # An empty list `[]` clears the references.
            payload["evaluator_references"] = json.loads(evaluator_references_json)
        except json.JSONDecodeError:
            print_error("Invalid JSON format for --evaluator-references.")
            return

    if not payload:
        print_info("No update parameters provided. Aborting.")
        return

    print_info(f"Attempting to update judge {judge_id} with PATCH payload:")
    print_json(payload)
    updated_judge = _request("PATCH", f"judges/{judge_id}", payload=payload)
    if isinstance(updated_judge, Judge):
        print_success(f"Judge {judge_id} updated successfully!")
        print_json(updated_judge.model_dump())
    elif updated_judge:
        print_json(
            updated_judge.model_dump()
            if isinstance(updated_judge, BaseModel)
            else updated_judge
        )


def _delete_judge(judge_id):
    """Deletes a judge by ID."""
    print_info(f"Deleting judge {judge_id}...")
    response = _request("DELETE", f"judges/{judge_id}")
    if response is None:
        print_success(f"Judge {judge_id} deleted successfully.")


def _execute_judge(
    judge_id,
    request,
    response,
    contexts_json,
    expected_output,
    tags,
    user_id,
    session_id,
    system_prompt,
):  # noqa: C901
    """Executes a judge."""
    if not response and not sys.stdin.isatty():
        response = sys.stdin.read().strip()

    if not request and not response:
        print_error("Either --request or --response must be provided.")
        return

    payload = {}
    if request:
        payload["request"] = request
    if response:
        payload["response"] = response
    if expected_output:
        payload["expected_output"] = expected_output
    if tags:
        payload["tags"] = tags
    if user_id:
        payload["user_id"] = user_id
    if session_id:
        payload["session_id"] = session_id
    if system_prompt:
        payload["system_prompt"] = system_prompt

    if contexts_json:
        try:
            payload["contexts"] = json.loads(contexts_json)
        except json.JSONDecodeError:
            print_error("Invalid JSON for --contexts. Skipping.")
            return

    print_info(f"Attempting to execute judge {judge_id} with payload:")
    print_json(payload)
    result = _request("POST", f"judges/{judge_id}/execute", payload=payload)
    if result:
        print_success("Judge execution successful!")
        print_json(result.model_dump() if isinstance(result, BaseModel) else result)


def _execute_judge_by_name(
    judge_name,
    request,
    response,
    contexts_json,
    expected_output,
    tags,
    user_id,
    session_id,
    system_prompt,
):  # noqa: C901
    """Executes a judge by name."""
    if not response and not sys.stdin.isatty():
        response = sys.stdin.read().strip()

    if not request and not response:
        print_error("Either --request or --response must be provided.")
        return

    payload = {}
    if request:
        payload["request"] = request
    if response:
        payload["response"] = response
    if expected_output:
        payload["expected_output"] = expected_output
    if tags:
        payload["tags"] = tags
    if user_id:
        payload["user_id"] = user_id
    if session_id:
        payload["session_id"] = session_id
    if system_prompt:
        payload["system_prompt"] = system_prompt

    if contexts_json:
        try:
            payload["contexts"] = json.loads(contexts_json)
        except json.JSONDecodeError:
            print_error("Invalid JSON for --contexts. Skipping.")
            return

    print_info(f"Attempting to execute judge '{judge_name}' with payload:")
    print_json(payload)
    result = _request(
        "POST", "judges/execute/by-name", payload=payload, params={"name": judge_name}
    )
    if result:
        print_success("Judge execution by name successful!")
        print_json(result.model_dump() if isinstance(result, BaseModel) else result)


def _duplicate_judge(judge_id):
    """Duplicates an existing judge."""
    print_info(f"Duplicating judge ID: {judge_id}...")
    duplicated_judge = _request("POST", f"judges/{judge_id}/duplicate")
    if isinstance(duplicated_judge, Judge):
        print_success(f"Judge {judge_id} duplicated successfully!")
        print_json(duplicated_judge.model_dump())
    elif duplicated_judge:
        print_json(
            duplicated_judge.model_dump()
            if isinstance(duplicated_judge, BaseModel)
            else duplicated_judge
        )


def _execute_openai_judge(judge_id_in_path, model, messages_json, extra_body_json):
    """Executes a judge via OpenAI compatible endpoint."""
    payload = {}

    if judge_id_in_path:
        endpoint_path = f"judges/{judge_id_in_path}/openai/chat/completions"
        payload["model"] = model
        print_info(
            f"Executing Judge ID (via path): {judge_id_in_path} using OpenAI chat completions format."
        )
    else:
        endpoint_path = "judges/openai/chat/completions"
        payload["model"] = model
        print_info(
            f"Executing a Judge using generic OpenAI endpoint. Judge ID/Name: {model}"
        )

    try:
        payload["messages"] = json.loads(messages_json)
    except json.JSONDecodeError:
        print_error("Invalid JSON for --messages. Aborting.")
        return

    if extra_body_json:
        try:
            payload["extra_body"] = json.loads(extra_body_json)
        except json.JSONDecodeError:
            print_warning("Invalid JSON for --extra-body. Skipping.")

    print_info("Attempting to execute with OpenAI compatible payload:")
    print_json(payload)
    result = _request("POST", endpoint_path, payload=payload)
    if result:
        print_success("OpenAI compatible execution successful!")
        print_json(result.model_dump() if isinstance(result, BaseModel) else result)


def _run_prompt_tests(output_file=None, config_path="prompt-tests.yaml"):
    if not os.path.exists(config_path):
        print_error(
            f"'{config_path}' not found. Please run `pt init` first or specify a different config file with -c."
        )
        sys.exit(1)

    try:
        with open(config_path, "r") as f:
            config_data = yaml.safe_load(f)
        config = PromptTestConfig(**config_data)
    except (yaml.YAMLError, ValueError) as e:
        print_error(f"Error reading or validating '{config_path}': {e}")
        sys.exit(1)

    print_info("Starting prompt tests")

    experiments_to_track = {}  # Store prompt test data by ID

    for prompt in config.prompts:
        for model in config.models:
            evaluators_payload = [
                eval_config.model_dump(exclude_none=True)
                for eval_config in config.evaluators
            ]
            payload = {
                "prompt": prompt,
                "inputs": [item.vars for item in config.inputs],
                "model": model,
                "evaluators": evaluators_payload,
            }
            if config.response_schema:
                payload["response_schema"] = config.response_schema
            if config.dataset_id:
                payload["dataset_id"] = config.dataset_id

            response = _request(
                "POST",
                "prompt-tests",
                payload=payload,
                response_model=PromptTest,
            )
            if response:
                experiments_to_track[response.id] = response
                print_success(
                    f"Successfully created prompt test for model '{model}' with ID: {response.id}"
                )
            else:
                print_warning(
                    f"Failed to create prompt test for model '{model}' with prompt: {prompt}"
                )

    if not experiments_to_track:
        print_error("No prompt tests were created. Aborting.")
        sys.exit(1)

    print_info("Waiting for prompt tests to complete...")

    completed_experiments = {}

    with Live(console=console, screen=False, auto_refresh=False) as live:
        while len(completed_experiments) < len(experiments_to_track):
            all_experiments_data = []
            for exp_id in list(experiments_to_track.keys()):
                if exp_id in completed_experiments:
                    all_experiments_data.append(completed_experiments[exp_id])
                    continue

                exp_data = _request(
                    "GET",
                    f"prompt-tests/{exp_id}/",
                    response_model=PromptTest,
                )
                if not exp_data:
                    print_warning(f"Could not retrieve status for prompt test {exp_id}")
                    # Create a placeholder to keep it in the list
                    all_experiments_data.append(experiments_to_track[exp_id])
                    continue

                all_experiments_data.append(exp_data)

                # A prompt test is complete if it has tasks and all of them are in a terminal state.
                if exp_data.tasks and all(
                    task.status in ["completed", "failed"] for task in exp_data.tasks
                ):
                    completed_experiments[exp_id] = exp_data
                    print_success(f"Prompt test {exp_id} completed.")

            # Generate and display the progress table
            live.update(_generate_progress_table(all_experiments_data), refresh=True)

            if len(completed_experiments) == len(experiments_to_track):
                break
            time.sleep(1)

    print_success("All prompt tests completed.")
    final_prompt_tests = sorted(
        list(completed_experiments.values()), key=lambda x: x.id
    )
    _display_aggregated_results(final_prompt_tests)

    if output_file:
        try:
            output_data = [exp.model_dump() for exp in final_prompt_tests]
            with open(output_file, "w") as f:
                json.dump(output_data, f, indent=2)
            print_success(f"Results saved to {output_file}")
        except IOError as e:
            print_error(f"Failed to write results to {output_file}: {e}")

    prompt_test_ids = [exp.id for exp in final_prompt_tests]
    url = f"https://scorable.ai/prompt-testing/compare?ids={','.join(prompt_test_ids)}"
    print_info(f"\nView full results in the browser:\n{url}")


def _is_prompt_test_complete(experiment: PromptTest) -> bool:
    """Checks if an experiment is complete by looking at its tasks."""
    if not experiment.tasks:
        return False  # No tasks yet, so not complete

    return all(task.status in ["completed", "failed"] for task in experiment.tasks)


def _generate_progress_table(experiments: list[PromptTest]) -> Table:
    """Generates a table showing the progress of all experiments."""
    table = Table(title="Prompt Test Progress")
    table.add_column("Prompt Test ID", style="cyan")
    table.add_column("Status", style="yellow")
    table.add_column("Tasks Completed", style="magenta")

    for exp in experiments:
        completed_tasks = sum(
            1 for task in exp.tasks if task.status in ["completed", "failed"]
        )
        total_tasks = len(exp.tasks) if exp.tasks else 0

        is_complete = _is_prompt_test_complete(exp)

        if is_complete:
            status_display = "✅ Completed"
        else:
            status_display = Spinner("dots", text="Running")

        table.add_row(exp.id, status_display, f"{completed_tasks}/{total_tasks}")
    return table


def _display_aggregated_results(experiments: list[PromptTest]):
    """Displays the aggregated results of all experiments in a single table."""
    if not experiments:
        print_warning("No prompt test results to display.")
        return

    table = Table(title="Aggregated Prompt Test Results")
    table.add_column("Inputs", style="cyan")
    table.add_column("Prompt", style="blue")
    table.add_column("Model", style="green")
    table.add_column("Cost", style="yellow")
    table.add_column("Latency (s)", style="yellow")
    table.add_column("Output", style="magenta", overflow="fold")

    # Collect all unique evaluators from all experiments
    all_evaluators = {}
    for exp in experiments:
        for e in exp.evaluators:
            if e.id not in all_evaluators:
                all_evaluators[e.id] = e.name

    sorted_evaluator_ids = sorted(all_evaluators.keys())

    for eval_id in sorted_evaluator_ids:
        table.add_column(f"{all_evaluators[eval_id]}")

    for exp in experiments:
        if not exp.tasks:
            continue

        for task in exp.tasks:
            inputs_str = "\n".join(f"{k}: {v}" for k, v in task.variables.items())
            cost_str = task.cost if task.cost else "N/A"
            latency_str = (
                f"{task.model_call_duration:.3f}" if task.model_call_duration else "N/A"
            )

            row = [
                inputs_str,
                exp.prompt,
                exp.model,
                cost_str,
                latency_str,
                task.llm_output or "",
            ]

            scores = {res.id: res.score for res in task.evaluation_results}
            for eval_id in sorted_evaluator_ids:
                score = scores.get(eval_id, "N/A")
                if score == "N/A":
                    row.append(str(score))
                else:
                    if score > 0.8:
                        row.append(f"[green]{score}[/green]")
                    elif score <= 0.2:
                        row.append(f"[red]{score}[/red]")
                    else:
                        row.append(f"[yellow]{score}[/yellow]")

            table.add_row(*row)

    console.print(table)


# --- Click CLI Definition ---


@click.group()
def cli():
    """A CLI tool to interact with the Scorable API."""
    pass


@cli.group()
def judge():
    """Judge management commands."""
    pass


@cli.group()
def pt():
    """Prompt testing management commands."""
    pass


cli.add_command(pt, name="prompt-test")


@pt.command("init")
def init_pt_config():
    """Initializes a new prompt-tests.yaml file in the current directory."""
    config_path = "prompt-tests.yaml"
    if os.path.exists(config_path):
        print_warning(f"'{config_path}' already exists in the current directory.")
        if not click.confirm("Do you want to overwrite it?"):
            print_info("Aborted.")
            return
    try:
        with open(config_path, "w") as f:
            f.write("""# Prompt Testing Configuration
# This file defines a test suite of prompt and model combinations, with optional evaluators.

# List of prompt templates to test (use {{variable}} for input substitution)
prompts:
  - "Extract user information from the following text: {{text}}"
  - "Identify and extract the name, username, and email from: {{text}}"

# Input data for the prompt tests (each input will be tested with each prompt and model)
inputs:
  - vars:
      text: "John Doe, @johndoe, john@example.com"
  - vars:
      text: "Contact: Jane Smith (email: jane.smith@company.org, handle: @janesmith)"

# Alternative to inputs: Use a dataset by ID
# Uncomment the line below and comment out the inputs section to use a dataset instead
# dataset_id: "<uuid>"

# Models to test (each will be run with all prompt/input combinations)
models:
  - "gemini-2.5-flash-lite"
  - "gpt-4o-mini"

# Evaluators to assess the quality of responses
evaluators:
  - name: "Precision"
  - name: "Confidentiality"

# Optional: Response schema for structured output (JSON Schema format)
# Uncomment and modify the section below to enforce structured responses from the LLM
# response_schema:
#   type: "object"
#   required: ["name", "username", "email"]
#   properties:
#     name:
#       type: "string"
#       description: "The name of the user"
#     email:
#       type: "string"
#       format: "email"
#       description: "The email of the user"
#     username:
#       type: "string"
#       pattern: "^@[a-zA-Z0-9_]+$"
#       description: "The username of the user. Must start with @"
#   additionalProperties: false
""")
        print_success(f"'{config_path}' created successfully.")
        print_info("Update the file with your prompt test details and run `pt run`.")
    except IOError as e:
        print_error(f"Failed to write to '{config_path}': {e}")


@pt.command("run")
@click.option(
    "--output",
    "-o",
    help="Output file path to save prompt test results as JSON (e.g., results.json)",
)
@click.option(
    "--config",
    "-c",
    default="prompt-tests.yaml",
    help="Path to prompt testing configuration file (default: prompt-tests.yaml)",
)
def run_cmd(output, config):
    """Runs prompt tests from the prompt-tests.yaml file."""
    _run_prompt_tests(output, config)


@judge.command("list")
@click.option("--page-size", type=int, help="Number of results to return per page.")
@click.option("--cursor", help="The pagination cursor value.")
@click.option("--search", help="A search term to filter by.")
@click.option("--name", help="Filter by exact judge name.")
@click.option("--ordering", help="Which field to use for ordering the results.")
@click.option(
    "--is-preset/--not-is-preset", default=None, help="Filter by preset status."
)
@click.option(
    "--is-public/--not-is-public", default=None, help="Filter by public status."
)
@click.option(
    "--show-global/--not-show-global", default=None, help="Filter by global status."
)
def list_cmd(**kwargs):
    """list judges with optional filters."""
    _list_judges(**kwargs)


@judge.command("get")
@click.argument("judge_id")
def get_cmd(judge_id):
    """Get a specific judge by its ID."""
    _get_judge(judge_id)


@judge.command("create")
@click.option("--name", required=True, help="The name for the new judge.")
@click.option("--intent", required=True, help="The intent for the new judge.")
@click.option("--stage", help="The stage for the new judge.")
@click.option(
    "--evaluator-references",
    "evaluator_references_json",
    help="""JSON string for evaluator references. E.g., '[{"id": "eval-id"}]""",
)
def create_cmd(name, intent, stage, evaluator_references_json):
    """Create a new judge."""
    _create_judge(name, intent, stage, evaluator_references_json)


@judge.command("update")
@click.argument("judge_id")
@click.option("--name", help="The new name for the judge.")
@click.option("--stage", help="The new stage for the judge.")
@click.option(
    "--evaluator-references",
    "evaluator_references_json",
    help="""JSON string to update evaluator references. Use "[]" to clear.""",
)
def update_cmd(judge_id, name, stage, evaluator_references_json):
    """Update an existing judge (PATCH)."""
    _update_judge(judge_id, name, stage, evaluator_references_json)


@judge.command("delete")
@click.argument("judge_id")
@click.option(
    "--yes",
    is_flag=True,
    callback=lambda c, p, v: v or c.abort(),
    expose_value=False,
    prompt="Are you sure you want to delete this judge?",
)
def delete_cmd(judge_id):
    """Delete a judge by its ID."""
    _delete_judge(judge_id)


@judge.command("execute")
@click.argument("judge_id")
@click.option("--request", help="Request text.")
@click.option("--response", help="Response text to evaluate.")
@click.option(
    "--contexts",
    "contexts_json",
    help="""JSON list of context strings. E.g., '["ctx1"]""",
)
@click.option("--expected-output", help="Expected output text.")
@click.option("--tag", "tags", multiple=True, help="Add one or more tags.")
@click.option("--user-id", help="User identifier for tracking purposes.")
@click.option("--session-id", help="Session identifier for tracking purposes.")
@click.option("--system-prompt", help="System prompt that was used for the LLM call.")
def execute_cmd(**kwargs):
    """Execute a judge with interaction details."""
    _execute_judge(**kwargs)


@judge.command("execute-by-name")
@click.argument("judge_name")
@click.option("--request", help="Request text.")
@click.option("--response", help="Response text to evaluate.")
@click.option(
    "--contexts",
    "contexts_json",
    help="""JSON list of context strings. E.g., '["ctx1"]""",
)
@click.option("--expected-output", help="Expected output text.")
@click.option("--tag", "tags", multiple=True, help="Add one or more tags.")
@click.option("--user-id", help="User identifier for tracking purposes.")
@click.option("--session-id", help="Session identifier for tracking purposes.")
@click.option("--system-prompt", help="System prompt that was used for the LLM call.")
def execute_by_name_cmd(**kwargs):
    """Execute a judge by name with interaction details."""
    _execute_judge_by_name(**kwargs)


@judge.command("duplicate")
@click.argument("judge_id")
def duplicate_cmd(judge_id):
    """Duplicate an existing judge."""
    _duplicate_judge(judge_id)


@judge.command("exec-openai")
@click.argument("judge_id_in_path")
@click.option(
    "--model", required=True, help="LLM model for judge execution (e.g., gpt-4o)."
)
@click.option(
    "--messages",
    "messages_json",
    required=True,
    help="JSON string of the messages payload.",
)
@click.option(
    "--extra-body",
    "extra_body_json",
    help="Optional JSON string for extra_body parameters.",
)
def exec_openai_cmd(**kwargs):
    """Execute a specific judge via the OpenAI compatible API."""
    _execute_openai_judge(**kwargs)


@judge.command("exec-openai-generic")
@click.option(
    "--model",
    "model",
    required=True,
    help="Judge ID (or name) to use as the 'model' field.",
)
@click.option(
    "--messages",
    "messages_json",
    required=True,
    help="JSON string of the messages payload.",
)
@click.option(
    "--extra-body",
    "extra_body_json",
    help="Optional JSON string for extra_body parameters.",
)
def exec_openai_generic_cmd(model, messages_json, extra_body_json):
    """Execute a judge via the generic OpenAI API (judge is in the 'model' field)."""
    _execute_openai_judge(None, model, messages_json, extra_body_json)


if __name__ == "__main__":
    cli()
