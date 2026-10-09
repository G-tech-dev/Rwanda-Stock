"use client";

import { FormEvent, useEffect, useState } from "react";
import { Copy, Plus, RefreshCw, Users, Wallet } from "lucide-react";

type Customer = { customerId: string; name: string; phone: string; email: string };
type PaymentRequest = { orderId: string; description: string; totalRwf: number; paymentStatus: string };

const fmt = (n: number) => new Intl.NumberFormat("en-RW", { style: "currency", currency: "RWF", maximumFractionDigits: 0 }).format(n);

export default function BusinessTools() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [requests, setRequests] = useState<PaymentRequest[]>([]);
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("1000");
  const [cName, setCName] = useState("");
  const [cPhone, setCPhone] = useState("");
  const [cEmail, setCEmail] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);

  async function load() {
    setError("");
    try {
      const [rr, cr] = await Promise.all([
        fetch("/api/orders", { cache: "no-store" }),
        fetch("/api/customers", { cache: "no-store" })
      ]);
      const rd = await rr.json();
      const cd = await cr.json();
      if (!rr.ok) throw new Error(rd.error || "Could not load payment requests.");
      if (!cr.ok) throw new Error(cd.error || "Could not load customers.");
      setRequests(rd.orders || []);
      setCustomers(cd.customers || []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load business data.");
    }
  }

  useEffect(() => { void load(); }, []);

  async function createRequest(e: FormEvent) {
    e.preventDefault(); setBusy(true); setError(""); setNotice("");
    try {
      const r = await fetch("/api/orders", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description, amountRwf: Number(amount) })
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || "Could not create payment request.");
      setDescription(""); setAmount("1000");
      setNotice("Payment request created. Share reference " + d.order.orderId + " with your customer.");
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not create payment request.");
    } finally { setBusy(false); }
  }

  async function addCustomer(e: FormEvent) {
    e.preventDefault(); setBusy(true); setError(""); setNotice("");
    try {
      const r = await fetch("/api/customers", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: cName, phone: cPhone, email: cEmail })
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || "Could not add customer.");
      setCName(""); setCPhone(""); setCEmail("");
      setNotice("Customer saved."); await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save customer.");
    } finally { setBusy(false); }
  }

  return <section className="business-tools">
    <div className="business-tools-heading">
      <div><span className="section-kicker">PAYMENT MANAGEMENT</span><h2>Request and track payments</h2><p>Create a payment request for any product or service—no inventory setup needed.</p></div>
      <button className="payment-refresh" onClick={() => void load()} aria-label="Refresh payment data"><RefreshCw size={15}/></button>
    </div>
    {error && <p className="auth-error" role="alert">{error}</p>}
    {notice && <p className="business-notice" role="status">{notice}</p>}
    <div className="business-tools-grid">
      <form className="business-tool-card" onSubmit={createRequest}>
        <Wallet size={20}/><h3>Create payment request</h3>
        <label>What is the payment for?<input required minLength={2} maxLength={160} value={description} onChange={e => setDescription(e.target.value)} placeholder="e.g. Haircut, delivery, repair service"/></label>
        <label>Amount (RWF)<input type="number" min="100" max="10000000" step="1" required value={amount} onChange={e => setAmount(e.target.value)}/></label>
        <button className="marketing-button" disabled={busy}><Plus size={14}/> Create request</button>
        <p className="business-tool-help">Share the generated reference with your customer. The customer enters it on the Payments page.</p>
      </form>
      <form className="business-tool-card" onSubmit={addCustomer}>
        <Users size={20}/><h3>Save customer</h3>
        <label>Customer name<input required minLength={2} maxLength={100} value={cName} onChange={e => setCName(e.target.value)} placeholder="Full name"/></label>
        <label>Phone<input maxLength={20} value={cPhone} onChange={e => setCPhone(e.target.value)} placeholder="07xxxxxxxx"/></label>
        <label>Email<input type="email" maxLength={254} value={cEmail} onChange={e => setCEmail(e.target.value)} placeholder="Optional email"/></label>
        <button className="marketing-button" disabled={busy}><Plus size={14}/> Save customer</button>
        <p className="business-tool-help">{customers.length} customer(s) saved.</p>
      </form>
      <div className="business-tool-card">
        <Wallet size={20}/><h3>Recent payment requests</h3>
        {requests.length ? requests.slice(0, 6).map(request => <div className="workspace-order" key={request.orderId}>
          <span><strong>{request.description}</strong><small>{request.orderId} · {request.paymentStatus}</small></span>
          <b>{fmt(request.totalRwf)}</b>
          <button type="button" className="payment-refresh" aria-label={"Copy reference " + request.orderId} onClick={() => void navigator.clipboard.writeText(request.orderId)}><Copy size={14}/></button>
        </div>) : <p className="business-tool-help">No payment requests yet.</p>}
      </div>
    </div>
  </section>;
}