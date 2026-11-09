import { Response } from "express";
import { z } from "zod";
import { isAiConfigured, env } from "../lib/env";
import { ApiError } from "../middleware/errorHandler";
import { AuthedRequest } from "../middleware/auth";

function requireAi() {
  if (!isAiConfigured()) {
    throw new ApiError(503, "ai_not_configured", "AI features are disabled: set AI_PROVIDER_API_KEY to enable them");
  }
}

async function callModel(prompt: string): Promise<string> {
  const resp = await fetch(`${env.aiBaseUrl}/v1/messages`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": env.aiApiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: env.aiModel,
      max_tokens: 1024,
      messages: [{ role: "user", content: prompt }],
    }),
  });
  if (!resp.ok) throw new ApiError(502, "ai_provider_error", `AI provider returned ${resp.status}`);
  const data: any = await resp.json();
  return data?.content?.[0]?.text ?? "";
}

const textSchema = z.object({ text: z.string().min(1) });

export async function summarize(req: AuthedRequest, res: Response) {
  requireAi();
  const { text } = textSchema.parse(req.body);
  const result = await callModel(`Summarize this note concisely:\n\n${text}`);
  res.json({ result });
}

export async function fixGrammar(req: AuthedRequest, res: Response) {
  requireAi();
  const { text } = textSchema.parse(req.body);
  const result = await callModel(`Correct grammar and spelling, keep meaning and tone, return only corrected text:\n\n${text}`);
  res.json({ result });
}

export async function rewrite(req: AuthedRequest, res: Response) {
  requireAi();
  const { text, tone } = z.object({ text: z.string().min(1), tone: z.string().default("neutral") }).parse(req.body);
  const result = await callModel(`Rewrite the following note in a ${tone} tone, return only the rewritten text:\n\n${text}`);
  res.json({ result });
}

export async function generate(req: AuthedRequest, res: Response) {
  requireAi();
  const { prompt } = z.object({ prompt: z.string().min(1) }).parse(req.body);
  const result = await callModel(`Write a note based on this request:\n\n${prompt}`);
  res.json({ result });
}

export async function extractTasks(req: AuthedRequest, res: Response) {
  requireAi();
  const { text } = textSchema.parse(req.body);
  const result = await callModel(`Extract action items and deadlines from this note as a JSON array of {text, dueAt}:\n\n${text}`);
  res.json({ result });
}

export async function translate(req: AuthedRequest, res: Response) {
  requireAi();
  const { text, language } = z.object({ text: z.string().min(1), language: z.string() }).parse(req.body);
  const result = await callModel(`Translate the following note to ${language}, return only the translation:\n\n${text}`);
  res.json({ result });
}

export async function status(_req: AuthedRequest, res: Response) {
  res.json({ enabled: isAiConfigured() });
}
