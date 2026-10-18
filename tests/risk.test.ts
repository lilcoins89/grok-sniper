import { describe, expect, it } from "vitest";
import { evaluateRisk, holderConcentrationPct } from "@/lib/domain/risk";

const token = { dataState: "LIVE" as const, liquiditySol: 10, top10ConcentrationPct: 20, eligibility: "ELIGIBLE" as const };

describe("deterministic risk engine", () => {
  it("allows a valid paper order within all hard bounds", () => {
    const result = evaluateRisk({ requestedSol: 0.03, currentExposureSol: 0, openPositions: 0, dailyRealizedLossSol: 0, expectedSlippagePct: 0.5, expectedPriceImpactPct: 0.5, token, idempotencyKeySeen: false, profile: { id: "test", version: 1, mode: "PAPER", maxPositionSol: 0.05, maxConcurrentPositions: 3, maxTotalExposureSol: 0.15, maxDailyLossSol: 0.1, maxSlippagePct: 1, minLiquiditySol: 2, maxPriceImpactPct: 2, maxTop10ConcentrationPct: 45, requireFreshData: true, requireRiskData: true, emergencyStop: false } });
    expect(result.allowed).toBe(true);
  });
  it("fails closed for stale or missing holder data", () => {
    const result = evaluateRisk({ requestedSol: 0.01, currentExposureSol: 0, openPositions: 0, dailyRealizedLossSol: 0, expectedSlippagePct: 0.1, expectedPriceImpactPct: 0.1, token: { dataState: "STALE", liquiditySol: 5, top10ConcentrationPct: undefined, eligibility: "ELIGIBLE" }, idempotencyKeySeen: false });
    expect(result.allowed).toBe(false);
    expect(result.reasons).toEqual(expect.arrayContaining(["STALE_OR_UNAVAILABLE_MARKET_DATA", "MISSING_HOLDER_RISK_DATA"]));
  });
  it("rejects emergency stop, exposure, slippage, and duplicates", () => {
    const result = evaluateRisk({ requestedSol: 0.06, currentExposureSol: 0.12, openPositions: 3, dailyRealizedLossSol: 0.11, expectedSlippagePct: 1.5, expectedPriceImpactPct: 3, token, idempotencyKeySeen: true });
    expect(result.allowed).toBe(false);
    expect(result.reasons.length).toBeGreaterThan(6);
  });
  it("calculates top-ten concentration from balances", () => {
    expect(holderConcentrationPct([50, 30, 20])).toBe(100);
    expect(holderConcentrationPct([])).toBeUndefined();
  });
});
