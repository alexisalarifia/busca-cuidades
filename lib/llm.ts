// One thin wrapper around the OpenAI-compatible chat-completions API so that
// swapping providers, or escalating a low-confidence parse, is a config change
// rather than a refactor (brief §2). Server-only: reads INFERENCE_* env.

interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

interface ChatOptions {
  messages: ChatMessage[];
  /** Force strict JSON object output. */
  json?: boolean;
  maxTokens?: number;
  temperature?: number;
  /** Use the escalation model (larger, pricier) instead of the default. */
  escalate?: boolean;
  /**
   * Reasoning budget for gpt-oss-class models. Every task here is structured
   * extraction or grounded synthesis, so "low" is the right default: it keeps
   * the model from spending the whole token budget on reasoning and returning
   * empty content (seen on long trends/ingest contexts), and it's cheaper.
   * Set null to omit the param entirely for models that reject it.
   */
  reasoningEffort?: "low" | "medium" | "high" | null;
}

export interface ChatResult {
  content: string;
  model: string;
  usage: { prompt: number; completion: number; total: number } | null;
}

export function defaultModel(): string {
  return process.env.INFERENCE_MODEL ?? "";
}

export function escalateModel(): string {
  return process.env.INFERENCE_MODEL_ESCALATE ?? defaultModel();
}

export async function chat(opts: ChatOptions): Promise<ChatResult> {
  const base = process.env.INFERENCE_BASE_URL;
  const key = process.env.INFERENCE_API_KEY;
  const model = opts.escalate ? escalateModel() : defaultModel();
  if (!base || !key || !model) {
    throw new Error("Inference not configured (INFERENCE_* env missing).");
  }

  const effort = opts.reasoningEffort === undefined ? "low" : opts.reasoningEffort;

  const res = await fetch(`${base}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify({
      model,
      messages: opts.messages,
      temperature: opts.temperature ?? 0.1,
      max_tokens: opts.maxTokens ?? 700,
      ...(effort ? { reasoning_effort: effort } : {}),
      ...(opts.json ? { response_format: { type: "json_object" } } : {}),
    }),
    cache: "no-store",
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`Inference ${res.status}: ${detail.slice(0, 200)}`);
  }

  const json = await res.json();
  const content = json.choices?.[0]?.message?.content ?? "";
  const u = json.usage;
  return {
    content,
    model,
    usage: u
      ? { prompt: u.prompt_tokens, completion: u.completion_tokens, total: u.total_tokens }
      : null,
  };
}
