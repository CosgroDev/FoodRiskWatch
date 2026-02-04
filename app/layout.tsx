import React from "react";
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "FoodRisk Watch",
  description: "Stay ahead of food safety alerts powered by public RASFF data.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <main>
          <header className="flex flex-col items-center gap-3 mb-6">
            <div className="text-center leading-tight">
              <div className="text-3xl md:text-4xl font-black text-primary tracking-tight">FoodRisk</div>
              <div className="text-xl md:text-2xl font-extrabold text-secondary tracking-[0.28em]">WATCH</div>
            </div>
            <nav className="flex flex-wrap gap-2 justify-center">
              {[
                { href: "/", label: "Home" },
                { href: "/privacy", label: "Privacy" },
                { href: "/terms", label: "Terms" },
              ].map((link) => (
                <a key={link.href} href={link.href} className="btn-muted px-4 py-2">
                  {link.label}
                </a>
              ))}
            </nav>
          </header>
          {children}
        </main>
      </body>
    </html>
  );
}
