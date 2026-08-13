import { createServerFn } from "@tanstack/react-start";

type ChatInput = {
  being: { name: string; role: string; purpose?: string | null; personality?: string | null; skills?: string[] | null; owner?: string | null };
  tred?: { name: string; duty: string; instructions?: string | null } | null;
  twin?: boolean;
  model?: string;
  messages: { role: "user" | "assistant"; content: string }[];
};

export const beingChat = createServerFn({ method: "POST" })
  .inputValidator((input: ChatInput) => input)
  .handler(async ({ data }) => {
    const { buildSystemPrompt, callGateway } = await import("./beings.server");
    const system = buildSystemPrompt(data.being, data.tred ?? null, !!data.twin);
    const history = data.messages.slice(-20).map((m) => ({ role: m.role, content: m.content.slice(0, 6000) }));
    return callGateway(system, history, data.model || "google/gemini-2.5-flash");
  });

type MissionInput = {
  being: { name: string; role: string; purpose?: string | null; personality?: string | null; skills?: string[] | null; owner?: string | null };
  tred?: { name: string; duty: string; instructions?: string | null } | null;
  twin?: boolean;
  model?: string;
  title: string;
  brief: string;
};

export const runMission = createServerFn({ method: "POST" })
  .inputValidator((input: MissionInput) => input)
  .handler(async ({ data }) => {
    const { buildSystemPrompt, callGateway } = await import("./beings.server");
    const system =
      buildSystemPrompt(data.being, data.tred ?? null, !!data.twin) +
      "\nYou have been assigned a mission. Deliver the finished work itself — not a plan to do it. Use short headings and bullets where helpful.";
    return callGateway(
      system,
      [{ role: "user", content: `Mission: ${data.title}\n\nBrief:\n${data.brief.slice(0, 6000)}` }],
      data.model || "google/gemini-2.5-flash",
    );
  });