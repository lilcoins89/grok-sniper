import { fillPaperOrder, transitionOrder } from "@/lib/domain/orders";
import { makeAgentTasks } from "@/lib/domain/agents";
import { activePaperRiskProfile } from "@/lib/domain/risk";
import { unavailable } from "@/lib/domain/providers";
import type { AuditEvent, OrderRecord, SystemSnapshot, TokenRecord } from "@/lib/domain/types";

const startedAt = new Date().toISOString();
const initialCapitalSol = Number(process.env.PAPER_INITIAL_CAPITAL_SOL ?? 0);

type PaperPosition = {
  mint: string;
  exposureSol: number;
  entryPriceUsd: number;
  markPriceUsd: number;
};

const createSnapshot = (): SystemSnapshot => ({
  mode: "PAPER",
  paper: { initialCapitalSol, equitySol: initialCapitalSol, realizedPnlSol: 0, unrealizedPnlSol: 0, openExposureSol: 0, positions: 0 },
  counts: { launchesScanned: 0, passingFilters: 0, opportunities: 0, submitted: 0, confirmed: 0, failed: 0, rejected: 0 },
  providers: [
    { name: "Helius", ...unavailable("helius", "HELIUS_API_KEY is not configured") },
    { name: "DexScreener", ...unavailable("dexscreener", "Market feed is not configured") },
    { name: "Solana RPC", ...unavailable("solana-rpc", "Using no live RPC in this environment") },
  ],
  worker: { state: "OFFLINE", detail: "Worker has not reported a heartbeat" },
  risk: activePaperRiskProfile(),
  events: [{ id: "audit-1", category: "SYSTEM", action: "PAPER_MODE_INITIALIZED", outcome: "RECORDED", detail: "Live execution is disabled by configuration; no signer is attached.", createdAt: startedAt }],
  tokens: [],
  orders: [],
  agents: makeAgentTasks(),
});

type GlobalWithGrok = typeof globalThis & {
  __grokSniperSnapshot?: SystemSnapshot;
  __grokSniperPositions?: Map<string, PaperPosition>;
};
const globalState = globalThis as GlobalWithGrok;
export const runtimeSnapshot = globalState.__grokSniperSnapshot ?? (globalState.__grokSniperSnapshot = createSnapshot());
const paperPositions = globalState.__grokSniperPositions ?? (globalState.__grokSniperPositions = new Map());

export function addAuditEvent(event: Omit<AuditEvent, "id" | "createdAt">): AuditEvent {
  const record = { ...event, id: `audit-${runtimeSnapshot.events.length + 1}`, createdAt: new Date().toISOString() };
  runtimeSnapshot.events = [record, ...runtimeSnapshot.events].slice(0, 40);
  return record;
}

export function upsertToken(token: TokenRecord) {
  runtimeSnapshot.tokens = [token, ...runtimeSnapshot.tokens.filter((item) => item.mint !== token.mint)].slice(0, 100);
  runtimeSnapshot.counts.launchesScanned = runtimeSnapshot.tokens.length;
}

export function upsertOrder(order: OrderRecord) {
  runtimeSnapshot.orders = [order, ...runtimeSnapshot.orders.filter((item) => item.id !== order.id)];
}

function recalculatePaperAccounting() {
  let openExposureSol = 0;
  let unrealizedPnlSol = 0;
  let positions = 0;
  for (const position of paperPositions.values()) {
    if (position.exposureSol <= 0) continue;
    positions += 1;
    openExposureSol += position.exposureSol;
    if (position.entryPriceUsd > 0) {
      unrealizedPnlSol += position.exposureSol * ((position.markPriceUsd / position.entryPriceUsd) - 1);
    }
  }
  runtimeSnapshot.paper.openExposureSol = Number(openExposureSol.toFixed(9));
  runtimeSnapshot.paper.unrealizedPnlSol = Number(unrealizedPnlSol.toFixed(9));
  runtimeSnapshot.paper.positions = positions;
  runtimeSnapshot.paper.equitySol = Number((runtimeSnapshot.paper.initialCapitalSol + runtimeSnapshot.paper.realizedPnlSol + unrealizedPnlSol).toFixed(9));
}

export function advancePaperOrder(order: OrderRecord, fillSol: number, averagePriceUsd: number): OrderRecord {
  if (!Number.isFinite(fillSol) || fillSol <= 0 || !Number.isFinite(averagePriceUsd) || averagePriceUsd <= 0) {
    throw new Error("Paper fills require positive finite fillSol and averagePriceUsd");
  }
  if (fillSol > order.requestedSol - order.filledSol + 1e-9) throw new Error("Paper fill exceeds remaining order size");

  const existing = paperPositions.get(order.mint);
  if (order.side === "SELL" && (!existing || fillSol > existing.exposureSol + 1e-9)) {
    throw new Error("Paper sell exceeds the open position");
  }

  let updated = order;
  if (updated.state === "INTENT") updated = transitionOrder(updated, "SUBMITTED");
  if (updated.state === "SUBMITTED") updated = transitionOrder(updated, "CONFIRMED");
  const previousFilledSol = updated.filledSol;
  updated = fillPaperOrder(updated, fillSol + previousFilledSol, averagePriceUsd);
  upsertOrder(updated);
  runtimeSnapshot.counts.confirmed += previousFilledSol === 0 ? 1 : 0;

  if (order.side === "BUY") {
    const current = existing ?? { mint: order.mint, exposureSol: 0, entryPriceUsd: averagePriceUsd, markPriceUsd: averagePriceUsd };
    const totalExposure = current.exposureSol + fillSol;
    const weightedEntry = totalExposure > 0 ? ((current.exposureSol * current.entryPriceUsd) + (fillSol * averagePriceUsd)) / totalExposure : averagePriceUsd;
    paperPositions.set(order.mint, { ...current, exposureSol: totalExposure, entryPriceUsd: weightedEntry, markPriceUsd: averagePriceUsd });
  } else if (existing) {
    const pnl = fillSol * ((averagePriceUsd / existing.entryPriceUsd) - 1);
    runtimeSnapshot.paper.realizedPnlSol = Number((runtimeSnapshot.paper.realizedPnlSol + pnl).toFixed(9));
    const remaining = existing.exposureSol - fillSol;
    if (remaining <= 1e-9) paperPositions.delete(order.mint);
    else paperPositions.set(order.mint, { ...existing, exposureSol: remaining, markPriceUsd: averagePriceUsd });
  }

  recalculatePaperAccounting();
  addAuditEvent({ category: "TRADE", action: updated.state === "FILLED" ? "PAPER_ORDER_FILLED" : "PAPER_ORDER_PARTIALLY_FILLED", outcome: "RECORDED", detail: `${order.side} ${fillSol.toFixed(6)} SOL at $${averagePriceUsd.toFixed(6)} for ${order.mint}.` });
  return updated;
}

export function markPaperPrice(mint: string, markPriceUsd: number) {
  if (!Number.isFinite(markPriceUsd) || markPriceUsd <= 0) throw new Error("Paper mark price must be positive and finite");
  const position = paperPositions.get(mint);
  if (!position) throw new Error("No open paper position for this mint");
  paperPositions.set(mint, { ...position, markPriceUsd });
  recalculatePaperAccounting();
  addAuditEvent({ category: "TRADE", action: "PAPER_MARK_PRICE_UPDATED", outcome: "RECORDED", detail: `${mint} marked to $${markPriceUsd.toFixed(6)}.` });
  return runtimeSnapshot.paper;
}
