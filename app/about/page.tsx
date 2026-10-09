import Image from "next/image";
import Link from "next/link";
import { ArrowRight, HeartHandshake, MapPin, Sprout } from "lucide-react";
import { MarketingLayout } from "../components/marketing";

export default function AboutPage() {
  return <MarketingLayout><main className="inner-page">
    <section className="about-hero"><div><span className="section-kicker">ABOUT RWANDA STOCK</span><h1>Helping local businesses work with <span>more clarity.</span></h1><p>Small businesses keep communities moving. Rwanda Stock is being built to make everyday stock and business management easier to understand and use.</p><Link href="/features" className="marketing-button">Explore our approach <ArrowRight size={16}/></Link></div><div className="about-photo"><Image src="https://images.unsplash.com/photo-1556761175-b413da4baf72?auto=format&fit=crop&w=1200&q=85" alt="Small business team discussing their work" fill priority sizes="(max-width: 800px) 100vw, 50vw"/></div></section>
    <section className="about-values"><article><span><MapPin size={21}/></span><h2>Made with Rwanda in mind</h2><p>Our goal is to support the everyday needs of Rwandan small businesses with a practical, approachable experience.</p></article><article><span><Sprout size={21}/></span><h2>Grow step by step</h2><p>Start with essential workflows, then add more capabilities as the product matures.</p></article><article><span><HeartHandshake size={21}/></span><h2>Designed to be approachable</h2><p>Clear language and simple navigation should make business tools easier for more people to use.</p></article></section>
    <section className="home-cta"><div><span className="section-kicker">A WORK IN PROGRESS</span><h2>Help shape a simpler business workspace.</h2><p>Explore the demo and share what your business needs most.</p></div><Link href="/contact" className="marketing-button light">Contact us <ArrowRight size={16}/></Link></section>
  </main></MarketingLayout>;
}
