import { z } from "zod";
import { unavailable, type ProviderResult } from "@/lib/domain/providers";
import { tokenFromProvider } from "@/lib/domain/providers";
import type { TokenRecord } from "@/lib/domain/types";

const pairSchema = z.object({
  chainId: z.string().optional(),
  dexId: z.string().optional(),
  url: z.string().optional(),
  priceUsd: z.string().optional(),
  marketCap: z.number().optional(),
  fdv: z.number().optional(),
  liquidity: z.object({ usd: z.number().optional() }).optional(),
  volume: z.object({ h24: z.number().optional() }).optional(),
  priceChange: z.object({ h1: z.number().optional(), h6: z.number().optional(), h24: z.number().optional() }).optional(),
  baseToken: z.object({ address: z.string(), name: z.string().optional(), symbol: z.string().optional() }).optional(),
}).passthrough();
const dexSchema = z.object({ pairs: z.array(pairSchema).nullable().optional() }).passthrough();
const profileSchema = z.object({ url: z.string().url().optional(), chainId: z.string(), tokenAddress: z.string().min(32).max(64), icon: z.string().url().optional(), header: z.string().url().optional(), description: z.string().max(2000).optional(), links: z.array(z.object({ type: z.string().optional(), label: z.string().optional(), url: z.string().url() })).optional() }).passthrough();
const profilesSchema = z.union([z.array(profileSchema), z.object({ data: z.array(profileSchema), limit: z.number().int().positive().max(90).optional() }).passthrough()]);
const assetSchema = z.object({ id: z.string(), content: z.object({ metadata: z.object({ name: z.string().optional(), symbol: z.string().optional() }).optional() }).optional(), token_info: z.object({ decimals: z.number().optional(), supply: z.number().optional() }).optional(), authorities: z.array(z.object({ address: z.string(), scopes: z.array(z.string()).optional() })).optional() }).passthrough();

export type MarketSnapshot = { mint: string; name?: string; symbol?: string; priceUsd?: number; liquidityUsd?: number; volume24hUsd?: number; marketCapUsd?: number; priceChange24hPct?: number; venue?: string; sourceUrl?: string; observedAt: string };
export type HeliusSnapshot = { mint: string; name?: string; symbol?: string; decimals?: number; supply?: number; authorities: string[]; observedAt: string };
export type LatestTokenProfile = { url?: string; chainId: string; tokenAddress: string; icon?: string; header?: string; description?: string; links?: { type?: string; label?: string; url: string }[]; observedAt: string };

type FetchLike = (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;

export async function fetchDexScreenerToken(mint: string, fetcher: FetchLike = fetch, baseUrl = process.env.DEXSCREENER_API_URL ?? "https://api.dexscreener.com"): Promise<ProviderResult<MarketSnapshot>> {
  if (!mint) return unavailable("dexscreener", "Mint address is required");
  try {
    const response = await fetcher(`${baseUrl.replace(/\/$/, "")}/latest/dex/tokens/${encodeURIComponent(mint)}`, { headers: { accept: "application/json" } });
    if (!response.ok) return unavailable("dexscreener", `Provider returned HTTP ${response.status}`);
    const parsed = dexSchema.safeParse(await response.json());
    const pair = parsed.success ? parsed.data.pairs?.find((item) => item.chainId === "solana") ?? parsed.data.pairs?.[0] : undefined;
    if (!pair || !parsed.success) return unavailable("dexscreener", "No validated Solana pair was returned");
    return { state: "LIVE", checkedAt: new Date().toISOString(), provenance: ["dexscreener"], detail: "Validated market snapshot", value: { mint, name: pair.baseToken?.name, symbol: pair.baseToken?.symbol, priceUsd: pair.priceUsd ? Number(pair.priceUsd) : undefined, liquidityUsd: pair.liquidity?.usd, volume24hUsd: pair.volume?.h24, marketCapUsd: pair.marketCap ?? pair.fdv, priceChange24hPct: pair.priceChange?.h24, venue: pair.dexId, sourceUrl: pair.url, observedAt: new Date().toISOString() } };
  } catch (error) {
    return unavailable("dexscreener", error instanceof Error ? error.message : "Provider request failed");
  }
}

export async function fetchDexScreenerLatestProfiles(limit = 90, fetcher: FetchLike = fetch, baseUrl = process.env.DEXSCREENER_API_URL ?? "https://api.dexscreener.com"): Promise<ProviderResult<LatestTokenProfile[]>> {
  const boundedLimit = Math.min(Math.max(Math.trunc(limit), 1), 90);
  try {
    const response = await fetcher(`${baseUrl.replace(/\/$/, "")}/token-profiles/latest/v1?limit=${boundedLimit}`, { headers: { accept: "application/json" } });
    if (!response.ok) return unavailable("dexscreener", `Provider returned HTTP ${response.status}`);
    const parsed = profilesSchema.safeParse(await response.json());
    if (!parsed.success) return unavailable("dexscreener", "DexScreener returned an unvalidated token-profile response");
    const sourceProfiles = Array.isArray(parsed.data) ? parsed.data : parsed.data.data;
    const seen = new Set<string>();
    const profiles: LatestTokenProfile[] = [];
    for (const profile of sourceProfiles) {
      if (profile.chainId.toLowerCase() !== "solana" || seen.has(profile.tokenAddress)) continue;
      seen.add(profile.tokenAddress);
      profiles.push({ ...profile, observedAt: new Date().toISOString() });
      if (profiles.length >= boundedLimit) break;
    }
    return { state: "LIVE", checkedAt: new Date().toISOString(), provenance: ["dexscreener-token-profiles"], detail: `Validated ${profiles.length} Solana token profiles`, value: profiles };
  } catch (error) {
    return unavailable("dexscreener", error instanceof Error ? error.message : "Provider request failed");
  }
}

export async function fetchHeliusAsset(mint: string, fetcher: FetchLike = fetch, apiKey = process.env.HELIUS_API_KEY, rpcUrl = process.env.HELIUS_RPC_URL ?? "https://mainnet.helius-rpc.com"): Promise<ProviderResult<HeliusSnapshot>> {
  if (!apiKey) return unavailable("helius", "HELIUS_API_KEY is not configured");
  try {
    const response = await fetcher(`${rpcUrl.replace(/\/$/, "")}/?api-key=${encodeURIComponent(apiKey)}`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ jsonrpc: "2.0", id: "grok-sniper", method: "getAsset", params: { id: mint } }) });
    if (!response.ok) return unavailable("helius", `Provider returned HTTP ${response.status}`);
    const body = await response.json() as { result?: unknown };
    const parsed = assetSchema.safeParse(body.result);
    if (!parsed.success) return unavailable("helius", "Helius returned an unvalidated asset response");
    return { state: "LIVE", checkedAt: new Date().toISOString(), provenance: ["helius-das"], detail: "Validated asset metadata", value: { mint, name: parsed.data.content?.metadata?.name, symbol: parsed.data.content?.metadata?.symbol, decimals: parsed.data.token_info?.decimals, supply: parsed.data.token_info?.supply, authorities: parsed.data.authorities?.map((authority) => authority.address) ?? [], observedAt: new Date().toISOString() } };
  } catch (error) {
    return unavailable("helius", error instanceof Error ? error.message : "Provider request failed");
  }
}

export async function loadTokenFromProviders(mint: string): Promise<TokenRecord> {
  const [market, asset] = await Promise.all([fetchDexScreenerToken(mint), fetchHeliusAsset(mint)]);
  const live = market.state === "LIVE" || asset.state === "LIVE";
  const rejectionReasons = [
    ...(market.state !== "LIVE" ? [market.detail] : []),
    ...(asset.state !== "LIVE" ? [asset.detail] : []),
    "Holder concentration requires a validated holder snapshot",
  ];
  return tokenFromProvider({ mint, symbol: market.value?.symbol ?? asset.value?.symbol, name: market.value?.name ?? asset.value?.name, venue: "UNKNOWN", dataState: live ? "LIVE" : "UNAVAILABLE", lastUpdatedAt: live ? new Date().toISOString() : undefined, provenance: [...market.provenance, ...asset.provenance], marketCapUsd: market.value?.marketCapUsd, eligibility: "NEEDS_REVIEW", rejectionReasons });
}
