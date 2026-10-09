import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "EasyPay Rwanda | Simple payments for business",
  description: "Simple payment requests, mobile-money payments, wallets and payment tracking for Rwanda's small businesses.",
  applicationName: "EasyPay Rwanda"
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}