import { createClient } from "@supabase/supabase-js";
import type { OrderRecord, TokenRecord } from "@/lib/domain/types";
import { runtimeSnapshot, upsertOrder, upsertToken } from "./state";

function supabase() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  return url && key ? createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } }) : null;
}

export async function persistToken(token: TokenRecord) {
  upsertToken(token);
  const client = supabase();
  if (!client) return { persisted: false, reason: "SUPABASE credentials are not configured" };
  const { error } = await client.from("tokens").upsert({ mint: token.mint, symbol: token.symbol, name: token.name, venue: token.venue, discovered_at: token.discoveredAt, last_updated_at: token.lastUpdatedAt, data_state: token.dataState, provenance: token.provenance, liquidity_sol: token.liquiditySol, market_cap_usd: token.marketCapUsd, holder_count: token.holderCount, top10_concentration_pct: token.top10ConcentrationPct, strategy_score: token.strategyScore, risk_score: token.riskScore, eligibility: token.eligibility, rejection_reasons: token.rejectionReasons }, { onConflict: "mint" });
  return error ? { persisted: false, reason: error.message } : { persisted: true };
}

export async function findToken(mint: string): Promise<TokenRecord | undefined> {
  const local = runtimeSnapshot.tokens.find((item) => item.mint === mint);
  if (local) return local;
  const client = supabase();
  if (!client) return undefined;
  const { data, error } = await client.from("tokens").select("*").eq("mint", mint).maybeSingle();
  if (error || !data) return undefined;
  const token: TokenRecord = { mint: data.mint, symbol: data.symbol ?? undefined, name: data.name ?? undefined, venue: data.venue, discoveredAt: data.discovered_at, lastUpdatedAt: data.last_updated_at ?? undefined, dataState: data.data_state, provenance: data.provenance ?? [], liquiditySol: data.liquidity_sol ?? undefined, marketCapUsd: data.market_cap_usd ?? undefined, holderCount: data.holder_count ?? undefined, top10ConcentrationPct: data.top10_concentration_pct ?? undefined, strategyScore: data.strategy_score ?? undefined, riskScore: data.risk_score ?? undefined, eligibility: data.eligibility, rejectionReasons: data.rejection_reasons ?? [] };
  upsertToken(token);
  return token;
}

export async function persistOrder(order: OrderRecord) {
  upsertOrder(order);
  const client = supabase();
  if (!client) return { persisted: false, reason: "SUPABASE credentials are not configured" };
  const { error } = await client.from("orders").upsert({ id: order.id, idempotency_key: order.idempotencyKey, mint: order.mint, side: order.side, state: order.state, requested_sol: order.requestedSol, filled_sol: order.filledSol, average_price_usd: order.averagePriceUsd, signature: order.signature, mode: order.mode, reject_reasons: order.rejectReasons, created_at: order.createdAt, updated_at: order.updatedAt }, { onConflict: "idempotency_key" });
  return error ? { persisted: false, reason: error.message } : { persisted: true };
}
