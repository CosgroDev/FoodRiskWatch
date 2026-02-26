import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "FoodRisk Watch",
  description: "Stay ahead of food safety alerts powered by public RASFF data.",
};

const links = [
  { href: "/", label: "Home" },
  { href: "/privacy", label: "Privacy" },
  { href: "/terms", label: "Terms" },
];

function ShieldIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path
        d="M12 3 5 6v5c0 5.1 3.4 9.7 7 11 3.6-1.3 7-5.9 7-11V6l-7-3Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="m8.8 11.8 2.1 2.1 4.3-4.3" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <div className="beta-bar">
          Early access pilot is live. Monthly RASFF alerts are free while we validate features.
        </div>

        <header className="site-header">
          <div className="site-header-inner">
            <Link href="/" className="flex items-center gap-2">
              <span className="brand-mark">
                <ShieldIcon className="h-5 w-5" />
              </span>
              <span className="font-bold leading-tight" style={{ color: "#17C6CF" }}>
                Food Risk <span className="text-slate-400 font-normal">|</span> Watch
              </span>
            </Link>

            <nav className="flex flex-wrap gap-2 justify-end">
              {links.map((link) => (
                <Link key={link.href} href={link.href} className="btn-muted">
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>
        </header>

        {children}
      </body>
    </html>
  );
}


