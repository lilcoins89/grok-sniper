import { describe, expect, it } from "vitest";
import { fetchDexScreenerToken, fetchHeliusAsset } from "@/lib/server/provider-adapters";

const response = (body: unknown, status = 200) => Promise.resolve(new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } }));

describe("validated external provider adapters", () => {
  it("accepts a validated Solana market pair", async () => {
    const result = await fetchDexScreenerToken("So11111111111111111111111111111111111111112", () => response({ pairs: [{ chainId: "solana", dexId: "raydium", priceUsd: "1.25", liquidity: { usd: 1000 }, baseToken: { address: "mint", symbol: "TEST" } }] }), "https://example.test");
    expect(result.state).toBe("LIVE");
    expect(result.value?.symbol).toBe("TEST");
  });
  it("rejects malformed market data and provider errors", async () => {
    expect((await fetchDexScreenerToken("mint", () => response({ nope: true }), "https://example.test")).state).toBe("UNAVAILABLE");
    expect((await fetchDexScreenerToken("mint", () => response({}, 429), "https://example.test")).state).toBe("UNAVAILABLE");
  });
  it("validates Helius DAS asset responses", async () => {
    const result = await fetchHeliusAsset("mint", () => response({ result: { id: "mint", content: { metadata: { symbol: "TEST" } }, token_info: { decimals: 6 }, authorities: [] } }), "test-key", "https://example.test");
    expect(result.state).toBe("LIVE");
    expect(result.value?.decimals).toBe(6);
  });
});
