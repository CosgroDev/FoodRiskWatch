"use client";

import { FormEvent, useState } from "react";

type SubscribeResponse = {
  verifyUrl: string;
  manageUrl?: string;
};

const chips = ["Hazard filters", "Category filters", "Country filters", "E-Mail Report"];

const monitoringFeatures = [
  {
    title: "Real-time RASFF Alerts",
    body: "Get notified of EU food safety alerts as they're published. Stay ahead of potential risks in your supply chain.",
  },
  {
    title: "Category Filtering",
    body: "Filter alerts by product categories that matter to your business. Focus on what's relevant to you.",
  },
  {
    title: "Aggregated Hazards",
    body: "See all hazards and origin countries per alert in one view. Quickly assess risk exposure.",
  },
  {
    title: "Flexible Digests",
    body: "Choose daily, weekly, or monthly summaries. Get the right frequency for your workflow.",
  },
  {
    title: "Magic Link Auth",
    body: "No passwords to remember. Secure access via email link. Simple and safe.",
  },
  {
    title: "Detailed Reports",
    body: "Access full RASFF data for compliance documentation. Everything you need for audits.",
  },
];

const plans = [
  {
    name: "Monthly",
    subtitle: "Get started with monthly food safety digests",
    price: "Free",
    cta: "Get started free",
    points: [
      "Monthly digest on the 1st",
      "Filter by product categories",
      "Aggregated hazards & origins",
      "Full alert details",
    ],
  },
  {
    name: "Weekly",
    subtitle: "Stay informed with weekly updates",
    price: "£7/month",
    badge: "Most Popular",
    points: [
      "Weekly digest every Monday",
      "Filter by product categories",
      "Aggregated hazards & origins",
      "Full alert details",
      "Priority email support",
    ],
  },
  {
    name: "Daily",
    subtitle: "Never miss an alert with daily updates",
    price: "£11/month",
    points: [
      "Daily digest every morning",
      "Filter by product categories",
      "Aggregated hazards & origins",
      "Full alert details",
      "Priority email support",
    ],
  },
];

function CheckIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" aria-hidden="true">
      <path d="m5.5 12.5 4 4 9-9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function MailIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" aria-hidden="true">
      <rect x="3" y="5" width="18" height="14" rx="2" stroke="currentColor" strokeWidth="1.8" />
      <path d="m4 7 8 6 8-6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function HomePage() {
  const [email, setEmail] = useState("");
  const [result, setResult] = useState<SubscribeResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const onSubmit = async (evt: FormEvent) => {
    evt.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.message || "Could not subscribe");
      }
      const data = (await res.json()) as SubscribeResponse;
      setResult(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Unexpected error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="content-wrap space-y-8">
      <section className="grid lg:grid-cols-[1.3fr,1fr] overflow-hidden rounded-3xl border border-slate-200 shadow-sm">
        <div className="bg-gradient-to-br from-blue-600 to-blue-800 text-white px-8 py-10 md:px-10 md:py-12">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-100">Early access pilot</p>
          <h1 className="text-3xl md:text-4xl font-extrabold leading-tight mt-3">Food safety alerts, tailored to you.</h1>
          <p className="text-blue-100 leading-relaxed mt-4 max-w-2xl">
            FoodRisk Watch turns public EU safety alerts into clean, weekly digests. Choose hazards, product categories,
            and countries-then let us curate the noise into action.
          </p>

          <div className="flex flex-wrap gap-2 mt-5">
            {chips.map((chip) => (
              <span
                key={chip}
                className="inline-flex items-center gap-2 rounded-lg border border-blue-300/35 bg-blue-500/25 px-3 py-1.5 text-sm font-semibold text-blue-50"
              >
                <span className="text-blue-100">
                  <CheckIcon />
                </span>
                {chip}
              </span>
            ))}
          </div>
        </div>

        <div className="bg-slate-100/70 px-6 py-8 md:px-8 md:py-10">
          <div className="card p-6 md:p-7">
            <div className="flex items-center gap-2 mb-4">
              <span className="icon-badge">
                <MailIcon />
              </span>
              <div>
                <p className="m-0 text-sm font-semibold text-slate-900">Welcome to FoodRisk Watch</p>
                <p className="m-0 text-xs text-slate-500">
                  Enter your email to get started or sign in to manage your existing alerts.
                </p>
              </div>
            </div>

            <form onSubmit={onSubmit} className="space-y-3">
              <label htmlFor="email">Your email address</label>
              <input
                id="email"
                name="email"
                type="email"
                required
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <button className="btn-primary" type="submit" disabled={loading}>
                {loading ? "Submitting..." : "Continue with email"}
              </button>
              <p className="text-xs text-slate-500 m-0">No password needed. We'll email you a secure magic link.</p>
              <p className="text-xs text-slate-600 m-0">Already have an account? Sign in with email</p>
            </form>

            {error && <p className="text-red-600 text-sm m-0 mt-3">{error}</p>}
            {result && (
              <div className="text-sm grid gap-2 p-3 rounded-lg bg-slate-50 border border-slate-200 mt-4">
                <strong className="text-slate-900">Test links</strong>
                <a href={result.verifyUrl} className="text-blue-700 underline">
                  Verify link
                </a>
                {result.manageUrl && (
                  <a href={result.manageUrl} className="text-blue-700 underline">
                    Manage preferences
                  </a>
                )}
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 m-0">Everything you need for food safety monitoring</h2>
          <p className="text-slate-600 mt-2 m-0">
            Built for QA teams, compliance officers, and supply chain managers who need reliable, timely alerts.
          </p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {monitoringFeatures.map((feature) => (
            <article key={feature.title} className="card p-5">
              <div className="h-7 w-7 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center mb-3">
                <CheckIcon />
              </div>
              <h3 className="m-0 text-base font-semibold text-slate-900">{feature.title}</h3>
              <p className="m-0 mt-2 text-sm text-slate-600 leading-relaxed">{feature.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 m-0">Simple, transparent pricing</h2>
          <p className="text-slate-600 mt-2 m-0">
            All plans include the same powerful features. Choose how often you want to receive your food safety digest.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-4">
          {plans.map((plan) => (
            <article key={plan.name} className="card p-5 relative">
              {plan.badge && (
                <span className="absolute right-4 top-4 rounded-full bg-blue-600 px-2.5 py-1 text-[11px] font-semibold text-white">
                  {plan.badge}
                </span>
              )}
              <h3 className="m-0 text-lg font-semibold text-slate-900">{plan.name}</h3>
              <p className="m-0 mt-1 text-sm text-slate-600">{plan.subtitle}</p>
              <p className="m-0 mt-4 text-2xl font-extrabold text-blue-700">{plan.price}</p>
              <ul className="mt-4 space-y-2 text-sm text-slate-700">
                {plan.points.map((point) => (
                  <li key={point} className="flex items-start gap-2">
                    <span className="text-blue-700 mt-0.5">
                      <CheckIcon />
                    </span>
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>

        <p className="text-sm text-slate-600 m-0">Start free, upgrade anytime. No credit card required.</p>
      </section>

      <section className="card p-6 space-y-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 m-0">See FoodRisk Watch in action</h2>
          <p className="text-slate-600 mt-2 m-0">
            Explore how our platform helps you monitor food safety alerts efficiently.
          </p>
        </div>

        <div className="flex flex-wrap gap-2 text-sm">
          {[
            "Alert Dashboard",
            "Hazard Analysis",
            "Category Filters",
            "Notifications",
          ].map((tab) => (
            <span key={tab} className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 font-medium text-slate-700">
              {tab}
            </span>
          ))}
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-3">
            <div className="rounded-lg border border-slate-200 bg-white p-3">
              <p className="m-0 font-semibold text-slate-900">Organic almonds</p>
              <p className="m-0 text-sm text-slate-600">Salmonella - Turkey</p>
            </div>
            <div className="rounded-lg border border-slate-200 bg-white p-3">
              <p className="m-0 font-semibold text-slate-900">Frozen berries</p>
              <p className="m-0 text-sm text-slate-600">Norovirus - Poland</p>
            </div>
            <div className="rounded-lg border border-slate-200 bg-white p-3">
              <p className="m-0 font-semibold text-slate-900">Olive oil</p>
              <p className="m-0 text-sm text-slate-600">Pesticide residue - Spain</p>
            </div>
          </div>

          <div className="rounded-xl border border-blue-100 bg-blue-50 p-4 space-y-2">
            <p className="m-0 font-semibold text-slate-900">Organic almonds</p>
            <p className="m-0 text-xs uppercase tracking-wide text-blue-700">Active Alert</p>
            <div className="grid grid-cols-[120px,1fr] gap-y-1 text-sm">
              <span className="text-slate-500">Hazard</span>
              <span className="text-slate-900 font-medium">Salmonella</span>
              <span className="text-slate-500">Origin</span>
              <span className="text-slate-900 font-medium">Turkey</span>
              <span className="text-slate-500">Date Published</span>
              <span className="text-slate-900 font-medium">2024-01-15</span>
              <span className="text-slate-500">Notification</span>
              <span className="text-slate-900 font-medium">Alert</span>
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-slate-200 pt-4 pb-1 flex flex-wrap items-center justify-between gap-3">
        <small>FoodRisk Watch - Powered by public RASFF data</small>
        <small>© 2026 Food Risk. All rights reserved.</small>
        <a href="mailto:info@foodrisk.co.uk" className="text-sm text-blue-700 underline">
          info@foodrisk.co.uk
        </a>
      </footer>
    </div>
  );
}

