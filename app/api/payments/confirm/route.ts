import { NextRequest, NextResponse } from "next/server";
import { confirmManualPayment } from "@/lib/payments";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  if (!process.env.MONGODB_URI || !process.env.RS_TRADER_CONFIRMATION_SECRET) {
    return NextResponse.json({ error: "Trader confirmation is not configured. No payment was marked confirmed." }, { status: 503 });
  }
  let body: unknown;
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Invalid request body." }, { status: 400 }); }
  if (!body || typeof body !== "object") return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  const input = body as Record<string, unknown>;
  if (typeof input.txRef !== "string" || typeof input.confirmationSecret !== "string") {
    return NextResponse.json({ error: "Payment reference and trader confirmation code are required." }, { status: 400 });
  }
  try {
    const result = await confirmManualPayment(input.txRef, input.confirmationSecret);
    return NextResponse.json(result);
  } catch (error) {
    const status = typeof error === "object" && error !== null && "statusCode" in error && typeof error.statusCode === "number" ? error.statusCode : 400;
    return NextResponse.json({ error: error instanceof Error ? error.message : "Could not confirm payment." }, { status });
  }
}
