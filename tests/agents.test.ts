import { describe, expect, it } from "vitest";
import { AGENT_TIMEOUTS, makeAgentTasks, parseAgentOutput } from "@/lib/domain/agents";

describe("structured agent contracts", () => {
  it("creates every agent with a timeout and queued status", () => {
    const tasks = makeAgentTasks();
    expect(tasks).toHaveLength(10);
    expect(tasks.every((task) => task.status === "QUEUED" && task.timeoutMs === AGENT_TIMEOUTS[task.agent])).toBe(true);
  });
  it("turns malformed model output into a fail-closed unavailable response", () => {
    const result = parseAgentOutput({ decision: "APPROVE" });
    expect(result.decision).toBe("UNAVAILABLE");
    expect(result.confidence).toBe(0);
  });
});
