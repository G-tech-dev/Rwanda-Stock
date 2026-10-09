import { timingSafeEqual } from "node:crypto";
import { ObjectId } from "mongodb";
import { getDatabase } from "./mongodb";

export type PaymentPurpose = "sale" | "subscription";
type PaymentDocument = {
  _id?: ObjectId;
  txRef: string;
  purpose: PaymentPurpose;
  status: "pending" | "paid" | "failed";
  amountRwf: number;
  currency: "RWF";
  email: string;
  name: string;
  orderId?: string;
  planId?: string;
  providerTransactionId?: string;
  createdAt: Date;
  updatedAt: Date;
  paidAt?: Date;
};

export function constantTimeEqual(a: string, b: string): boolean {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  return left.length === right.length && timingSafeEqual(left, right);
}

export async function verifyAndRecordPayment(txRef: string, transactionId: string) {
  const secretKey = process.env.FLW_SECRET_KEY;
  if (!secretKey) throw new Error("FLW_SECRET_KEY is not configured.");
  if (!/^[a-zA-Z0-9_-]{8,100}$/.test(txRef)) throw new Error("Invalid transaction reference.");
  if (!/^\d{1,20}$/.test(transactionId)) throw new Error("Invalid provider transaction ID.");

  const db = await getDatabase();
  const payments = db.collection<PaymentDocument>("payments");
  const payment = await payments.findOne({ txRef });
  if (!payment) throw new Error("Payment reference was not found.");
  if (payment.status === "paid") return { status: "successful", purpose: payment.purpose };

  const response = await fetch(`https://api.flutterwave.com/v3/transactions/${transactionId}/verify`, {
    headers: { Authorization: `Bearer ${secretKey}`, Accept: "application/json" },
    cache: "no-store"
  });
  if (!response.ok) throw new Error("Payment provider verification failed.");
  const result = await response.json();
  const transaction = result?.data;
  if (result?.status !== "success" || !transaction) throw new Error("Payment could not be verified.");

  const valid = transaction.tx_ref === payment.txRef
    && transaction.status === "successful"
    && transaction.currency === payment.currency
    && Number(transaction.amount) >= payment.amountRwf;

  if (!valid) {
    if (transaction.tx_ref === payment.txRef && ["failed", "cancelled"].includes(String(transaction.status))) {
      await payments.updateOne({ txRef, status: "pending" }, { $set: { status: "failed", updatedAt: new Date() } });
    }
    return { status: "not_paid", purpose: payment.purpose };
  }

  const now = new Date();
  const updated = await payments.updateOne(
    { txRef, status: "pending" },
    { $set: { status: "paid", providerTransactionId: String(transaction.id), paidAt: now, updatedAt: now } }
  );

  // Fulfilment is idempotent. Sales orders must already exist and remain unpaid.
  if (payment.purpose === "sale" && payment.orderId) {
    await db.collection("orders").updateOne(
      { _id: new ObjectId(payment.orderId), paymentStatus: { $ne: "paid" } },
      { $set: { paymentStatus: "paid", paymentReference: txRef, paidAt: now, updatedAt: now } }
    );
  } else if (payment.purpose === "subscription" && payment.planId && updated.modifiedCount === 1) {
    // This records the paid subscription; authentication/tenant ownership must be added before using it to gate access.
    await db.collection("subscriptions").updateOne(
      { email: payment.email.toLowerCase(), planId: payment.planId },
      {
        $set: { email: payment.email.toLowerCase(), name: payment.name, planId: payment.planId, status: "active", lastPaymentReference: txRef, updatedAt: now },
        $setOnInsert: { createdAt: now },
        $max: { paidThrough: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000) }
      },
      { upsert: true }
    );
  }
  return { status: "successful", purpose: payment.purpose };
}
