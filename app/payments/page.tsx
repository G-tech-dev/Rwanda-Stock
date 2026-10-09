"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, CheckCircle2, LockKeyhole, Smartphone } from "lucide-react";
import { MarketingLayout } from "../components/marketing";

type Purpose = "subscription" | "sale";

export default function PaymentsPage() {
  const [purpose, setPurpose] = useState<Purpose>("subscription");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [orderId, setOrderId] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setBusy(true);
    try {
      const response = await fetch("/api/payments/initialize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ purpose, name, email, ...(purpose === "sale" ? { orderId } : {}) })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not start payment.");
      if (typeof data.checkoutUrl !== "string" || !data.checkoutUrl.startsWith("https://")) throw new Error("The payment provider did not return a valid checkout URL.");
      window.location.assign(data.checkoutUrl);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not start payment. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return <MarketingLayout><main className="inner-page payments-page">
    <section className="inner-hero"><span className="section-kicker">SECURE MOBILE MONEY CHECKOUT</span><h1>Payments made <span>clear and simple.</span></h1><p>Use MTN Mobile Money or Airtel Money through Flutterwave's hosted checkout. Rwanda Stock never asks for your mobile money PIN.</p><div className="payment-method-pills"><span><Smartphone size={16}/> MTN Mobile Money</span><span><Smartphone size={16}/> Airtel Money</span></div></section>
    <section className="payment-layout">
      <form className="payment-form" onSubmit={submit}>
        <div className="payment-form-head"><span className="payment-secure-icon"><LockKeyhole size={19}/></span><div><h2>Start a payment</h2><p>Your payment is confirmed by the provider, not by the browser.</p></div></div>
        <label htmlFor="payment-purpose">What are you paying for?</label>
        <select id="payment-purpose" value={purpose} onChange={e => { setPurpose(e.target.value as Purpose); setError(""); }}><option value="subscription">Rwanda Stock monthly subscription</option><option value="sale">A customer sales order</option></select>
        {purpose === "subscription" ? <div className="payment-plan-summary"><div><strong>Business monthly plan</strong><span>30-day subscription payment</span></div><strong>RWF price set by administrator</strong></div> : <><label htmlFor="payment-order">Existing order reference</label><input id="payment-order" value={orderId} onChange={e => setOrderId(e.target.value)} placeholder="Paste order ID" required/><p className="payment-field-note">The order must already exist in Rwanda Stock and have an unpaid total. The amount is read from the saved order, never from this form.</p></>}
        <label htmlFor="payment-name">Full name</label><input id="payment-name" value={name} onChange={e => setName(e.target.value)} autoComplete="name" minLength={2} maxLength={100} placeholder="Your full name" required/>
        <label htmlFor="payment-email">Email address</label><input id="payment-email" type="email" value={email} onChange={e => setEmail(e.target.value)} autoComplete="email" maxLength={254} placeholder="you@example.com" required/>
        {error && <p className="payment-error" role="alert">{error}</p>}
        <button className="marketing-button payment-submit" type="submit" disabled={busy}>{busy ? "Connecting to payment provider…" : "Continue to secure checkout"} <ArrowRight size={16}/></button>
        <p className="payment-disclaimer"><LockKeyhole size={13}/> Payment credentials are kept on the server. Choose MTN or Airtel on the provider checkout page when available.</p>
      </form>
      <aside className="payment-side-card"><span className="payment-side-icon"><CheckCircle2 size={21}/></span><h2>Payment safety</h2><ul><li>Checkout is hosted by the payment provider.</li><li>Amounts are decided by the server and saved orders.</li><li>Payments are verified with the provider API before being marked paid.</li><li>Webhook signatures are checked before processing notifications.</li></ul><div className="payment-side-note">Payments will remain unavailable until the site administrator configures the database and Flutterwave credentials.</div><Link href="/pricing" className="payment-back-link"><ArrowLeft size={14}/> View plans and pricing</Link></aside>
    </section>
  </main></MarketingLayout>;
}
