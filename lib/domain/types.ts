import { z } from "zod";

export const TradingMode = z.enum(["PAPER", "LIVE_APPROVAL", "LIVE_AUTONOMOUS"]);
export type TradingMode = z.infer<typeof TradingMode>;

export const DataState = z.enum(["LIVE", "SIMULATED", "STALE", "UNAVAILABLE"]);
export type DataState = z.infer<typeof DataState>;

export const TokenRecord = z.object({
  mint: z.string().min(32),
  symbol: z.string().optional(),
  name: z.string().optional(),
  venue: z.enum(["PUMP_FUN", "PUMP_SWAP", "RAYDIUM", "UNKNOWN"]),
  discoveredAt: z.string(),
  lastUpdatedAt: z.string().optional(),
  dataState: DataState,
  provenance: z.array(z.string()),
  liquiditySol: z.number().nonnegative().optional(),
  marketCapUsd: z.number().nonnegative().optional(),
  holderCount: z.number().int().nonnegative().optional(),
  top10ConcentrationPct: z.number().min(0).max(100).optional(),
  strategyScore: z.number().min(0).max(100).optional(),
  riskScore: z.number().min(0).max(100).optional(),
  eligibility: z.enum(["ELIGIBLE", "REJECTED", "NEEDS_REVIEW", "UNKNOWN"]),
  rejectionReasons: z.array(z.string()),
});
export type TokenRecord = z.infer<typeof TokenRecord>;

export const RiskProfile = z.object({
  id: z.string(),
  version: z.number().int().positive(),
  mode: z.literal("PAPER"),
  maxPositionSol: z.number().positive().max(0.05),
  maxConcurrentPositions: z.number().int().positive().max(3),
  maxTotalExposureSol: z.number().positive().max(0.15),
  maxDailyLossSol: z.number().positive().max(0.1),
  maxSlippagePct: z.number().positive().max(1),
  minLiquiditySol: z.number().nonnegative(),
  maxPriceImpactPct: z.number().positive().max(5),
  maxTop10ConcentrationPct: z.number().min(0).max(100),
  requireFreshData: z.boolean(),
  requireRiskData: z.boolean(),
  emergencyStop: z.boolean(),
});
export type RiskProfile = z.infer<typeof RiskProfile>;

export const OrderState = z.enum(["INTENT", "RISK_REJECTED", "SUBMITTED", "CONFIRMED", "PARTIALLY_FILLED", "FILLED", "FAILED", "CANCELLED", "EXPIRED"]);
export type OrderState = z.infer<typeof OrderState>;

export const OrderRecord = z.object({
  id: z.string(),
  idempotencyKey: z.string(),
  mint: z.string(),
  side: z.enum(["BUY", "SELL"]),
  state: OrderState,
  requestedSol: z.number().positive(),
  filledSol: z.number().nonnegative(),
  averagePriceUsd: z.number().nonnegative().optional(),
  slippagePct: z.number().nonnegative().optional(),
  signature: z.string().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
  mode: z.literal("PAPER"),
  rejectReasons: z.array(z.string()),
});
export type OrderRecord = z.infer<typeof OrderRecord>;

export const AgentName = z.enum(["DISCOVERY", "TOKEN_RESEARCH", "HOLDER_RISK", "MARKET_STRUCTURE", "STRATEGY", "INDEPENDENT_RISK", "EXECUTION", "POSITION_MANAGEMENT", "JOURNAL_REVIEW", "SUPERVISOR"]);
export type AgentName = z.infer<typeof AgentName>;

export const AgentTask = z.object({
  id: z.string(),
  agent: AgentName,
  status: z.enum(["QUEUED", "RUNNING", "SUCCEEDED", "FAILED", "TIMED_OUT", "NEEDS_REVIEW"]),
  timeoutMs: z.number().int().positive(),
  retryCount: z.number().int().nonnegative(),
  updatedAt: z.string(),
  summary: z.string(),
});
export type AgentTask = z.infer<typeof AgentTask>;

export const AuditEvent = z.object({
  id: z.string(),
  category: z.enum(["TRADE", "RISK", "SECURITY", "PROVIDER", "AGENT", "SYSTEM"]),
  action: z.string(),
  outcome: z.enum(["ALLOWED", "BLOCKED", "RECORDED", "FAILED"]),
  detail: z.string(),
  createdAt: z.string(),
});
export type AuditEvent = z.infer<typeof AuditEvent>;

export type SystemSnapshot = {
  mode: TradingMode;
  paper: {
    initialCapitalSol: number;
    equitySol: number;
    realizedPnlSol: number;
    unrealizedPnlSol: number;
    openExposureSol: number;
    positions: number;
  };
  counts: { launchesScanned: number; passingFilters: number; opportunities: number; submitted: number; confirmed: number; failed: number; rejected: number };
  providers: { name: string; state: DataState; detail: string; checkedAt: string }[];
  worker: { state: "HEALTHY" | "DEGRADED" | "OFFLINE"; lastHeartbeat?: string; detail: string };
  risk: RiskProfile;
  events: AuditEvent[];
  tokens: TokenRecord[];
  orders: OrderRecord[];
  agents: AgentTask[];
};
