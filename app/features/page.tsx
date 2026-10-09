import Link from "next/link";
import { ArrowRight, BarChart3, BellRing, Boxes, ClipboardList, Package, Smartphone, Users, Utensils, Pill, Store, BriefcaseBusiness } from "lucide-react";
import { MarketingLayout } from "../components/marketing";

const features = [
  { icon: Package, title: "Inventory overview", text: "See the items you track, their prices, and stock levels in one place." },
  { icon: BellRing, title: "Low-stock awareness", text: "Identify items that may need attention before they run out." },
  { icon: BarChart3, title: "Business summaries", text: "Get a clearer snapshot of activity to support everyday decisions." },
  { icon: ClipboardList, title: "Simple workflows", text: "Keep common tasks easy to find as your business grows." },
  { icon: Smartphone, title: "Mobile-friendly design", text: "Use a layout designed to adapt to phones, tablets, and computers." },
  { icon: Users, title: "Built for small teams", text: "A straightforward workspace for owners and the people who help run the business." },
];
const businessTools = [
  { icon: Store, title: "Retail shops", text: "Products, pricing, and everyday stock." },
  { icon: Utensils, title: "Restaurants", text: "Ingredients, drinks, and operating supplies." },
  { icon: Pill, title: "Pharmacies", text: "Supply visibility and stock organization." },
  { icon: BriefcaseBusiness, title: "Service businesses", text: "Materials and supplies for daily jobs." },
];

export default function FeaturesPage() {
  return <MarketingLayout><main className="inner-page">
    <section className="inner-hero"><span className="section-kicker">FEATURES</span><h1>Everyday business tools, <span>made simpler.</span></h1><p>Rwanda Stock brings practical stock and business workflows into one easy-to-navigate workspace.</p><Link href="/dashboard" className="marketing-button">Explore the demo <ArrowRight size={16}/></Link></section>
    <section className="marketing-section inner-section"><div className="section-intro"><h2>A clearer way to manage the day.</h2><p>These are the core capabilities the platform is being built around.</p></div><div className="feature-cards">{features.map(({icon:Icon,title,text})=><article className="feature-card" key={title}><span className="feature-card-icon"><Icon size={21}/></span><h3>{title}</h3><p>{text}</p></article>)}</div></section>
    <section className="marketing-section tools-section"><div className="section-intro"><h2>Choose tools for your business type.</h2><p>Start with a workspace that reflects the work you do.</p></div><div className="tool-type-grid">{businessTools.map(({icon:Icon,title,text})=><article key={title} className="tool-type"><Icon size={22}/><div><h3>{title}</h3><p>{text}</p></div></article>)}</div></section>
    <section className="home-cta"><div><span className="section-kicker">TRY THE CURRENT DEMO</span><h2>See the workspace in action.</h2><p>Sample data is included so you can explore the interface.</p></div><Link href="/dashboard" className="marketing-button light">Open dashboard <ArrowRight size={16}/></Link></section>
  </main></MarketingLayout>;
}
