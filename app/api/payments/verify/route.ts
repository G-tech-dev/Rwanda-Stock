import { NextRequest, NextResponse } from "next/server";
import { verifyAndRecordPayment } from "@/lib/payments";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const txRef = request.nextUrl.searchParams.get("tx_ref") || "";
  const transactionId = request.nextUrl.searchParams.get("transaction_id") || "";
  if (!txRef || !transactionId) {
    return NextResponse.json({ status: "pending", message: "Waiting for payment confirmation. If you completed the payment, refresh in a moment." }, { status: 202 });
  }
  try {
    const result = await verifyAndRecordPayment(txRef, transactionId);
    return NextResponse.json(result, { status: result.status === "successful" ? 200 : 202 });
  } catch {
    return NextResponse.json({ status: "unverified", message: "We could not verify this payment yet. Do not retry payment until you check the payment status." }, { status: 503 });
  }
}
