import Link from "next/link";
import { ArrowRight, BarChart3, BellRing, ClipboardList, Package, Smartphone, Users, Utensils, Pill, Store, BriefcaseBusiness } from "lucide-react";
import { MarketingLayout } from "../components/marketing";

const features = [
  { icon: Package, title: "Payment requests", text: "Create payment requests with a description, amount, and shareable reference." },
  { icon: BellRing, title: "Pending payment tracking", text: "See which payment requests still need confirmation." },
  { icon: BarChart3, title: "Payment summaries", text: "Review payment totals and pending requests in one workspace." },
  { icon: ClipboardList, title: "Mobile-money instructions", text: "Guide customers through MTN MoMo or Airtel Money payment steps." },
  { icon: Smartphone, title: "Mobile-friendly design", text: "Use a layout designed to adapt to phones, tablets, and computers." },
  { icon: Users, title: "Built for small teams", text: "A straightforward workspace for owners and the people who help run the business." },
];
const businessTools = [
  { icon: Store, title: "Retail shops", text: "Payment requests and payment tracking." },
  { icon: Utensils, title: "Restaurants", text: "Payments for meals, catering, and deliveries." },
  { icon: Pill, title: "Pharmacies", text: "Payment tracking for pharmacy purchases and services." },
  { icon: BriefcaseBusiness, title: "Service businesses", text: "Simple payment requests for service jobs." },
];

export default function FeaturesPage() {
  return <MarketingLayout><main className="inner-page">
    <section className="inner-hero"><span className="section-kicker">FEATURES</span><h1>Everyday payment tools, <span>made simpler.</span></h1><p>EasyPay Rwanda brings payment requests, mobile-money instructions, and payment tracking into one simple workspace.</p><Link href="/dashboard" className="marketing-button">Explore the demo <ArrowRight size={16}/></Link></section>
    <section className="marketing-section inner-section"><div className="section-intro"><h2>A clearer way to get paid.</h2><p>These are the core capabilities the platform is being built around.</p></div><div className="feature-cards">{features.map(({icon:Icon,title,text})=><article className="feature-card" key={title}><span className="feature-card-icon"><Icon size={21}/></span><h3>{title}</h3><p>{text}</p></article>)}</div></section>
    <section className="marketing-section tools-section"><div className="section-intro"><h2>Payment tools for your business type.</h2><p>Start with a workspace that reflects the work you do.</p></div><div className="tool-type-grid">{businessTools.map(({icon:Icon,title,text})=><article key={title} className="tool-type"><Icon size={22}/><div><h3>{title}</h3><p>{text}</p></div></article>)}</div></section>
    <section className="home-cta"><div><span className="section-kicker">TRY THE CURRENT DEMO</span><h2>See the workspace in action.</h2><p>Sample data is included so you can explore the interface.</p></div><Link href="/dashboard" className="marketing-button light">Open dashboard <ArrowRight size={16}/></Link></section>
  </main></MarketingLayout>;
}
