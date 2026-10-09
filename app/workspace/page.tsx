import { redirect } from "next/navigation";
import Link from "next/link";
import { getSession } from "@/lib/auth";
import { getDatabase } from "@/lib/mongodb";
import { MarketingLayout } from "../components/marketing";
import { Wallet, Users, Clock3, CircleCheck, ArrowRightLeft } from "lucide-react";
import LogoutButton from "../components/logout-button";
import PendingPayments from "../components/pending-payments";
import BusinessTools from "../components/business-tools";

export const dynamic = "force-dynamic";
const fmt = (n: number) => new Intl.NumberFormat("en-RW", { style: "currency", currency: "RWF", maximumFractionDigits: 0 }).format(n);

export default async function WorkspacePage() {
  const user = await getSession();
  if (!user) redirect("/login");
  if (user.role === "customer") redirect("/payments");
  const db = await getDatabase();
  const businessId = user.businessId;
  const [customers, requests, wallet, pendingCount, paidTotals] = await Promise.all([
    db.collection("customers").countDocuments({ businessId }),
    db.collection("orders").find({ businessId }).sort({ createdAt: -1 }).limit(8).toArray(),
    db.collection("trader_wallets").findOne({ businessId }),
    db.collection("orders").countDocuments({ businessId, paymentStatus: "pending" }),
    db.collection("orders").aggregate([
      { $match: { businessId, paymentStatus: "paid" } },
      { $group: { _id: null, total: { $sum: "$totalRwf" } } }
    ]).toArray()
  ]);
  const paidTotal = Number(paidTotals[0]?.total || 0);
  return <MarketingLayout><main className="workspace-page">
    <header className="workspace-heading"><div><span className="section-kicker">EASYPAY RWANDA WORKSPACE</span><h1>Hello, {user.name}</h1><p>{user.role === "admin" ? "Administrator" : "Business owner"} · secure account session</p></div><LogoutButton/><Link href="/payments" className="marketing-button">Wallet & payments</Link></header>
    <section className="workspace-metrics">
      <article><CircleCheck/><span>Confirmed payment total</span><strong>{fmt(paidTotal)}</strong></article>
      <article><Clock3/><span>Pending requests</span><strong>{pendingCount}</strong></article>
      <article><Users/><span>Customers</span><strong>{customers}</strong></article>
      <article><Wallet/><span>Trader wallet</span><strong>{fmt(Number(wallet?.balanceRwf || 0))}</strong></article>
    </section>
    <section className="workspace-columns">
      <article className="workspace-panel"><div className="workspace-panel-title"><div><h2>Recent payment requests</h2><p>Track amounts and current status.</p></div><Link href="/payments">Open payments</Link></div>
        {requests.length ? <div className="workspace-orders">{requests.map((o, i) => <div className="workspace-order" key={String(o.orderId || i)}><span><strong>{String(o.description || o.orderId)}</strong><small>{String(o.orderId)} · {String(o.paymentStatus || "pending")}</small></span><b>{fmt(Number(o.totalRwf || 0))}</b></div>)}</div> : <p className="workspace-empty">No payment requests yet. Create one below to get started.</p>}
        <Link href="/api/reports" className="workspace-report-link"><ArrowRightLeft size={16}/> View payment report data</Link>
      </article>
      <article className="workspace-panel"><div className="workspace-panel-title"><div><h2>Get paid</h2><p>Accept a payment using MTN MoMo or Airtel Money.</p></div></div><p className="workspace-empty">Create a request, share its reference, then check your mobile-money confirmation before recording receipt.</p><Link href="/payments" className="marketing-button">Go to payment tools</Link></article>
    </section>
    <div style={{ marginTop: 16 }}><BusinessTools /></div>
    <div style={{ marginTop: 16 }}><PendingPayments /></div>
    <p className="workspace-footnote">EasyPay Rwanda does not collect mobile-money PINs. Manual confirmation is a trader assertion, not independent verification from MTN or Airtel.</p>
  </main></MarketingLayout>;
}