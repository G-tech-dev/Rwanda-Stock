"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, CheckCircle2, Copy, Smartphone, ShieldCheck, Wallet } from "lucide-react";
import { MarketingLayout } from "../components/marketing";

type Purpose = "sale" | "wallet_topup" | "subscription";
type Network = "mtn" | "airtel";
type CreatedPayment = { purpose: Purpose; txRef: string; amountRwf: number; network: Network; ussdCode: string; instructions: string[]; status: string };

export default function PaymentsPage() {
  const [purpose, setPurpose] = useState<Purpose>("sale");
  const [network, setNetwork] = useState<Network>("mtn");
  const [phone, setPhone] = useState("");
  const [orderId, setOrderId] = useState("");
  const [amountRwf, setAmountRwf] = useState("1000");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [payment, setPayment] = useState<CreatedPayment | null>(null);
  const [confirmBusy, setConfirmBusy] = useState(false);
  const [confirmMessage, setConfirmMessage] = useState("");

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setPayment(null);
    setBusy(true);
    try {
      const response = await fetch("/api/payments/initialize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ purpose, network, phone, ...(purpose === "sale" ? { orderId } : {}), ...(purpose === "wallet_topup" ? { amountRwf: Number(amountRwf) } : {}) })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not create payment instructions.");
      setPayment(data as CreatedPayment);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not create payment instructions.");
    } finally {
      setBusy(false);
    }
  }

  async function confirmPayment() {
    if (!payment) return;
    setConfirmBusy(true);
    setConfirmMessage("");
    try {
      const response = await fetch("/api/payments/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ txRef: payment.txRef })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Payment could not be confirmed.");
      setConfirmMessage("Trader confirmation recorded. This is a manual confirmation, not independent verification from MTN or Airtel.");
    } catch (e) {
      setConfirmMessage(e instanceof Error ? e.message : "Payment could not be confirmed.");
    } finally {
      setConfirmBusy(false);
    }
  }

  return <MarketingLayout><main className="inner-page payments-page">
    <section className="inner-hero"><span className="section-kicker">RWANDA STOCK MOBILE MONEY</span><h1>Pay with <span>MTN or Airtel.</span></h1><p>Create a payment reference, open the mobile-money USSD menu on your phone, and follow the operator's instructions. The trader confirms receipt in EasyPay Rwanda after checking their mobile-money message or balance.</p><div className="payment-method-pills"><span><Smartphone size={16}/> MTN MoMo</span><span><Smartphone size={16}/> Airtel Money</span></div></section>
    <p className="payment-field-note">Sign in first. Customers can pay an existing order; traders can top up their wallet or pay a subscription.</p><section className="payment-layout">
      <form className="payment-form" onSubmit={submit}>
        <div className="payment-form-head"><span className="payment-secure-icon"><Wallet size={19}/></span><div><h2>Create payment reference</h2><p>No mobile-money PIN is requested or stored by EasyPay Rwanda.</p></div></div>
        <label htmlFor="payment-purpose">Payment type</label>
        <select id="payment-purpose" value={purpose} onChange={e => { setPurpose(e.target.value as Purpose); setError(""); setPayment(null); }}>
          <option value="sale">Customer pays trader for an item</option>
          <option value="wallet_topup">Trader wallet top-up</option>
          <option value="subscription">EasyPay Rwanda subscription</option>
        </select>
        <label htmlFor="payment-network">Mobile-money network</label>
        <select id="payment-network" value={network} onChange={e => setNetwork(e.target.value as Network)}><option value="mtn">MTN MoMo</option><option value="airtel">Airtel Money</option></select>
        <label htmlFor="payment-phone">Mobile-money phone number</label>
        <input id="payment-phone" value={phone} onChange={e => setPhone(e.target.value)} inputMode="tel" placeholder="e.g. 078xxxxxxx" minLength={9} maxLength={16} required/>
        {purpose === "sale" && <><label htmlFor="payment-order">Existing order reference</label><input id="payment-order" value={orderId} onChange={e => setOrderId(e.target.value)} placeholder="Order ID" required/><p className="payment-field-note">The total is loaded from the saved order; you cannot change it here.</p></>}
        {purpose === "wallet_topup" && <><label htmlFor="payment-amount">Top-up amount (RWF)</label><input id="payment-amount" type="number" value={amountRwf} onChange={e => setAmountRwf(e.target.value)} min={100} max={10000000} step={1} required/></>}
        {error && <p className="payment-error" role="alert">{error}</p>}
        <button className="marketing-button payment-submit" type="submit" disabled={busy}>{busy ? "Creating reference…" : "Create payment instructions"} <ArrowRight size={16}/></button>
        <p className="payment-disclaimer"><ShieldCheck size={13}/> A reference is not proof of payment. The status remains pending until the trader confirms receipt.</p>
      </form>
      <aside className="payment-side-card"><span className="payment-side-icon"><CheckCircle2 size={21}/></span><h2>How it works</h2><ul><li>EasyPay Rwanda creates a unique payment reference.</li><li>Use the USSD menu on the payer's phone to complete payment.</li><li>The payer enters their PIN only in the operator's USSD menu.</li><li>The trader checks their own mobile-money confirmation before confirming receipt in the app.</li></ul><div className="payment-side-note">This manual USSD flow does not automatically send a PIN prompt or verify transactions with the operator. Automated prompts require approved MTN/Airtel API credentials and callbacks.</div><Link href="/pricing" className="payment-back-link"><ArrowLeft size={14}/> View plans and pricing</Link></aside>
    </section>
    {payment && <section className="payment-form payment-instructions">
      <div className="payment-form-head"><span className="payment-secure-icon"><Smartphone size={19}/></span><div><h2>Payment instructions</h2><p>Reference created; payment is still pending.</p></div></div>
      <div className="payment-plan-summary"><div><strong>Amount</strong><span>{payment.purpose === "subscription" ? "Subscription" : payment.purpose === "wallet_topup" ? "Trader wallet top-up" : "Sales order"}</span></div><strong>{payment.amountRwf.toLocaleString()} RWF</strong></div>
      <p><strong>Reference:</strong> {payment.txRef}</p>
      <button type="button" className="marketing-button payment-submit" onClick={() => navigator.clipboard.writeText(payment.txRef)}><Copy size={16}/> Copy reference</button>
      <a className="marketing-button payment-submit" href={`tel:${payment.ussdCode.replace("#", "%23")}`}>Open {payment.network === "mtn" ? "MTN" : "Airtel"} USSD menu <ArrowRight size={16}/></a>
      <ol>{payment.instructions.map((instruction, index) => <li key={index}>{instruction}</li>)}</ol>
      <p className="payment-field-note">After the operator confirms the transfer, the trader should verify the payment on their phone before recording receipt below.</p>
      <p className="payment-field-note">The trader must be signed in to the correct business account before confirming receipt.</p>
      <button type="button" className="marketing-button payment-submit" disabled={confirmBusy} onClick={confirmPayment}>{confirmBusy ? "Recording confirmation…" : "Trader confirms receipt"} <CheckCircle2 size={16}/></button>
      {confirmMessage && <p role="status" className="payment-field-note">{confirmMessage}</p>}
    </section>}
  </main></MarketingLayout>;
}
