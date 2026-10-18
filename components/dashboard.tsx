"use client";

import Link from "next/link";

import { useEffect, useState } from "react";
import { Activity, AlertTriangle, ArrowDownRight, ArrowUpRight, Bot, ChevronRight, CircleDot, Gauge, LockKeyhole, Radar, ShieldCheck, Siren, WalletCards } from "lucide-react";
import type { SystemSnapshot } from "@/lib/domain/types";
import { WalletConnect } from "@/components/wallet-connect";

const nav = [
  ["Overview", "/"], ["Token scanner", "/scanner"], ["Positions & orders", "/positions"], ["AI control room", "/agents"], ["Strategy & risk", "/strategy"], ["Trading journal", "/journal"], ["Analytics", "/analytics"], ["Wallet & execution", "/wallet"], ["Audit logs", "/audit"], ["System health", "/health"], ["Security", "/security"],
] as const;

function formatSol(value: number) { return `${value.toFixed(3)} SOL`; }

function StatusPill({ state, label }: { state: string; label: string }) {
  const tone = state === "LIVE" || state === "HEALTHY" ? "good" : state === "STALE" || state === "DEGRADED" ? "warn" : "muted";
  return <span className={`status-pill ${tone}`}><span className="status-dot" />{label}</span>;
}

function Metric({ label, value, detail, tone = "neutral", icon }: { label: string; value: string; detail: string; tone?: string; icon: React.ReactNode }) {
  return <article className={`metric-card ${tone}`}><div className="metric-top"><span className="metric-label">{label}</span><span className="metric-icon">{icon}</span></div><strong>{value}</strong><span className="metric-detail">{detail}</span></article>;
}

function Sparkline({ color = "#2de2c2" }: { color?: string }) {
  return <svg className="sparkline" viewBox="0 0 180 48" role="img" aria-label="No chart data available"><path d="M0 40 L20 40 L40 40 L60 40 L80 40 L100 40 L120 40 L140 40 L160 40 L180 40" fill="none" stroke={color} strokeWidth="2" strokeDasharray="3 5" opacity=".55" /></svg>;
}

export function Dashboard({ initial }: { initial: SystemSnapshot }) {
  const [snapshot, setSnapshot] = useState(initial);
  const [stopBusy, setStopBusy] = useState(false);
  const emergencyStop = snapshot.risk.emergencyStop;
  const hasPaperLedger = snapshot.counts.confirmed > 0 || snapshot.paper.positions > 0 || snapshot.paper.realizedPnlSol !== 0 || snapshot.paper.unrealizedPnlSol !== 0;

  useEffect(() => {
    let cancelled = false;
    const refresh = async () => {
      const response = await fetch("/api/overview", { cache: "no-store" });
      if (!cancelled && response.ok) setSnapshot(await response.json() as SystemSnapshot);
    };
    void refresh();
    const interval = window.setInterval(() => void refresh(), 2000);
    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, []);

  async function toggleEmergencyStop() {
    setStopBusy(true);
    const response = await fetch("/api/emergency-stop", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ active: !emergencyStop }) });
    if (response.ok) {
      const data = await response.json() as { active: boolean };
      setSnapshot((current) => ({ ...current, risk: { ...current.risk, emergencyStop: data.active } }));
    }
    setStopBusy(false);
  }

  return <div className="app-shell">
    <aside className="sidebar">
      <Link href="/" className="brand"><span className="brand-mark"><span /></span><span><b>GROK</b><em>SNIPER</em></span></Link>
      <div className="mode-card"><div className="eyebrow">TRADING MODE</div><div className="mode-line"><span className="mode-live-dot" />{snapshot.mode}<ChevronRight size={14} /></div><small>Live execution is locked</small></div>
      <nav className="nav-list">{nav.map(([label, href], index) => <Link href={href} key={href} className={`nav-item ${index === 0 ? "active" : ""}`}><span className="nav-bullet" />{label}{href === "/scanner" && <span className="nav-count">0</span>}</Link>)}</nav>
      <div className="sidebar-bottom"><div className="tiny-status"><span className="status-dot" /> Worker {snapshot.worker.state.toLowerCase()}</div><div className="tiny-status"><LockKeyhole size={13} /> Signer disabled</div></div>
    </aside>

    <main className="main-content">
      <header className="topbar"><div><div className="eyebrow">PAPER EXECUTION / OVERVIEW</div><h1>Execution cockpit</h1></div><div className="top-actions"><StatusPill state={snapshot.worker.state} label={`WORKER ${snapshot.worker.state}`} /><button className={`stop-button ${emergencyStop ? "armed" : ""}`} onClick={toggleEmergencyStop} disabled={stopBusy}><Siren size={15} />{emergencyStop ? "Emergency stop active" : "Arm emergency stop"}</button><div className="avatar">GS</div></div></header>

      <section className="hero-strip"><div className="hero-copy"><span className="signal-line" /><div><div className="eyebrow violet-text">PAPER LEDGER / TRUTHFUL STATE</div><h2>{hasPaperLedger ? "Paper evidence is moving." : "No edge without evidence."}</h2><p>{hasPaperLedger ? "Simulated fills and mark prices are reflected in the paper ledger. External market feeds remain unavailable until a verified provider is configured." : "Market feeds, balances, fills, and P&L stay unavailable until a verified provider is configured. The risk engine fails closed."}</p></div></div><div className="hero-meta"><span>PROFILE</span><strong>paper-default / v{snapshot.risk.version}</strong><span>SAFETY GATE</span><strong className={emergencyStop ? "rose-text" : "teal-text"}>{emergencyStop ? "ENTRY BLOCKED" : "ENTRY AVAILABLE"}</strong></div></section>

      <section className="metric-grid"><Metric label="Paper equity" value={formatSol(snapshot.paper.equitySol)} detail={snapshot.paper.initialCapitalSol > 0 ? `Initial capital ${formatSol(snapshot.paper.initialCapitalSol)}` : "Initial capital not configured"} icon={<WalletCards size={17} />} /><Metric label="Net P&L" value={formatSol(snapshot.paper.realizedPnlSol + snapshot.paper.unrealizedPnlSol)} detail={hasPaperLedger ? "Simulated paper ledger · mark-to-market" : "Simulated only · no fills"} tone="teal" icon={<ArrowUpRight size={17} />} /><Metric label="Open exposure" value={formatSol(snapshot.paper.openExposureSol)} detail={`Limit ${snapshot.risk.maxTotalExposureSol.toFixed(2)} SOL`} icon={<Gauge size={17} />} /><Metric label="Drawdown" value="0.00%" detail={`Daily loss guard ${snapshot.risk.maxDailyLossSol.toFixed(2)} SOL`} tone="violet" icon={<ArrowDownRight size={17} />} /></section>

      <section className="workspace-grid"><article className="panel chart-panel"><div className="panel-head"><div><div className="eyebrow">ACCOUNT CURVE</div><h3>Paper equity</h3></div><StatusPill state={hasPaperLedger ? "SIMULATED" : "UNAVAILABLE"} label={hasPaperLedger ? "MARKED PAPER DATA" : "NO LEDGER DATA"} /></div><div className="chart-empty"><div className="chart-value">{formatSol(snapshot.paper.equitySol)}</div><Sparkline /><span>{hasPaperLedger ? "Current paper equity includes the latest simulated fill and mark price." : "Connect a paper balance and generate a verified fill to plot equity."}</span></div><div className="chart-footer"><span>1D <b>—</b></span><span>7D <b>—</b></span><span>30D <b>—</b></span><span>ALL <b>—</b></span></div></article>
        <article className="panel guard-panel"><div className="panel-head"><div><div className="eyebrow">RISK GATES</div><h3>Execution guard</h3></div><ShieldCheck className="teal-icon" size={19} /></div><div className="guard-list"><div><span>Emergency stop</span><b className={emergencyStop ? "rose-text" : "teal-text"}>{emergencyStop ? "ACTIVE" : "READY"}</b></div><div><span>Max paper position</span><b>{snapshot.risk.maxPositionSol.toFixed(2)} SOL</b></div><div><span>Slippage cap</span><b>{snapshot.risk.maxSlippagePct.toFixed(2)}%</b></div><div><span>Required data</span><b>{snapshot.risk.requireFreshData && snapshot.risk.requireRiskData ? "FRESH + RISK" : "RELAXED"}</b></div></div><Link className="inline-link" href="/strategy">Review risk profile <ChevronRight size={14} /></Link></article></section>

      <section className="bottom-grid"><article className="panel"><div className="panel-head"><div><div className="eyebrow">DISCOVERY PIPELINE</div><h3>Token scanner</h3></div><Radar size={18} className="muted-icon" /></div><div className="empty-state"><div className="empty-icon"><Radar size={20} /></div><strong>Waiting for a verified feed</strong><span>Helius and DexScreener are not configured. No tokens are being inferred or fabricated.</span><Link className="inline-link" href="/scanner">Open scanner <ChevronRight size={14} /></Link></div></article><article className="panel"><div className="panel-head"><div><div className="eyebrow">AGENT BOARD</div><h3>Coordinator status</h3></div><Bot size={18} className="violet-icon" /></div><div className="agent-summary"><div className="agent-orb"><Bot size={23} /></div><div><strong>10 agents queued</strong><span>All analysis waits for provider data</span></div><StatusPill state="UNAVAILABLE" label="IDLE" /></div><div className="agent-rows">{snapshot.agents.slice(0, 4).map((agent) => <div key={agent.id}><span><CircleDot size={12} />{agent.agent.replaceAll("_", " ")}</span><b>{agent.status}</b></div>)}</div><Link className="inline-link" href="/agents">Open control room <ChevronRight size={14} /></Link></article><article className="panel"><div className="panel-head"><div><div className="eyebrow">ACTIVITY FEED</div><h3>Recent events</h3></div><Activity size={18} className="muted-icon" /></div><div className="activity-list">{snapshot.events.slice(0, 3).map((event) => <div className="activity-row" key={event.id}><span className="activity-dot" /><div><strong>{event.action.replaceAll("_", " ")}</strong><span>{event.detail}</span></div><time>now</time></div>)}</div><Link className="inline-link" href="/audit">View audit trail <ChevronRight size={14} /></Link></article></section>

      <section className="operator-grid"><WalletConnect /><article className="panel approval-panel"><div className="panel-head"><div><div className="eyebrow">APPROVAL BOUNDARY</div><h3>Guarded execution</h3></div><LockKeyhole size={18} className="violet-icon" /></div><p>Every future live swap must pass deterministic risk checks, transaction simulation, explicit operator approval, and wallet-side signing. This deployment never receives or stores a private key.</p><div className="approval-list"><span><b>1</b> Risk-approved intent</span><span><b>2</b> Wallet operator approval</span><span><b>3</b> Transaction monitor confirms</span></div></article></section>

      <footer className="footer-note"><span><AlertTriangle size={14} />Not financial advice. Meme tokens can be illiquid, manipulated, or unsellable.</span><span>GROK SNIPER v0.1 · PAPER ONLY</span></footer>
    </main>
  </div>;
}
