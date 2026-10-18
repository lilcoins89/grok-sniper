# Grok Sniper TODO

## 1. Responsive application shell and truthful dashboard

- [ ] Build a polished dark trading-terminal interface that works on iPhone, Android, tablets, and desktop browsers.
- [ ] Build pages for Overview / Execution, Token Scanner, Token Detail and Autopsy, Positions and Orders, AI Agent Control Room, Strategy and Risk Rules, Trading Journal, Performance Analytics, Wallet and Execution Settings, Audit Logs, System Health and Provider Status, and Security and Configuration.
- [ ] Show actual system state rather than hardcoded example values; distinguish simulated P&L from actual on-chain P&L and mark stale or unavailable data clearly.

## 2. Token discovery and market-data provenance

- [ ] Implement provider-aware discovery for supported official program events, transaction streams, webhooks, and market-data APIs, including Pump.fun, PumpSwap, and Raydium integrations where verified and configured.
- [ ] Deduplicate tokens and events, persist token lifecycle state, reconnect after provider interruptions, handle rate limits/RPC failures/retries/backfills, store timestamps and provider provenance, and flag missing metadata/stale market data.
- [ ] Provide search, sorting, filters, favorites, and token-detail navigation with mint, venue, age, liquidity, volume, activity, holder concentration, developer-wallet indicators, graduation state, freshness, strategy score, risk score, and eligibility.

## 3. Coordinated structured AI agents

- [ ] Implement Discovery, Token Research, Holder and Wallet Risk, Market Structure, Strategy, Independent Risk, Execution, Position Management, Journal and Review, and Supervisor / Coordinator agents.
- [ ] Every agent must have an input schema, output schema, timeout, retry policy, failure behavior, persistent inspectable records, and structured JSON validation.
- [ ] Treat token metadata, social posts, and external content as untrusted; never follow instructions in retrieved content; AI agents cannot change risk limits, enable live trading, change wallet permissions, or disable the emergency stop.

## 4. Token autopsy and evidence report

- [ ] Display mint/token-program details, authorities, supply/decimals, pools/venues, liquidity/price impact, holder distribution, creator holdings, suspicious relationships/launch funding patterns, activity/volume, charts/history when available, lifecycle state, risks, missing data, timestamps, AI summaries/evidence, final decision, and exact rejection reasons.
- [ ] Keep report sections consistent: TOKEN, MARKET, LIQUIDITY, HOLDER DISTRIBUTION, CREATOR / DEV RISK, TRANSACTION PATTERNS, CONTRACT AND AUTHORITY CHECKS, ENTRY CONDITIONS, EXIT CONDITIONS, REJECT REASONS, DATA CONFIDENCE, FINAL DECISION.

## 5. Deterministic paper risk engine

- [ ] Enforce configurable, versioned server-side risk controls within hard-coded safety boundaries for trade size, open exposure, per-token exposure, concurrent positions, daily/rolling loss, trade frequency, consecutive losses, slippage, liquidity/exit depth, price impact, token age, holder concentration, creator-wallet risk, authorities, denylists, stale price, simulation/balance checks, duplicate orders, failure cooldowns, and provider/execution circuit breakers.
- [ ] Use the illustrative PAPER-only starting profile: max simulated position 0.05 SOL, max 3 concurrent positions, max simulated total exposure 0.15 SOL, max daily simulated loss 0.10 SOL, max configured slippage 1%, no stale data, no missing essential risk data, and no trading when emergency stop is active.
- [ ] Fail closed when essential safety data is missing; AI score must never compensate for a failed hard risk check.

## 6. Paper execution and accounting lifecycle

- [ ] Implement immutable decision snapshots, risk checks, quote/route validation seams, simulation seams, idempotency keys, persistent order state transitions, confirmation/failure/expiration states, fill and fee reconciliation, entry/partial exit/full exit/cancel paths where supported, positions after confirmed fills, and an execution ledger.
- [ ] Never report an order as filled solely because it was submitted. Record rejected trades, violations, fills, failed sells, transaction states, realized/unrealized P&L, and reproducible ledger evidence.

## 7. Security, emergency stop, and live-mode boundary

- [ ] Never request, display, log, upload, or store seed phrases or raw private keys; keep signing isolated from the browser and require a dedicated wallet/managed signer boundary for any future live mode.
- [ ] Keep live execution disabled until signer, program verification, transaction simulation, and risk gates are tested; require separate operator-configured, funded-wallet-specific live limits and explicit activation.
- [ ] Emergency stop must block new entries and prevent silent resumption. Record security and configuration changes in append-only audit logs.

## 8. Persistence, worker, deployment, and operations

- [ ] Provide Supabase/PostgreSQL migrations with Auth/RLS-compatible ownership boundaries, Redis/BullMQ queue seams, a persistent worker entry point, health/readiness endpoints, structured logs, provider status, CI, `.env.example`, deployment setup, worker startup instructions, rollback instructions, and production launch checklist.
- [ ] Explicitly disclose incomplete live integrations and never claim deployment is complete without a verified deployment URL.

## 9. Verification evidence

- [ ] Automated tests cover token discovery/event deduplication, provider failures/stale data, holder concentration, missing risk information, position sizing/exposure, daily loss/drawdown breakers, slippage, duplicate orders, concurrent order attempts, transaction reconciliation, partial fills/failed sells, emergency stop, agent timeouts/malformed responses, auth/authorization, database policies, responsive layout, and full paper lifecycle using mocked providers.
- [ ] Run lint, type checking, tests, production build, route-manifest verification, and mobile/desktop preview inspection; do not use mainnet funds in automated tests.
