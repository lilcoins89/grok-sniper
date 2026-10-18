# Deployment and operations

## Web

Deploy the Next.js app to Vercel with the variables in `.env.example` configured as server-only values. `NEXT_PUBLIC_APP_MODE` may be `PAPER`; do not set live credentials or `LIVE_TRADING_ENABLED=true` for this build. Apply `database/migrations/001_initial.sql` in Supabase, enable Auth/RLS, and keep service-role credentials out of browser bundles.

The repository adapter persists token snapshots and paper orders to Supabase when `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are present. If they are absent, the app remains explicitly non-durable for local development and labels provider/ledger gaps rather than claiming persistence. State-changing routes require the server-only `OPERATOR_API_KEY` header in production; add Supabase Auth/session middleware before exposing the operator console publicly.

## Worker

Run `npm ci && npm run worker` on a persistent worker host with `REDIS_URL`, the provider variables, and a separate server-only environment. The worker uses BullMQ when Redis is configured. Without Redis or verified provider credentials it reports degraded/unavailable state and does not invent scans or fills. For a managed reserved process, keep the worker and web API in separate processes or deploy the worker on a dedicated persistent host. Redis is durable infrastructure, not an in-memory fallback.

## Safety launch checklist

Paper mode must be confirmed, the emergency stop must be active during setup, provider freshness must be observable, database RLS must be tested, the worker heartbeat must be visible, idempotency and reconciliation tests must pass, and no seed phrase/private key may exist in environment values exposed to the client. Live execution is not implemented as an enabled path here; do not activate it from an AI output, UI toggle, or environment edit without a separately reviewed signer, program allowlist, transaction simulation, and funded-wallet-specific risk profile.

## Rollback

Redeploy the last verified Vercel deployment and roll the worker image/process back to the matching commit. Preserve audit logs and do not delete orders or fills. If the worker is unhealthy, stop new entries with the emergency stop and leave it latched until reconciliation completes.
