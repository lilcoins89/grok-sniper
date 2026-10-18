import { describe, expect, it } from "vitest";
import { evaluateRisk } from "@/lib/domain/risk";
import { fillPaperOrder, makePaperOrder, transitionOrder } from "@/lib/domain/orders";

describe("paper-trading lifecycle", () => {
  it("records a reproducible risk-approved fill path", () => {
    const token = { dataState: "LIVE" as const, liquiditySol: 8, top10ConcentrationPct: 18, eligibility: "ELIGIBLE" as const };
    const risk = evaluateRisk({ requestedSol: 0.02, currentExposureSol: 0, openPositions: 0, dailyRealizedLossSol: 0, expectedSlippagePct: 0.4, expectedPriceImpactPct: 0.3, token, idempotencyKeySeen: false, profile: { id: "paper", version: 1, mode: "PAPER", maxPositionSol: 0.05, maxConcurrentPositions: 3, maxTotalExposureSol: 0.15, maxDailyLossSol: 0.1, maxSlippagePct: 1, minLiquiditySol: 2, maxPriceImpactPct: 2, maxTop10ConcentrationPct: 45, requireFreshData: true, requireRiskData: true, emergencyStop: false } });
    expect(risk.allowed).toBe(true);
    const order = makePaperOrder({ id: "order-life", idempotencyKey: "life-0001", mint: "So11111111111111111111111111111111111111112", side: "BUY", requestedSol: 0.02 });
    const submitted = transitionOrder(order, "SUBMITTED");
    const confirmed = transitionOrder(submitted, "CONFIRMED");
    const filled = fillPaperOrder(confirmed, 0.02, 0.001);
    expect(filled.state).toBe("FILLED");
    expect(filled.mode).toBe("PAPER");
  });
});
