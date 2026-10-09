"use client";

import { useState } from "react";
import { Mail, MessageSquareText, Send } from "lucide-react";
import { MarketingLayout } from "../components/marketing";

export default function ContactPage() {
  const [sent, setSent] = useState(false);
  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSent(true);
  }
  return <MarketingLayout><main className="inner-page">
    <section className="inner-hero"><span className="section-kicker">CONTACT</span><h1>Tell us what your <span>business needs.</span></h1><p>We're shaping Rwanda Stock around real small-business workflows. Share a suggestion or a feature you'd like to see.</p></section>
    <section className="contact-layout"><div className="contact-info"><div className="contact-info-icon"><MessageSquareText size={22}/></div><h2>Let's make it useful.</h2><p>This preview form demonstrates the contact experience. It does not send or store messages yet.</p><div className="contact-note"><Mail size={18}/><span><strong>Support channel</strong><small>Official contact details will be added before public launch.</small></span></div></div>
      <form className="contact-form" onSubmit={handleSubmit}><h2>Send a suggestion</h2><label htmlFor="contact-name">Your name</label><input id="contact-name" name="name" placeholder="e.g. Aline" required/><label htmlFor="contact-email">Email address</label><input id="contact-email" name="email" type="email" placeholder="you@example.com" required/><label htmlFor="contact-topic">What is this about?</label><select id="contact-topic" name="topic" defaultValue="Feature suggestion"><option>Feature suggestion</option><option>Business tools</option><option>General feedback</option><option>Something else</option></select><label htmlFor="contact-message">Your message</label><textarea id="contact-message" name="message" rows={5} placeholder="Tell us what would help your business..." required/><button type="submit" className="marketing-button">Preview message <Send size={16}/></button>{sent && <p role="status" className="contact-success">Your form looks ready. This demo does not send messages yet.</p>}</form>
    </section>
  </main></MarketingLayout>;
}
