import { NextResponse } from "next/server";
import { z } from "zod";
import { evaluateRisk } from "@/lib/domain/risk";
import { makePaperOrder } from "@/lib/domain/orders";
import { addAuditEvent, runtimeSnapshot } from "@/lib/server";
import { findToken, persistOrder } from "@/lib/server/repository";
import { operatorAuthorized } from "@/lib/server/auth";

const requestSchema = z.object({ mint: z.string().min(32), requestedSol: z.number().positive(), idempotencyKey: z.string().min(8), side: z.enum(["BUY", "SELL"]).default("BUY") });

export async function POST(request: Request) {
  if (!operatorAuthorized(request)) return NextResponse.json({ ok: false, error: "Operator authorization required" }, { status: 401 });
  const parsed = requestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ ok: false, error: "Malformed order request" }, { status: 400 });
  const input = parsed.data;
  const duplicate = runtimeSnapshot.orders.some((order) => order.idempotencyKey === input.idempotencyKey);
  const token = await findToken(input.mint);
  const decision = evaluateRisk({ requestedSol: input.requestedSol, currentExposureSol: runtimeSnapshot.paper.openExposureSol, openPositions: runtimeSnapshot.paper.positions, dailyRealizedLossSol: Math.max(0, -runtimeSnapshot.paper.realizedPnlSol), expectedSlippagePct: 1, expectedPriceImpactPct: 0, token, idempotencyKeySeen: duplicate, profile: runtimeSnapshot.risk });
  if (!decision.allowed) {
    runtimeSnapshot.counts.rejected += 1;
    addAuditEvent({ category: "RISK", action: "ORDER_REJECTED", outcome: "BLOCKED", detail: decision.reasons.join(", ") });
    return NextResponse.json({ ok: false, state: "RISK_REJECTED", reasons: decision.reasons, decision }, { status: 409 });
  }
  const order = makePaperOrder({ id: crypto.randomUUID(), idempotencyKey: input.idempotencyKey, mint: input.mint, side: input.side, requestedSol: input.requestedSol });
  await persistOrder(order);
  runtimeSnapshot.counts.submitted += 1;
  addAuditEvent({ category: "TRADE", action: "PAPER_ORDER_INTENT_CREATED", outcome: "ALLOWED", detail: `Order ${order.id} created after risk approval.` });
  return NextResponse.json({ ok: true, order, decision }, { status: 201 });
}
