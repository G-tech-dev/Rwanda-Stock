"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { CheckCircle2, Clock3, ShieldAlert } from "lucide-react";

type Result = { status: string; message?: string; purpose?: string };

export default function PaymentReturnPage() {
  const [result, setResult] = useState<Result>({ status: "checking", message: "Checking the payment directly with the payment provider…" });

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const txRef = params.get("tx_ref") || "";
    const transactionId = params.get("transaction_id") || "";
    if (!txRef || !transactionId) {
      setResult({ status: "pending", message: "No completed transaction details were returned. Your payment may still be pending or cancelled." });
      return;
    }
    let cancelled = false;
    fetch(`/api/payments/verify?tx_ref=${encodeURIComponent(txRef)}&transaction_id=${encodeURIComponent(transactionId)}`, { cache: "no-store" })
      .then(async response => {
        const data = await response.json();
        if (!cancelled) setResult(data);
      })
      .catch(() => { if (!cancelled) setResult({ status: "unverified", message: "We could not confirm the payment status. Please check with the business before paying again." }); });
    return () => { cancelled = true; };
  }, []);

  const successful = result.status === "successful";
  const pending = result.status === "checking" || result.status === "pending" || result.status === "not_paid";
  const Icon = successful ? CheckCircle2 : pending ? Clock3 : ShieldAlert;
  return <main className="payment-return-wrap">
    <section className="payment-return-card">
      <div className={`payment-result-icon ${successful ? "success" : pending ? "pending" : "warning"}`}><Icon size={30}/></div>
      <span className="section-kicker">RWANDA STOCK PAYMENTS</span>
      <h1>{successful ? "Payment verified" : pending ? "Payment confirmation pending" : "Payment not verified yet"}</h1>
      <p>{successful ? (result.purpose === "subscription" ? "Flutterwave has confirmed the payment. The payment record has been updated. Account access still depends on the platform's account setup." : "Flutterwave has confirmed the payment. The linked order has been marked paid if it still matched the pending order.") : result.message || "We could not confirm a successful payment."}</p>
      <div className="payment-return-actions"><Link href="/dashboard" className="marketing-button">Back to dashboard</Link><Link href="/payments" className="payment-back-link">Return to payments</Link></div>
      <small>Do not share your mobile money PIN or approve a request you did not initiate.</small>
    </section>
  </main>;
}
