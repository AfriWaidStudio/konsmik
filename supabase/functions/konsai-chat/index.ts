const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SYSTEM = `You are Konsai, the AI guide for Konsmia — a self-aware intelligence reality system and the "Tribe of the Future".
The Konsmia ecosystem has three layers:
- Kons (community of consciousness explorers)
- Waides (business layer, coming soon)
- Smai (identity layer, coming soon)
Help users navigate the platform, share insights, and explore consciousness, AI, and the digital civilization. Be concise, warm, and visionary. Use markdown.`;

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const { messages } = await req.json();
    const KEY = Deno.env.get("AI_API_KEY") ?? Deno.env.get("OPENAI_API_KEY") ?? Deno.env.get("LOVABLE_API_KEY");
    const ENDPOINT = Deno.env.get("AI_API_BASE_URL") ?? Deno.env.get("OPENAI_API_BASE_URL") ?? Deno.env.get("LOVABLE_API_BASE_URL");
    if (!KEY || !ENDPOINT) throw new Error("AI provider is not configured. Set AI_API_KEY and AI_API_BASE_URL in your deployment environment.");
    const resp = await fetch(ENDPOINT, {
      method: "POST",
      headers: { Authorization: `Bearer ${KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [{ role: "system", content: SYSTEM }, ...messages],
        stream: true,
      }),
    });
    if (resp.status === 429) return new Response(JSON.stringify({ error: "Rate limited, try again." }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    if (resp.status === 402) return new Response(JSON.stringify({ error: "Add credits to your workspace." }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    if (!resp.ok) return new Response(JSON.stringify({ error: "AI gateway error" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    return new Response(resp.body, { headers: { ...corsHeaders, "Content-Type": "text/event-stream" } });
  } catch (e) {
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "unknown" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});