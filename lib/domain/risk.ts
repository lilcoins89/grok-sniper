import type { RiskProfile, TokenRecord } from "./types";

export const PAPER_RISK_PROFILE: RiskProfile = {
  id: "paper-default",
  version: 1,
  mode: "PAPER",
  maxPositionSol: 0.05,
  maxConcurrentPositions: 3,
  maxTotalExposureSol: 0.15,
  maxDailyLossSol: 0.1,
  maxSlippagePct: 1,
  minLiquiditySol: 2,
  maxPriceImpactPct: 2,
  maxTop10ConcentrationPct: 45,
  requireFreshData: true,
  requireRiskData: true,
  emergencyStop: true,
};

export function activePaperRiskProfile(): RiskProfile {
  return {
    ...PAPER_RISK_PROFILE,
    requireFreshData: process.env.PAPER_SIMULATION_ENABLED === "true" ? false : PAPER_RISK_PROFILE.requireFreshData,
  };
}

export type RiskInput = {
  requestedSol: number;
  currentExposureSol: number;
  openPositions: number;
  dailyRealizedLossSol: number;
  expectedSlippagePct: number;
  expectedPriceImpactPct: number;
  token?: Pick<TokenRecord, "dataState" | "liquiditySol" | "top10ConcentrationPct" | "eligibility">;
  idempotencyKeySeen: boolean;
  profile?: RiskProfile;
};

export type RiskDecision = { allowed: boolean; reasons: string[]; checkedAt: string; profileVersion: number };

export function evaluateRisk(input: RiskInput): RiskDecision {
  const profile = input.profile ?? PAPER_RISK_PROFILE;
  const reasons: string[] = [];
  if (profile.emergencyStop) reasons.push("EMERGENCY_STOP_ACTIVE");
  if (input.requestedSol <= 0 || input.requestedSol > profile.maxPositionSol) reasons.push("POSITION_SIZE_LIMIT");
  if (input.currentExposureSol + input.requestedSol > profile.maxTotalExposureSol) reasons.push("TOTAL_EXPOSURE_LIMIT");
  if (input.openPositions >= profile.maxConcurrentPositions) reasons.push("CONCURRENT_POSITION_LIMIT");
  if (input.dailyRealizedLossSol >= profile.maxDailyLossSol) reasons.push("DAILY_LOSS_LIMIT");
  if (input.expectedSlippagePct > profile.maxSlippagePct) reasons.push("SLIPPAGE_LIMIT");
  if (input.expectedPriceImpactPct > profile.maxPriceImpactPct) reasons.push("PRICE_IMPACT_LIMIT");
  if (input.idempotencyKeySeen) reasons.push("DUPLICATE_ORDER");
  if (!input.token) reasons.push("MISSING_TOKEN_RISK_DATA");
  if (input.token) {
    if (input.token.eligibility !== "ELIGIBLE") reasons.push(`TOKEN_${input.token.eligibility}`);
    if (profile.requireFreshData && input.token.dataState !== "LIVE") reasons.push("STALE_OR_UNAVAILABLE_MARKET_DATA");
    if (input.token.liquiditySol === undefined) reasons.push("MISSING_LIQUIDITY_DATA");
    else if (input.token.liquiditySol < profile.minLiquiditySol) reasons.push("MINIMUM_LIQUIDITY_NOT_MET");
    if (input.token.top10ConcentrationPct === undefined) reasons.push("MISSING_HOLDER_RISK_DATA");
    else if (input.token.top10ConcentrationPct > profile.maxTop10ConcentrationPct) reasons.push("HOLDER_CONCENTRATION_LIMIT");
  }
  return { allowed: reasons.length === 0, reasons, checkedAt: new Date().toISOString(), profileVersion: profile.version };
}

export function holderConcentrationPct(balances: number[]): number | undefined {
  const positive = balances.filter((value) => Number.isFinite(value) && value >= 0);
  const total = positive.reduce((sum, value) => sum + value, 0);
  if (!total || positive.length === 0) return undefined;
  return (positive.sort((a, b) => b - a).slice(0, 10).reduce((sum, value) => sum + value, 0) / total) * 100;
}
