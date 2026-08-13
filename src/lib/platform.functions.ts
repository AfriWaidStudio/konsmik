import { createServerFn } from "@tanstack/react-start";

type ContextKind = "summary" | "counter" | "check";

const PROMPTS: Record<ContextKind, string> = {
  summary:
    "Summarise the post in at most 3 short sentences. Plain language, no preamble, no markdown headings.",
  counter:
    "Give the strongest good-faith counter-view to this post in at most 3 short sentences. Be fair, not hostile. No preamble.",
  check:
    "Assess the factual claims in this post. Say clearly whether they are broadly supported, disputed, unverifiable, or opinion — and why, in at most 4 short sentences. No preamble.",
};

export const generatePostContext = createServerFn({ method: "POST" })
  .inputValidator((input: { body: string; kind: ContextKind }) => input)
  .handler(async ({ data }) => {
    const key = process.env["AI_API_KEY"] ?? process.env["OPENAI_API_KEY"] ?? process.env["LOVABLE_API_KEY"];
    const endpoint =
      process.env["AI_API_BASE_URL"] ??
      process.env["OPENAI_API_BASE_URL"] ??
      process.env["LOVABLE_API_BASE_URL"];

    if (!key || !endpoint) throw new Error("AI is not configured. Set AI_API_KEY and AI_API_BASE_URL in your deployment environment.");

    const resp = await fetch(endpoint, {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content:
              "You are Konsai's Context Layer. You add calm, useful context to social posts. " +
              PROMPTS[data.kind],
          },
          { role: "user", content: data.body.slice(0, 4000) },
        ],
      }),
    });
    if (resp.status === 429) throw new Error("Rate limited — try again shortly.");
    if (resp.status === 402) throw new Error("AI credits exhausted.");
    if (!resp.ok) throw new Error("Context Layer unavailable");
    const json: any = await resp.json();
    const content: string = json?.choices?.[0]?.message?.content ?? "";
    return { content: content.trim(), model: "google/gemini-2.5-flash" };
  });