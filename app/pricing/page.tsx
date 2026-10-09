import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";
import { MarketingLayout } from "../components/marketing";

const plans = [
  { name: "Free", price: "Free to start", description: "Explore the basics as you organize your business.", items: ["Business dashboard demo", "Inventory overview", "Business-type examples", "Mobile-friendly interface"], featured: false },
  { name: "Business", price: "Monthly fee configured at checkout", description: "For businesses that need more tools as they grow.", items: ["Expanded business workflows planned", "More detailed reporting planned", "Team features planned", "Mobile money checkout integration"], featured: true },
];

export default function PricingPage() {
  return <MarketingLayout><main className="inner-page">
    <section className="inner-hero"><span className="section-kicker">SIMPLE PLANS</span><h1>Start simple. <span>Grow when you're ready.</span></h1><p>Rwanda Stock is planned around a free starting option and paid subscriptions for businesses that need more capabilities.</p></section>
    <section className="pricing-grid">{plans.map(plan=><article key={plan.name} className={`pricing-card ${plan.featured ? "pricing-featured" : ""}`}>{plan.featured && <span className="pricing-label">PLANNED PLAN</span>}<h2>{plan.name}</h2><p>{plan.description}</p><div className="pricing-price">{plan.price}</div><ul>{plan.items.map(item=><li key={item}><Check size={17}/>{item}</li>)}</ul><Link href={plan.featured ? "/payments" : "/dashboard"} className={`marketing-button ${plan.featured ? "light" : ""}`}>{plan.featured ? "Continue to payment" : "Explore demo"} <ArrowRight size={16}/></Link></article>)}</section>
    <p className="pricing-note">Note: subscriptions require administrator-configured pricing and payment-provider credentials. Real payments will not start until the database and Flutterwave environment variables are configured. Account authentication and subscription access controls are still required before production launch.</p>
  </main></MarketingLayout>;
}
