import Link from "next/link";
import { AlertTriangle, ChevronLeft, FileSearch, ShieldAlert } from "lucide-react";
import type { TokenRecord } from "@/lib/domain/types";

const sections = ["TOKEN", "MARKET", "LIQUIDITY", "HOLDER DISTRIBUTION", "CREATOR / DEV RISK", "TRANSACTION PATTERNS", "CONTRACT AND AUTHORITY CHECKS", "ENTRY CONDITIONS", "EXIT CONDITIONS", "REJECT REASONS", "DATA CONFIDENCE", "FINAL DECISION"];

export function TokenAutopsy({ mint, token }: { mint: string; token?: TokenRecord }) {
  return <div className="app-shell"><main className="main-content token-page"><Link href="/scanner" className="inline-link"><ChevronLeft size={14} /> Back to scanner</Link><header className="topbar token-head"><div><div className="eyebrow">TOKEN AUTOPSY / EVIDENCE REPORT</div><h1>{token?.symbol ?? "Unknown token"}</h1><div className="mint-address">{mint}</div></div><span className="status-pill muted"><span className="status-dot" />{token?.dataState ?? "UNAVAILABLE"}</span></header><section className="autopsy-alert"><ShieldAlert size={20} /><div><strong>No verified snapshot available</strong><span>This report is fail-closed. Missing market, holder, and authority data cannot be interpreted as safe.</span></div></section><section className="autopsy-grid">{sections.map((section) => <article className="panel autopsy-card" key={section}><div className="eyebrow">{section}</div><div className="autopsy-value"><FileSearch size={15} />{section === "FINAL DECISION" ? "NEEDS_REVIEW" : "No provider evidence"}</div><span>Source timestamps unavailable</span></article>)}</section><footer className="footer-note"><span><AlertTriangle size={14} />Never assume a token is safe because it is labeled as a pool or burn address.</span></footer></main></div>;
}
