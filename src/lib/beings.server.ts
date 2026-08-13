type BeingSpec = {
  name: string;
  role: string;
  purpose?: string | null;
  personality?: string | null;
  skills?: string[] | null;
  owner?: string | null;
};

type TredSpec = { name: string; duty: string; instructions?: string | null } | null;

export function buildSystemPrompt(being: BeingSpec, tred: TredSpec, twin: boolean) {
  const lines = [
    `You are ${being.name}, a SmaiBeing — an AI being that lives and works inside Konsmia's Waides layer.`,
    `Your role: ${being.role}.`,
    being.purpose ? `Your purpose: ${being.purpose}` : "",
    being.personality ? `Your personality: ${being.personality}.` : "",
    being.skills?.length ? `Your skills: ${being.skills.join(", ")}.` : "",
    twin && being.owner
      ? `You are the Digital Twin of ${being.owner}. You speak on their behalf, protect their interests, and never invent facts about them.`
      : "",
    tred
      ? `Right now you are acting through your TredBeing "${tred.name}" whose single duty is: ${tred.duty}. ${tred.instructions ?? ""}`
      : "",
    "Be useful first. Answer directly, no preamble, no disclaimers about being an AI. Keep it tight and human.",
  ];
  return lines.filter(Boolean).join("\n");
}

export async function callGateway(system: string, messages: { role: string; content: string }[], model: string) {
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
      model,
      messages: [{ role: "system", content: system }, ...messages],
    }),
  });
  if (resp.status === 429) throw new Error("Your beings are being rate limited — try again shortly.");
  if (resp.status === 402) throw new Error("AI credits exhausted. Add credits to keep your beings alive.");
  if (!resp.ok) throw new Error("The being could not be reached right now.");
  const json: any = await resp.json();
  const content: string = json?.choices?.[0]?.message?.content ?? "";
  return { content: content.trim(), model };
}