import type { DataState, TokenRecord } from "./types";

export type ProviderResult<T> = { state: DataState; value?: T; detail: string; checkedAt: string; provenance: string[] };

export function classifyFreshness(lastUpdatedAt: string | undefined, now = Date.now(), maxAgeMs = 60_000): DataState {
  if (!lastUpdatedAt) return "UNAVAILABLE";
  const timestamp = Date.parse(lastUpdatedAt);
  if (!Number.isFinite(timestamp)) return "UNAVAILABLE";
  return now - timestamp <= maxAgeMs ? "LIVE" : "STALE";
}

export function unavailable<T>(provider: string, detail = "Provider is not configured"): ProviderResult<T> {
  return { state: "UNAVAILABLE", detail, checkedAt: new Date().toISOString(), provenance: [provider] };
}

export function dedupeTokenEvents(events: Array<{ eventId: string; mint: string; observedAt: string }>): Array<{ eventId: string; mint: string; observedAt: string }> {
  const seen = new Set<string>();
  return events.filter((event) => {
    if (seen.has(event.eventId)) return false;
    seen.add(event.eventId);
    return true;
  });
}

export function tokenFromProvider(input: Partial<TokenRecord> & Pick<TokenRecord, "mint">): TokenRecord {
  return {
    mint: input.mint,
    symbol: input.symbol,
    name: input.name,
    venue: input.venue ?? "UNKNOWN",
    discoveredAt: input.discoveredAt ?? new Date().toISOString(),
    lastUpdatedAt: input.lastUpdatedAt,
    dataState: input.dataState ?? "UNAVAILABLE",
    provenance: input.provenance ?? [],
    liquiditySol: input.liquiditySol,
    marketCapUsd: input.marketCapUsd,
    holderCount: input.holderCount,
    top10ConcentrationPct: input.top10ConcentrationPct,
    strategyScore: input.strategyScore,
    riskScore: input.riskScore,
    eligibility: input.eligibility ?? "UNKNOWN",
    rejectionReasons: input.rejectionReasons ?? ["No verified provider snapshot available"],
  };
}
