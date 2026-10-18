import { NextResponse } from "next/server";
import { runtimeSnapshot } from "@/lib/server";

export async function GET() {
  return NextResponse.json(runtimeSnapshot, { headers: { "cache-control": "no-store" } });
}
