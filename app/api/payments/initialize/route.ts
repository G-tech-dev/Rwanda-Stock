import { randomUUID } from "node:crypto";
import { ObjectId } from "mongodb";
import { NextRequest, NextResponse } from "next/server";
import { getDatabase } from "@/lib/mongodb";
import type { PaymentPurpose } from "@/lib/payments";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

export async function POST(request: NextRequest) {
  const secretKey = process.env.FLW_SECRET_KEY;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  const monthlyPrice = Number(process.env.RS_BUSINESS_MONTHLY_PRICE_RWF);

  if (!secretKey || !appUrl || !process.env.MONGODB_URI) {
    return jsonError("Payments are not configured yet. Ask the site administrator to configure the payment provider and database.", 503);
  }
  const origin = request.headers.get("origin");
  if (origin && origin !== new URL(appUrl).origin) return jsonError("Request origin is not allowed.", 403);

  let body: unknown;
  try { body = await request.json(); } catch { return jsonError("Invalid request body.", 400); }
  if (!body || typeof body !== "object") return jsonError("Invalid request.", 400);
  const input = body as Record<string, unknown>;
  const purpose = input.purpose;
  const email = typeof input.email === "string" ? input.email.trim().toLowerCase() : "";
  const name = typeof input.name === "string" ? input.name.trim() : "";
  if (purpose !== "sale" && purpose !== "subscription") return jsonError("Choose a valid payment purpose.", 400);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) return jsonError("Enter a valid email address.", 400);
  if (name.length < 2 || name.length > 100) return jsonError("Enter your name (2–100 characters).", 400);

  const db = await getDatabase();
  const purposeTyped = purpose as PaymentPurpose;
  let amountRwf: number;
  let orderId: string | undefined;
  let planId: string | undefined;

  if (purposeTyped === "subscription") {
    if (!Number.isSafeInteger(monthlyPrice) || monthlyPrice < 100) {
      return jsonError("The monthly subscription price has not been configured. No payment was started.", 503);
    }
    amountRwf = monthlyPrice;
    planId = "business_monthly";
  } else {
    const rawOrderId = typeof input.orderId === "string" ? input.orderId.trim() : "";
    if (!ObjectId.isValid(rawOrderId)) return jsonError("Enter a valid existing order reference.", 400);
    const order = await db.collection("orders").findOne({ _id: new ObjectId(rawOrderId), paymentStatus: { $ne: "paid" } });
    if (!order) return jsonError("That order was not found or is already paid. Create an order in the sales module first.", 404);
    const orderEmail = typeof order.customerEmail === "string" ? order.customerEmail.toLowerCase() : "";
    if (orderEmail && orderEmail !== email) return jsonError("Use the email address attached to this order.", 403);
    const orderAmount = Number(order.totalRwf);
    if (!Number.isSafeInteger(orderAmount) || orderAmount < 100) return jsonError("This order has an invalid total and cannot be paid.", 400);
    amountRwf = orderAmount;
    orderId = rawOrderId;
  }

  const txRef = `RS-${randomUUID()}`;
  const now = new Date();
  await db.collection("payments").insertOne({
    txRef, purpose: purposeTyped, status: "pending", amountRwf, currency: "RWF", email, name,
    ...(orderId ? { orderId } : {}), ...(planId ? { planId } : {}),
    createdAt: now, updatedAt: now
  });

  try {
    const response = await fetch("https://api.flutterwave.com/v3/payments", {
      method: "POST",
      headers: { Authorization: `Bearer ${secretKey}`, "Content-Type": "application/json", Accept: "application/json" },
      cache: "no-store",
      body: JSON.stringify({
        tx_ref: txRef,
        amount: String(amountRwf),
        currency: "RWF",
        redirect_url: `${new URL(appUrl).origin}/payments/return`,
        payment_options: "mobilemoneyrwanda",
        customer: { email, name },
        customizations: {
          title: "Rwanda Stock",
          description: purposeTyped === "subscription" ? "Rwanda Stock monthly business subscription" : "Payment for a Rwanda Stock sales order",
          logo: ""
        },
        meta: { purpose: purposeTyped, ...(orderId ? { orderId } : {}), ...(planId ? { planId } : {}) }
      })
    });
    const result = await response.json();
    const link = result?.data?.link;
    if (!response.ok || result?.status !== "success" || typeof link !== "string" || !link.startsWith("https://")) {
      await db.collection("payments").updateOne({ txRef }, { $set: { status: "failed", updatedAt: new Date() } });
      return jsonError("The payment provider could not start checkout. No successful payment has been recorded.", 502);
    }
    await db.collection("payments").updateOne({ txRef }, { $set: { providerLinkCreated: true, updatedAt: new Date() } });
    return NextResponse.json({ checkoutUrl: link, txRef });
  } catch {
    await db.collection("payments").updateOne({ txRef }, { $set: { status: "failed", updatedAt: new Date() } });
    return jsonError("Unable to start checkout right now. Please try again later.", 502);
  }
}
