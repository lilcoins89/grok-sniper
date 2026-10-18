# Provider integration notes

The web server owns provider credentials and uses `lib/server/provider-adapters.ts` to validate untrusted responses. DexScreener is queried for a Solana token pair when available. Helius DAS `getAsset` is queried for token metadata and authority information when `HELIUS_API_KEY` and a Helius RPC URL are configured. The resulting token is still `NEEDS_REVIEW` until holder-risk and essential safety evidence is present.

Provider timestamps and provenance are returned in the API. HTTP errors, malformed JSON, rate limits, missing keys, and empty pairs become `UNAVAILABLE`; no stale response is silently upgraded to live. Discovery of new launches remains an explicit worker integration task because a continuous event stream/backfill must be configured and tested against verified program interfaces.


## DexScreener latest token profiles

`GET /api/token-profiles/latest?limit=90` calls DexScreener's server-side `/token-profiles/latest/v1` endpoint. The response is schema-validated, limited to Solana profiles, deduplicated by token address, and returned with `cache-control: no-store`. Profiles are discovery candidates only: they are not treated as eligible tokens, balances, prices, or fills. Each candidate must still pass the full token snapshot, holder-risk, authority, liquidity, and deterministic risk pipeline.
