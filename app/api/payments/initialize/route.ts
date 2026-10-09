import { randomUUID } from "node:crypto";
import { ObjectId } from "mongodb";
import { NextRequest, NextResponse } from "next/server";
import { getDatabase } from "@/lib/mongodb";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

export async function POST(request: NextRequest) {
  if (!process.env.MONGODB_URI) return jsonError("Payments are not configured. Ask the administrator to configure the database.", 503);
  let body: unknown;
  try { body = await request.json(); } catch { return jsonError("Invalid request body.", 400); }
  if (!body || typeof body !== "object") return jsonError("Invalid request.", 400);
  const input = body as Record<string, unknown>;
  const purpose = input.purpose;
  const network = input.network;
  const email = typeof input.email === "string" ? input.email.trim().toLowerCase() : "";
  const name = typeof input.name === "string" ? input.name.trim() : "";
  const phone = typeof input.phone === "string" ? input.phone.replace(/[\s()-]/g, "") : "";
  if (!["sale", "wallet_topup", "subscription"].includes(String(purpose))) return jsonError("Choose a valid payment type.", 400);
  if (network !== "mtn" && network !== "airtel") return jsonError("Choose MTN MoMo or Airtel Money.", 400);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) return jsonError("Enter a valid email address.", 400);
  if (name.length < 2 || name.length > 100) return jsonError("Enter your name (2–100 characters).", 400);
  if (!/^\+?\d{9,15}$/.test(phone)) return jsonError("Enter a valid mobile-money phone number.", 400);

  const db = await getDatabase();
  let amountRwf: number;
  let orderId: string | undefined;
  let planId: string | undefined;
  if (purpose === "subscription") {
    amountRwf = Number(process.env.RS_BUSINESS_MONTHLY_PRICE_RWF);
    if (!Number.isSafeInteger(amountRwf) || amountRwf < 100) return jsonError("The monthly subscription price has not been configured. No payment was started.", 503);
    planId = "business_monthly";
  } else if (purpose === "sale") {
    const rawOrderId = typeof input.orderId === "string" ? input.orderId.trim() : "";
    if (!ObjectId.isValid(rawOrderId)) return jsonError("Enter a valid existing order reference.", 400);
    const order = await db.collection("orders").findOne({ _id: new ObjectId(rawOrderId), paymentStatus: { $nin: ["paid", "trader_confirmed"] } });
    if (!order) return jsonError("Order not found or already settled. The sales module must create the order first.", 404);
    const orderAmount = Number(order.totalRwf);
    if (!Number.isSafeInteger(orderAmount) || orderAmount < 100) return jsonError("This order has an invalid total.", 400);
    amountRwf = orderAmount;
    orderId = rawOrderId;
  } else {
    amountRwf = Number(input.amountRwf);
    if (!Number.isSafeInteger(amountRwf) || amountRwf < 100 || amountRwf > 10000000) return jsonError("Enter a top-up amount between 100 and 10,000,000 RWF.", 400);
  }

  const txRef = `RS-${randomUUID()}`;
  const now = new Date();
  const ussdCode = network === "mtn" ? "*182#" : "*182*8*1#";
  const instructions = network === "mtn"
    ? ["Dial *182# on the phone with the MTN MoMo account.", "Choose the appropriate send-money or merchant-payment option and enter the trader/merchant details shown by the recipient.", "Enter the exact amount and review the recipient carefully.", "Enter your MoMo PIN only in the official MTN USSD menu to authorize the transfer.", "Keep the MTN confirmation SMS and give the payment reference to the trader."]
    : ["Dial *182*8*1# on the phone with the Airtel Money account.", "Follow the Airtel Money merchant-payment menu and enter the trader's merchant code.", "Enter the exact amount and review the recipient carefully.", "Enter your Airtel Money PIN only in the official Airtel USSD menu to authorize the transfer.", "Keep the Airtel confirmation SMS and give the payment reference to the trader."];

  await db.collection("payments").insertOne({
    txRef, purpose, network, status: "pending", amountRwf, currency: "RWF", email, name, phone,
    ...(orderId ? { orderId } : {}), ...(planId ? { planId } : {}),
    createdAt: now, updatedAt: now
  });
  return NextResponse.json({ txRef, purpose, network, status: "pending", amountRwf, ussdCode, instructions });
}
