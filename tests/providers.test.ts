import { describe, expect, it } from "vitest";
import { classifyFreshness, dedupeTokenEvents, unavailable } from "@/lib/domain/providers";

describe("provider safety boundaries", () => {
  it("labels missing providers unavailable", () => {
    expect(unavailable("helius").state).toBe("UNAVAILABLE");
  });
  it("classifies stale timestamps", () => {
    expect(classifyFreshness(new Date(Date.now() - 120_000).toISOString())).toBe("STALE");
    expect(classifyFreshness(undefined)).toBe("UNAVAILABLE");
  });
  it("deduplicates provider events by event id", () => {
    const items = dedupeTokenEvents([{ eventId: "1", mint: "a", observedAt: "now" }, { eventId: "1", mint: "a", observedAt: "later" }, { eventId: "2", mint: "b", observedAt: "now" }]);
    expect(items).toHaveLength(2);
    expect(items[0].observedAt).toBe("now");
  });
});
