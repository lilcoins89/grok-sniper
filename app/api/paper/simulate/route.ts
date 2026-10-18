import { NextResponse } from "next/server";
import { z } from "zod";
import { makePaperOrder } from "@/lib/domain/orders";
import { evaluateRisk } from "@/lib/domain/risk";
import { operatorAuthorized } from "@/lib/server/auth";
import { advancePaperOrder, addAuditEvent, runtimeSnapshot, upsertToken } from "@/lib/server/state";
import { persistOrder, persistToken } from "@/lib/server/repository";

const simulationSchema = z.object({
  mint: z.string().min(32),
  symbol: z.string().max(12).optional(),
  requestedSol: z.number().positive().max(0.05),
  liquiditySol: z.number().nonnegative(),
  top10ConcentrationPct: z.number().min(0).max(100),
  priceUsd: z.number().positive(),
  idempotencyKey: z.string().min(8),
});

export async function POST(request: Request) {
  if (process.env.PAPER_SIMULATION_ENABLED !== "true") return NextResponse.json({ ok: false, error: "Explicit paper simulation is disabled" }, { status: 404 });
  if (!operatorAuthorized(request)) return NextResponse.json({ ok: false, error: "Operator authorization required" }, { status: 401 });
  const parsed = simulationSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ ok: false, error: "Malformed simulation request" }, { status: 400 });
  const input = parsed.data;
  const now = new Date().toISOString();
  const token = {
    mint: input.mint,
    symbol: input.symbol,
    name: input.symbol ? `${input.symbol} paper fixture` : "Paper fixture",
    venue: "UNKNOWN" as const,
    discoveredAt: now,
    lastUpdatedAt: now,
    dataState: "SIMULATED" as const,
    provenance: ["operator-supplied paper simulation fixture"],
    liquiditySol: input.liquiditySol,
    holderCount: 100,
    top10ConcentrationPct: input.top10ConcentrationPct,
    strategyScore: 50,
    riskScore: 0,
    eligibility: "ELIGIBLE" as const,
    rejectionReasons: [],
  };
  const decision = evaluateRisk({ requestedSol: input.requestedSol, currentExposureSol: runtimeSnapshot.paper.openExposureSol, openPositions: runtimeSnapshot.paper.positions, dailyRealizedLossSol: Math.max(0, -runtimeSnapshot.paper.realizedPnlSol), expectedSlippagePct: 1, expectedPriceImpactPct: 0, token, idempotencyKeySeen: runtimeSnapshot.orders.some((order) => order.idempotencyKey === input.idempotencyKey), profile: runtimeSnapshot.risk });
  if (!decision.allowed) {
    runtimeSnapshot.counts.rejected += 1;
    addAuditEvent({ category: "RISK", action: "SIMULATION_REJECTED", outcome: "BLOCKED", detail: decision.reasons.join(", ") });
    return NextResponse.json({ ok: false, state: "RISK_REJECTED", reasons: decision.reasons, decision }, { status: 409 });
  }
  upsertToken(token);
  await persistToken(token);
  const order = makePaperOrder({ id: crypto.randomUUID(), idempotencyKey: input.idempotencyKey, mint: input.mint, side: "BUY", requestedSol: input.requestedSol });
  runtimeSnapshot.counts.submitted += 1;
  const filled = advancePaperOrder(order, input.requestedSol, input.priceUsd);
  await persistOrder(filled);
  return NextResponse.json({ ok: true, order: filled, token, paper: runtimeSnapshot.paper, snapshot: runtimeSnapshot }, { status: 201, headers: { "cache-control": "no-store" } });
}
