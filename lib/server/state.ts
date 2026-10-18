import { makeAgentTasks } from "@/lib/domain/agents";
import { PAPER_RISK_PROFILE } from "@/lib/domain/risk";
import { unavailable } from "@/lib/domain/providers";
import type { AuditEvent, OrderRecord, SystemSnapshot, TokenRecord } from "@/lib/domain/types";

const startedAt = new Date().toISOString();
const createSnapshot = (): SystemSnapshot => ({
  mode: "PAPER",
  paper: { initialCapitalSol: 0, equitySol: 0, realizedPnlSol: 0, unrealizedPnlSol: 0, openExposureSol: 0, positions: 0 },
  counts: { launchesScanned: 0, passingFilters: 0, opportunities: 0, submitted: 0, confirmed: 0, failed: 0, rejected: 0 },
  providers: [
    { name: "Helius", ...unavailable("helius", "HELIUS_API_KEY is not configured") },
    { name: "DexScreener", ...unavailable("dexscreener", "Market feed is not configured") },
    { name: "Solana RPC", ...unavailable("solana-rpc", "Using no live RPC in this environment") },
  ],
  worker: { state: "OFFLINE", detail: "Worker has not reported a heartbeat" },
  risk: PAPER_RISK_PROFILE,
  events: [{ id: "audit-1", category: "SYSTEM", action: "PAPER_MODE_INITIALIZED", outcome: "RECORDED", detail: "Live execution is disabled by configuration; no signer is attached.", createdAt: startedAt }],
  tokens: [],
  orders: [],
  agents: makeAgentTasks(),
});

type GlobalWithGrok = typeof globalThis & { __grokSniperSnapshot?: SystemSnapshot };
const globalState = globalThis as GlobalWithGrok;
export const runtimeSnapshot = globalState.__grokSniperSnapshot ?? (globalState.__grokSniperSnapshot = createSnapshot());

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
