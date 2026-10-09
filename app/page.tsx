import Link from "next/link";
import Image from "next/image";
import { ArrowRight, BarChart3, Boxes, CheckCircle2, ShieldCheck, Smartphone, Store, Utensils, Pill, BriefcaseBusiness, Wallet } from "lucide-react";
import { MarketingLayout } from "./components/marketing";

const businessTypes = [
  { title: "Retail shops", description: "Create payment requests and track what customers owe.", icon: Store, image: "https://images.unsplash.com/photo-1604719312566-8912e9c8a213?auto=format&fit=crop&w=900&q=85" },
  { title: "Restaurants", description: "Collect payments for meals, catering, and deliveries.", icon: Utensils, image: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=900&q=85" },
  { title: "Pharmacies", description: "Track payment requests for pharmacy purchases and services.", icon: Pill, image: "https://images.unsplash.com/photo-1576602976047-174e57a47881?auto=format&fit=crop&w=900&q=85" },
  { title: "Service businesses", description: "Request and record payments for your services.", icon: BriefcaseBusiness, image: "https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=900&q=85" },
];

export default function HomePage() {
  return (
    <MarketingLayout>
      <main>
        <section className="home-hero">
          <div className="home-hero-copy">
            <span className="eyebrow-pill"><span className="eyebrow-dot" /> MADE FOR RWANDAN BUSINESSES</span>
            <h1>Run your business with <span>more confidence.</span></h1>
            <p className="home-hero-lead">Request payments, track what is pending, and make it easier for customers to pay you using mobile money.</p>
            <div className="home-hero-actions">
              <Link href="/dashboard" className="marketing-button">Explore the dashboard <ArrowRight size={17} /></Link>
              <Link href="/features" className="marketing-secondary-link">Explore features</Link>
            </div>
            <div className="hero-trust"><span><CheckCircle2 size={16} /> Simple to start</span><span><CheckCircle2 size={16} /> Built for small teams</span></div>
          </div>
          <div className="home-hero-visual">
            <div className="hero-photo-main">
              <Image src="https://images.unsplash.com/photo-1556740738-b6a63e27c4df?auto=format&fit=crop&w=1200&q=90" alt="Small business owner serving a customer at a shop counter" fill priority sizes="(max-width: 800px) 100vw, 50vw" />
            </div>
            <div className="hero-float-card"><span className="float-icon"><Wallet size={18} /></span><div><strong>Payments at a glance</strong><span>See pending payments clearly</span></div><CheckCircle2 size={19} className="float-check" /></div>
            <div className="hero-photo-small"><Image src="https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?auto=format&fit=crop&w=700&q=85" alt="Business owner using a payment terminal" fill sizes="180px" /></div>
            <div className="hero-decor hero-decor-one" /><div className="hero-decor hero-decor-two" />
          </div>
        </section>

        <section className="home-proof-strip" aria-label="Product benefits">
          <div><span className="proof-icon"><Boxes size={20}/></span><span><strong>Payment tracking</strong><small>Track payment requests</small></span></div>
          <div><span className="proof-icon"><BarChart3 size={20}/></span><span><strong>Clearer decisions</strong><small>See business activity</small></span></div>
          <div><span className="proof-icon"><Smartphone size={20}/></span><span><strong>Mobile-friendly</strong><small>Designed for everyday use</small></span></div>
          <div><span className="proof-icon"><ShieldCheck size={20}/></span><span><strong>Privacy-minded</strong><small>Build with care</small></span></div>
        </section>

        <section className="marketing-section business-section">
          <div className="section-intro"><span className="section-kicker">ONE PLATFORM, MANY BUSINESSES</span><h2>Payments that fit the way <span>you work.</span></h2><p>Choose the type of business you run and start with a workspace that makes sense for your day.</p></div>
          <div className="business-cards">{businessTypes.map(({title,description,icon:Icon,image}) => <article className="business-card" key={title}><div className="business-card-image"><Image src={image} alt={title} fill sizes="(max-width: 700px) 100vw, 25vw" /><span className="business-card-icon"><Icon size={19}/></span></div><div className="business-card-copy"><h3>{title}</h3><p>{description}</p><Link href="/features">Explore tools <ArrowRight size={14}/></Link></div></article>)}</div>
        </section>

        <section className="home-feature-band">
          <div className="feature-band-image"><Image src="https://images.unsplash.com/photo-1556742502-ec7c0e9f34b1?auto=format&fit=crop&w=1200&q=85" alt="Small business owner reviewing business activity" fill sizes="(max-width: 800px) 100vw, 45vw" /></div>
          <div className="feature-band-copy"><span className="section-kicker">LESS GUESSWORK, MORE CLARITY</span><h2>Spend less time chasing numbers.</h2><p>Start with payment requests and a clear view of what is pending. EasyPay Rwanda helps local businesses get paid with less confusion.</p><ul><li><CheckCircle2 size={18}/> Payment request creation and tracking</li><li><CheckCircle2 size={18}/> Business-type specific tools</li><li><CheckCircle2 size={18}/> A clean experience on phones and computers</li></ul><Link href="/features" className="marketing-button">See all features <ArrowRight size={16}/></Link></div>
        </section>

        <section className="home-cta"><div><span className="section-kicker">YOUR BUSINESS, MORE ORGANIZED</span><h2>Ready to take a clearer look at your business?</h2><p>Explore the current demo and see how Rwanda Stock can fit your workflow.</p></div><Link href="/dashboard" className="marketing-button light">Open the dashboard <ArrowRight size={16}/></Link></section>
      </main>
    </MarketingLayout>
  );
}
