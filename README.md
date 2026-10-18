# Grok Sniper

Grok Sniper is a mobile-first, paper-first Solana research and execution cockpit. It exposes a polished terminal UI, provider-aware token snapshots, structured agent contracts, deterministic risk controls, an idempotent paper order lifecycle, audit events, Supabase/PostgreSQL migrations, a BullMQ worker entry point, and deployment runbooks.

## Current operating mode

The app boots in `PAPER` mode with the emergency stop active. Without provider credentials, the UI reports `UNAVAILABLE` and the scanner stores no fabricated tokens, balances, fills, or performance. AI output cannot change risk limits or safety state. Live signing and mainnet execution are deliberately disabled; this repository does not accept seed phrases or raw private keys.

## Local development

```bash
npm install
npm run dev
npm run typecheck
npm run lint
npm test
npm run db:check
npm run build
```

The preview listens on `http://localhost:3000`. Use `/api/health` for readiness and `/api/tokens?mint=<mint>` for a server-side provider-backed snapshot when `HELIUS_API_KEY` or the DexScreener endpoint is configured. Provider responses are schema-validated and a partial snapshot remains `NEEDS_REVIEW` until essential holder/authority evidence is present.

State-changing routes (`POST /api/orders` and `POST /api/emergency-stop`) require `x-grok-operator` to match the server-only `OPERATOR_API_KEY` in production. Missing production authorization fails closed. The UI is intentionally a paper-mode operator console; production authentication should front these routes through Supabase Auth/session middleware before public release.

## Worker

Set `REDIS_URL` in a server-only environment and run `npm run worker`. The worker processes BullMQ jobs with concurrency one, logs structured state, and uses the provider adapter path for jobs that include a mint. Without Redis or a verified event-stream provider it stays degraded and does not invent discovery events.

## Data and deployment

Apply `database/migrations/001_initial.sql` in Supabase, keep RLS enabled, and use server-only environment variables from `.env.example`. Deploy the web app to Vercel and run the worker on a persistent host with durable Redis. See [docs/deployment.md](docs/deployment.md) for the launch checklist and rollback procedure.

## Remaining blockers before any live mode

Holder concentration/related-wallet analysis needs a verified data source, official Pump.fun/PumpSwap/Raydium event backfills need program-specific integration tests, Supabase Auth wiring needs a configured project, and a separately reviewed signer/transaction simulator must exist. These are intentional blockers, not implied capabilities.
