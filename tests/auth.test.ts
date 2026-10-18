import { afterEach, describe, expect, it, vi } from "vitest";
import { operatorAuthorized } from "@/lib/server/auth";

describe("operator authorization", () => {
  afterEach(() => vi.unstubAllEnvs());
  it("fails closed in production when no operator key is configured", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("OPERATOR_API_KEY", "");
    expect(operatorAuthorized(new Request("http://localhost"))).toBe(false);
  });
  it("accepts only the configured header", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("OPERATOR_API_KEY", "test-operator-key");
    expect(operatorAuthorized(new Request("http://localhost", { headers: { "x-grok-operator": "wrong" } }))).toBe(false);
    expect(operatorAuthorized(new Request("http://localhost", { headers: { "x-grok-operator": "test-operator-key" } }))).toBe(true);
  });
});
