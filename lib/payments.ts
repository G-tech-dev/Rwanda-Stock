import { timingSafeEqual } from "node:crypto";
import { ObjectId } from "mongodb";
import { getDatabase } from "./mongodb";

export type PaymentPurpose = "sale" | "wallet_topup" | "subscription";

export function constantTimeEqual(a: string, b: string): boolean {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  return left.length === right.length && timingSafeEqual(left, right);
}

/**
 * Manual trader confirmation is an assertion that the trader checked the operator's receipt.
 * It is NOT independent verification from MTN/Airtel. Replace the shared confirmation code
 * with per-user authentication/authorization before public production use.
 */
export async function confirmManualPayment(txRef: string, confirmationSecret: string) {
  const expected = process.env.RS_TRADER_CONFIRMATION_SECRET;
  if (!expected) throw new Error("Trader confirmation is not configured.");
  if (!confirmationSecret || !constantTimeEqual(confirmationSecret, expected)) {
    const error = new Error("Invalid trader confirmation code.");
    Object.assign(error, { statusCode: 401 });
    throw error;
  }
  if (!/^RS-[a-f0-9-]{36}$/i.test(txRef)) throw new Error("Invalid payment reference.");
  const db = await getDatabase();
  const payments = db.collection("payments");
  const payment = await payments.findOne({ txRef });
  if (!payment) {
    const error = new Error("Payment reference not found.");
    Object.assign(error, { statusCode: 404 });
    throw error;
  }
  if (payment.status === "trader_confirmed") return { status: "trader_confirmed", txRef };
  if (payment.status !== "pending") throw new Error("This payment is not pending confirmation.");

  const now = new Date();
  const updated = await payments.updateOne(
    { txRef, status: "pending" },
    { $set: { status: "trader_confirmed", traderConfirmedAt: now, updatedAt: now, confirmationMethod: "manual_trader_confirmation" } }
  );
  if (updated.modifiedCount !== 1) {
    const latest = await payments.findOne({ txRef });
    if (latest?.status === "trader_confirmed") return { status: "trader_confirmed", txRef };
    throw new Error("Payment status changed; refresh and check the record.");
  }

  // Credit wallet only after the trader's manual assertion; idempotent because status transition above is atomic.
  if (payment.purpose === "wallet_topup") {
    await db.collection("trader_wallets").updateOne(
      { email: String(payment.email).toLowerCase() },
      {
        $inc: { balanceRwf: Number(payment.amountRwf) },
        $set: { updatedAt: now },
        $setOnInsert: { email: String(payment.email).toLowerCase(), createdAt: now }
      },
      { upsert: true }
    );
  } else if (payment.purpose === "sale" && payment.orderId && ObjectId.isValid(String(payment.orderId))) {
    await db.collection("orders").updateOne(
      { _id: new ObjectId(String(payment.orderId)), paymentStatus: { $nin: ["paid", "trader_confirmed"] } },
      { $set: { paymentStatus: "trader_confirmed", paymentReference: txRef, traderConfirmedAt: now, updatedAt: now } }
    );
  } else if (payment.purpose === "subscription") {
    await db.collection("subscriptions").updateOne(
      { email: String(payment.email).toLowerCase(), planId: "business_monthly" },
      {
        $set: { email: String(payment.email).toLowerCase(), planId: "business_monthly", status: "trader_confirmed", lastPaymentReference: txRef, updatedAt: now },
        $setOnInsert: { createdAt: now },
        $max: { paidThrough: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000) }
      },
      { upsert: true }
    );
  }
  return { status: "trader_confirmed", txRef, note: "Manual trader confirmation; not independently verified by the mobile-money operator." };
}
