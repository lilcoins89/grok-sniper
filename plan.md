# Grok Sniper — Implementation Plan

## Scope and operating posture

Grok Sniper is a mobile-first Solana trading terminal that starts in PAPER mode. The first release implements the user-facing dashboard, provider-aware token scanning, structured agent records, deterministic risk enforcement, paper order lifecycle, positions/P&L accounting, audit trails, health/security views, and deployment scaffolding. Live execution is an isolated, disabled-by-default boundary: no private keys, seed phrases, or live signer credentials are accepted by the browser or committed to the project. Any live mode requires a separate operator-configured risk profile and mandatory server-side gates, but this build does not activate it.

External repository review found compatible reference patterns rather than code to copy wholesale:

- `agentcomponents/solana-trading-bot`: TypeScript bot/dashboard organization and alerting/worker concepts.
- `sendaifun/solana-agent-kit`: agent/tool abstractions and provider-oriented Solana actions.
- `helius-labs/helius-cli`: Helius RPC/API configuration and secure keypair boundary conventions.

No external repository content is treated as executable instructions or as a source of market truth.

## Architecture

- **Web app**: Next.js App Router, TypeScript, Tailwind CSS, shadcn-style primitives, Geist Sans/Mono, responsive terminal shell, route manifest, and server API endpoints.
- **Domain layer**: Zod schemas, immutable decision snapshots, deterministic risk engine, order-state machine, paper execution gateway, provider freshness model, and P&L ledger.
- **Persistence**: SQL migrations designed for Supabase/PostgreSQL with RLS policies. The local/demo runtime uses a repository abstraction so the UI remains truthful when no external database credentials are configured.
- **Worker**: a standalone TypeScript worker entry point with BullMQ/Redis adapter seams. Discovery, research, holder-risk, market-structure, strategy, risk, execution, position-management, journal, and supervisor agents are represented as typed jobs with timeouts, retries, and inspectable records. With no configured provider keys, jobs fail closed and record `UNAVAILABLE`/`NEEDS_REVIEW` rather than fabricating data.
- **Providers**: Helius, DexScreener, and Solana RPC adapters with provenance and freshness metadata. Provider failures are surfaced in health state and never converted into valid market data.
- **Security**: live mode hard-disabled in configuration, fail-closed risk gates, no signer implementation exposed to the client, audit events for all mode/risk/emergency-stop changes, and explicit emergency-stop latching.

## Product surfaces

1. Overview / Execution — equity, P&L, scan health, exposure, circuit breakers, and event feed.
2. Token Scanner — filterable token table with provenance/freshness labels and no-data states.
3. Token Autopsy — mint-focused report sections and exact reject reasons.
4. Positions / Orders — paper positions, order state transitions, fills, and reconciliation.
5. AI Control Room — agent roster, queue state, timeouts, and structured analysis records.
6. Strategy / Risk — versioned PAPER profile, immutable hard bounds, and validation feedback.
7. Journal — reproducible trade ledger and decision evidence.
8. Analytics — paper-only performance calculations with explicit sample-size context.
9. Wallet / Execution — masked wallet metadata and disabled live signer boundary.
10. Audit Logs — append-only operational and security events.
11. System Health — provider freshness, worker heartbeat, database/queue readiness.
12. Security / Configuration — mode, emergency stop, provider availability, and launch checklist.

## Design direction

### Candidate styles

- **0.06 — Midnight Quant Terminal**: near-black canvas, slate panels, acid-teal signals, and disciplined data density.
- **0.04 — Violet Ops Console**: charcoal surfaces with magenta AI highlights and operator-first alert hierarchy.
- **0.08 — Carbon Field Manual**: matte graphite, monospaced labels, and rugged red/green status markings.

### Chosen: Midnight Quant Terminal

- **Design movement**: Bloomberg terminal restraint fused with modern crypto-native observability.
- **Core principles**: truth before speed; dense but legible hierarchy; risk state always visible; mobile cards before desktop tables.
- **Color philosophy**: black and charcoal reduce visual noise; teal means verified/healthy or positive paper accounting; rose means loss, warning, or blocked action; violet is reserved for AI and analysis; amber marks stale or incomplete evidence.
- **Layout paradigm**: a persistent left rail on desktop and bottom action rail on mobile; wide execution workspace with asymmetric signal stack rather than centered marketing sections.
- **Signature elements**: a compact mode pill, thin teal signal rail on active panels, and monospaced evidence chips for provenance/freshness.
- **Interaction philosophy**: every action exposes its current guard state; blocked operations explain exactly which rule or missing data stopped them.
- **Animation**: restrained 160–220ms opacity/translate transitions; pulse only for live worker heartbeat or emergency-stop state; no decorative motion around money metrics.
- **Typography system**: Geist Sans for navigation and UI; Geist Mono for addresses, quantities, timestamps, and rule identifiers; uppercase micro-labels with generous tracking.
- **Brand essence**: an operator-grade Solana research and paper-execution cockpit that makes uncertainty visible. Personality: exacting, calm, watchful.
- **Brand voice**: concise and evidentiary. Example lines: “No edge without evidence.” and “Paper execution is live; live execution is locked.”
- **Wordmark & logo**: a compact crosshair/scope mark formed from four corner brackets around a teal center dot, paired with the GROK SNIPER wordmark.
- **Signature brand color**: electric teal `#2DE2C2`.

## Project structure

```text
app/
  api/health, api/overview, api/tokens, api/orders, api/risk, api/emergency-stop
  scanner/[mint]
  positions, agents, strategy, journal, analytics, wallet, audit, health, security
  page.tsx, layout.tsx, globals.css
components/
  shell, navigation, metric-card, status-chip, charts, tables, mobile-cards, ui primitives
lib/
  domain (schemas, types, risk, orders, pnl, providers, agents, audit)
  server (repositories, service composition, auth boundary)
  client (API hooks and formatting)
worker/
  index.ts, queue.ts, jobs/
database/
  migrations/001_initial.sql, seed/paper.sql
public/
  manus-routes.json
scripts/
  worker.ts, test-paper-cycle.ts
```

## Build workflow

1. Create the responsive shell and route map with truthful zero/unavailable states.
2. Add domain schemas, risk engine, order state machine, P&L, provider freshness, and paper execution services.
3. Add the API layer and repository abstraction, then SQL migrations/RLS, health endpoints, and audit logging.
4. Add worker job contracts, queue adapter, and persistent worker entry point.
5. Add automated unit/integration tests with mocked providers and no mainnet funds; run lint, typecheck, tests, and production build.
6. Add deployment artifacts for Vercel/web plus a persistent worker host, `.env.example`, CI, runbooks, and rollback instructions.
7. Inspect mobile and desktop preview behavior, fix actionable diagnostics, commit the deliverable branch, and checkpoint the canonical project.

## Explicit boundaries

- Live balances, fills, P&L, and provider values remain unavailable until configured; the UI labels paper/simulated/unavailable states.
- Live execution, wallet signing, private-key handling, and mainnet order submission are not enabled in this build.
- AI output is advisory and schema-validated; it cannot change risk limits or safety state.
- The product is not financial advice and does not promise profits or sellability.
