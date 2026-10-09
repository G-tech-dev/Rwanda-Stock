import { NextRequest, NextResponse } from "next/server";
import { constantTimeEqual, verifyAndRecordPayment } from "@/lib/payments";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const secretHash = process.env.FLW_SECRET_HASH;
  const signature = request.headers.get("verif-hash") || "";
  if (!secretHash) return NextResponse.json({ error: "Webhook is not configured." }, { status: 503 });
  if (!signature || !constantTimeEqual(signature, secretHash)) return NextResponse.json({ error: "Invalid webhook signature." }, { status: 401 });

  let payload: { event?: string; data?: { id?: string | number; tx_ref?: string; status?: string } };
  try { payload = await request.json(); } catch { return NextResponse.json({ error: "Invalid payload." }, { status: 400 }); }
  if (payload.event !== "charge.completed" || !payload.data?.id || !payload.data?.tx_ref) {
    return NextResponse.json({ received: true });
  }
  try {
    await verifyAndRecordPayment(payload.data.tx_ref, String(payload.data.id));
    return NextResponse.json({ received: true });
  } catch {
    // Avoid logging payloads or customer data. Provider can retry if verification/storage is temporarily unavailable.
    return NextResponse.json({ error: "Payment notification could not be processed." }, { status: 503 });
  }
}
