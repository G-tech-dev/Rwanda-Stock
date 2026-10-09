import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Rwanda Stock | Business made simpler",
  description: "Simple stock and sales management tools for small businesses in Rwanda.",
  applicationName: "Rwanda Stock"
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}