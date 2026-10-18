import { readFileSync } from "node:fs";
const sql = readFileSync(new URL("../database/migrations/001_initial.sql", import.meta.url), "utf8");
const required = ["create table if not exists public.tokens", "create table if not exists public.orders", "create table if not exists public.audit_logs", "enable row level security"];
const missing = required.filter((needle) => !sql.toLowerCase().includes(needle));
if (missing.length) { console.error(`Migration missing required statements: ${missing.join(", ")}`); process.exit(1); }
console.log("Migration check passed");
