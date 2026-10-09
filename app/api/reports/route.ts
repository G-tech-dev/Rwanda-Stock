import { NextResponse } from "next/server";
import { getDatabase } from "@/lib/mongodb";
import { requireUser } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const { user, response } = await requireUser(["trader", "admin"]);
  if (response) return response;
  const db = await getDatabase();
  const businessId = user!.businessId;
  const [orders, customers, paymentRows] = await Promise.all([
    db.collection("orders").find({ businessId }).sort({ createdAt: -1 }).limit(1000).toArray(),
    db.collection("customers").countDocuments({ businessId }),
    db.collection("payments").find({ businessId }).sort({ createdAt: -1 }).limit(1000).toArray()
  ]);
  const confirmedOrders = orders.filter(o => ["trader_confirmed", "verified"].includes(String(o.paymentStatus)));
  const confirmedPayments = paymentRows.filter(p => ["trader_confirmed", "verified"].includes(String(p.status)));
  return NextResponse.json({
    customers,
    paymentRequestsCount: orders.length,
    confirmedRequestAmountRwf: confirmedOrders.reduce((sum, o) => sum + Number(o.totalRwf || 0), 0),
    pendingPaymentRequests: orders.filter(o => o.paymentStatus === "pending").length,
    confirmedMobileMoneyAmountRwf: confirmedPayments.reduce((sum, p) => sum + Number(p.amountRwf || 0), 0),
    pendingMobileMoneyPayments: paymentRows.filter(p => p.status === "pending").length,
    latestRequests: orders.slice(0, 20).map(({ _id, ...x }) => x),
    latestPayments: paymentRows.slice(0, 20).map(({ _id, ...x }) => x)
  });
}