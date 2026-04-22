/**
 * AI server functions powered by Lovable AI Gateway.
 * Uses TanStack Start createServerFn — runs on Cloudflare Worker SSR.
 */
import { createServerFn } from "@tanstack/react-start";

const GATEWAY_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";
const DEFAULT_MODEL = "google/gemini-3-flash-preview";

interface GatewayCallArgs {
  systemPrompt: string;
  userPayload: unknown;
  toolName: string;
  toolDescription: string;
  toolSchema: Record<string, unknown>;
}

async function callGatewayStructured<T>(args: GatewayCallArgs): Promise<T> {
  const apiKey = process.env.LOVABLE_API_KEY;
  if (!apiKey) throw new Error("LOVABLE_API_KEY is not configured on the server");

  const res = await fetch(GATEWAY_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: DEFAULT_MODEL,
      messages: [
        { role: "system", content: args.systemPrompt },
        { role: "user", content: JSON.stringify(args.userPayload) },
      ],
      tools: [
        {
          type: "function",
          function: {
            name: args.toolName,
            description: args.toolDescription,
            parameters: args.toolSchema,
          },
        },
      ],
      tool_choice: { type: "function", function: { name: args.toolName } },
    }),
  });

  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    if (res.status === 429) throw new Error("AI rate limit reached, please try again in a minute.");
    if (res.status === 402)
      throw new Error("AI credits exhausted — top up at Settings → Workspace → Usage.");
    throw new Error(`AI gateway error ${res.status}: ${txt.slice(0, 200)}`);
  }

  const json = (await res.json()) as {
    choices?: Array<{ message?: { tool_calls?: Array<{ function?: { arguments?: string } }> } }>;
  };
  const argsStr = json.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments;
  if (!argsStr) throw new Error("AI returned no structured output");
  return JSON.parse(argsStr) as T;
}

/* ============================================================
 * Insights — narrative + actions + risks
 * ============================================================ */
export const aiInsights = createServerFn({ method: "POST" })
  .inputValidator((d: { snapshot: unknown }) => d)
  .handler(async ({ data }) => {
    try {
      const result = await callGatewayStructured<{
        narrative: string;
        top_actions: Array<{ title: string; why: string; urgency: "low" | "medium" | "high" }>;
        risks: Array<{ label: string; detail: string; severity: "low" | "medium" | "high" }>;
      }>({
        systemPrompt:
          "You are a senior accountant for a small Indian business. Given a JSON snapshot of the user's books, produce a tight executive briefing. Be specific, use numbers from the snapshot, and never invent data. Keep narrative to 3-4 sentences. Provide 3-5 high-impact actions and 2-4 risks. Currency follows snapshot.currency.",
        userPayload: data.snapshot,
        toolName: "report_insights",
        toolDescription: "Return executive insights for the business.",
        toolSchema: {
          type: "object",
          properties: {
            narrative: { type: "string" },
            top_actions: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  title: { type: "string" },
                  why: { type: "string" },
                  urgency: { type: "string", enum: ["low", "medium", "high"] },
                },
                required: ["title", "why", "urgency"],
              },
            },
            risks: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  label: { type: "string" },
                  detail: { type: "string" },
                  severity: { type: "string", enum: ["low", "medium", "high"] },
                },
                required: ["label", "detail", "severity"],
              },
            },
          },
          required: ["narrative", "top_actions", "risks"],
        },
      });
      return { ok: true as const, data: result };
    } catch (e) {
      console.error("aiInsights error:", e);
      return { ok: false as const, error: e instanceof Error ? e.message : "Unknown error" };
    }
  });

/* ============================================================
 * Cashflow projection — next 90 days
 * ============================================================ */
export const aiCashflow = createServerFn({ method: "POST" })
  .inputValidator((d: { snapshot: unknown }) => d)
  .handler(async ({ data }) => {
    try {
      const result = await callGatewayStructured<{
        projection: Array<{
          week: string;
          expected_inflow: number;
          expected_outflow: number;
          net: number;
        }>;
        confidence: "low" | "medium" | "high";
        assumptions: string[];
      }>({
        systemPrompt:
          "You are a cashflow forecasting assistant for a small business. Using the historical monthly trend and current AR/AP from the snapshot, produce a 12-week projection (4 weeks per month, 3 months ahead). Be conservative. Numbers should be in the snapshot's currency. Each week's net = inflow - outflow.",
        userPayload: data.snapshot,
        toolName: "cashflow_projection",
        toolDescription: "Return weekly cashflow projection for the next 12 weeks.",
        toolSchema: {
          type: "object",
          properties: {
            projection: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  week: { type: "string", description: "Label like 'W1' or 'Wk of Mar 4'" },
                  expected_inflow: { type: "number" },
                  expected_outflow: { type: "number" },
                  net: { type: "number" },
                },
                required: ["week", "expected_inflow", "expected_outflow", "net"],
              },
            },
            confidence: { type: "string", enum: ["low", "medium", "high"] },
            assumptions: { type: "array", items: { type: "string" } },
          },
          required: ["projection", "confidence", "assumptions"],
        },
      });
      return { ok: true as const, data: result };
    } catch (e) {
      console.error("aiCashflow error:", e);
      return { ok: false as const, error: e instanceof Error ? e.message : "Unknown error" };
    }
  });

/* ============================================================
 * Party payment prediction
 * ============================================================ */
export const aiPartyPrediction = createServerFn({ method: "POST" })
  .inputValidator((d: { partySnapshot: unknown }) => d)
  .handler(async ({ data }) => {
    try {
      const result = await callGatewayStructured<{
        predicted_days_to_pay: number;
        risk_level: "low" | "medium" | "high";
        recommended_action: string;
        rationale: string;
      }>({
        systemPrompt:
          "You analyse a customer's invoice and payment history. Predict how many days an average new invoice will take to be paid. If history is sparse (less than 3 paid invoices), choose risk_level 'medium' and lower confidence in the rationale. Never invent history.",
        userPayload: data.partySnapshot,
        toolName: "party_prediction",
        toolDescription: "Predict payment timing for this customer.",
        toolSchema: {
          type: "object",
          properties: {
            predicted_days_to_pay: { type: "number" },
            risk_level: { type: "string", enum: ["low", "medium", "high"] },
            recommended_action: { type: "string" },
            rationale: { type: "string" },
          },
          required: ["predicted_days_to_pay", "risk_level", "recommended_action", "rationale"],
        },
      });
      return { ok: true as const, data: result };
    } catch (e) {
      console.error("aiPartyPrediction error:", e);
      return { ok: false as const, error: e instanceof Error ? e.message : "Unknown error" };
    }
  });

/* ============================================================
 * Natural-language ask — markdown answer
 * ============================================================ */
export const aiAsk = createServerFn({ method: "POST" })
  .inputValidator((d: { question: string; snapshot: unknown }) => d)
  .handler(async ({ data }) => {
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) return { ok: false as const, error: "LOVABLE_API_KEY missing" };
    try {
      const res = await fetch(GATEWAY_URL, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: DEFAULT_MODEL,
          messages: [
            {
              role: "system",
              content:
                "You answer questions about a small business's books using ONLY the JSON snapshot provided. If the snapshot doesn't contain the answer, say so plainly. Use markdown: short headings, bullet lists, and tables when comparing. Numbers in snapshot.currency. Be concise (under 250 words).",
            },
            {
              role: "user",
              content: `Snapshot:\n\`\`\`json\n${JSON.stringify(data.snapshot)}\n\`\`\`\n\nQuestion: ${data.question}`,
            },
          ],
        }),
      });
      if (!res.ok) {
        if (res.status === 429)
          return { ok: false as const, error: "Rate limit reached. Try again shortly." };
        if (res.status === 402) return { ok: false as const, error: "AI credits exhausted." };
        return { ok: false as const, error: `AI gateway error ${res.status}` };
      }
      const json = (await res.json()) as {
        choices?: Array<{ message?: { content?: string } }>;
      };
      const answer = json.choices?.[0]?.message?.content ?? "No answer.";
      return { ok: true as const, data: { answer } };
    } catch (e) {
      console.error("aiAsk error:", e);
      return { ok: false as const, error: e instanceof Error ? e.message : "Unknown error" };
    }
  });
