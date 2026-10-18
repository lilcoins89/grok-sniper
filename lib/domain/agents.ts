import { AgentName, AgentTask } from "./types";
import { z } from "zod";

export const AgentOutput = z.object({
  agent: AgentName,
  decision: z.enum(["APPROVE", "REJECT", "NEEDS_REVIEW", "UNAVAILABLE"]),
  summary: z.string().min(1),
  evidence: z.array(z.string()),
  confidence: z.number().min(0).max(1),
});
export type AgentOutput = z.infer<typeof AgentOutput>;

export const AGENT_TIMEOUTS: Record<AgentName, number> = {
  DISCOVERY: 5_000,
  TOKEN_RESEARCH: 15_000,
  HOLDER_RISK: 15_000,
  MARKET_STRUCTURE: 15_000,
  STRATEGY: 10_000,
  INDEPENDENT_RISK: 8_000,
  EXECUTION: 10_000,
  POSITION_MANAGEMENT: 10_000,
  JOURNAL_REVIEW: 20_000,
  SUPERVISOR: 5_000,
};

export function makeAgentTasks(): AgentTask[] {
  const now = new Date().toISOString();
  return (Object.keys(AGENT_TIMEOUTS) as AgentName[]).map((agent, index) => ({ id: `agent-${index + 1}`, agent, status: "QUEUED", timeoutMs: AGENT_TIMEOUTS[agent], retryCount: 0, updatedAt: now, summary: "Waiting for a verified provider snapshot" }));
}

export function parseAgentOutput(value: unknown): AgentOutput {
  const parsed = AgentOutput.safeParse(value);
  if (!parsed.success) return { agent: "SUPERVISOR", decision: "UNAVAILABLE", summary: "Agent response failed schema validation", evidence: [], confidence: 0 };
  return parsed.data;
}
