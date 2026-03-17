export interface ExecutionLog {
  id: string;
  executed_item_name: string;
  execution_type: string;
  score: number | null;
  cost: number | null;
  created_at: string | null;
  session_id?: string;
  user_id?: string;
  tags?: string[];
}

export interface Evaluator {
  id: string;
  name: string;
  created_at: string;
  updated_at?: string | null;
  prompt?: string;
}

export interface Judge {
  id: string;
  name: string;
  intent: string;
  created_at: string;
  stage?: string;
  evaluator_references?: Array<{ id: string }>;
}

export interface JudgeListResponse {
  results: Judge[];
  next?: string;
}

export interface PromptTestTask {
  id: string;
  status: string;
  cost?: string;
  llm_output?: string;
  model_call_duration?: number;
  evaluation_results: Array<{
    id: string;
    name: string;
    score: number | null;
    justification: string | null;
  }>;
  variables: Record<string, unknown>;
}

export interface PromptTest {
  id: string;
  model: string;
  prompt: string;
  tasks: PromptTestTask[];
  avg_cost?: string;
  avg_model_call_duration?: number;
  evaluators: Array<{ id: string; name: string }>;
}

export interface EvaluatorConfig {
  id?: string;
  name?: string;
  version_id?: string;
}

export interface PromptTestInput {
  vars: Record<string, unknown>;
}

export interface PromptTestConfig {
  prompts: string[];
  inputs: PromptTestInput[];
  models: string[];
  evaluators: EvaluatorConfig[];
  response_schema?: Record<string, unknown>;
  dataset_id?: string;
}

export class CliError extends Error {
  constructor(
    public readonly exitCode: number,
    message: string,
  ) {
    super(message);
    this.name = "CliError";
  }
}
