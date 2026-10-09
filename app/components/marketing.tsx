import Link from "next/link";
import { ArrowRight, Leaf } from "lucide-react";

const links = [
  { href: "/features", label: "Features" },
  { href: "/pricing", label: "Pricing" },
  { href: "/payments", label: "Payments" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
];

export function MarketingHeader() {
  return (
    <header className="marketing-header">
      <Link href="/" className="marketing-brand" aria-label="Rwanda Stock home">
        <span className="marketing-brand-mark"><Leaf size={22} /></span>
        <span>Rwanda Stock<span className="marketing-brand-sub">Business made simpler</span></span>
      </Link>
      <nav className="marketing-nav" aria-label="Main navigation">
        {links.map(link => <Link key={link.href} href={link.href}>{link.label}</Link>)}
      </nav>
      <div className="marketing-header-actions">
        <Link href="/dashboard" className="marketing-login">Sign in</Link>
        <Link href="/dashboard" className="marketing-button small">Open dashboard <ArrowRight size={15} /></Link>
      </div>
    </header>
  );
}

export function MarketingFooter() {
  return (
    <footer className="marketing-footer">
      <Link href="/" className="marketing-brand">
        <span className="marketing-brand-mark"><Leaf size={20} /></span>
        <span>Rwanda Stock<span className="marketing-brand-sub">Business made simpler</span></span>
      </Link>
      <p>Simple tools for Rwanda's small businesses.</p>
      <div className="marketing-footer-links">
        {links.map(link => <Link key={link.href} href={link.href}>{link.label}</Link>)}
        <Link href="/dashboard">Dashboard</Link>
      </div>
      <small>© {new Date().getFullYear()} Rwanda Stock. Demo experience.</small>
    </footer>
  );
}

export function MarketingLayout({ children }: { children: React.ReactNode }) {
  return <div className="marketing-site"><MarketingHeader />{children}<MarketingFooter /></div>;
}
