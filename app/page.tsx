"use client";

import { FormEvent, useState } from "react";

type SubscribeResponse = {
  verifyUrl: string;
  manageUrl?: string;
};

const chips = ["Product category filters", "Aggregated hazard alerts", "Origin country tracking", "Weekly digest"];

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
    <div className="card grid gap-6 p-6 md:p-7">
      <div className="space-y-3 text-center md:text-left">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border border-border bg-base text-primary font-semibold text-sm">
          <span className="h-2 w-2 rounded-full bg-primary" />
          Early access pilot
        </div>
        <h1 className="text-3xl md:text-[34px] font-extrabold leading-tight">Food safety alerts, tailored to you.</h1>
        <p className="text-muted leading-relaxed max-w-3xl mx-auto md:mx-0">
          FoodRisk Watch turns public EU RASFF alerts into clean, weekly digests. Filter by product categories
          and receive alerts with aggregated hazards and origin countries—curated for your QA and supply chain teams.
        </p>
        <div className="flex flex-wrap justify-center md:justify-start gap-2 mt-1">
          {chips.map((c) => (
            <span key={c} className="px-3 py-1.5 rounded-lg border border-border bg-base text-secondary text-sm font-semibold">
              {c}
            </span>
          ))}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 items-start">
        <form onSubmit={onSubmit} className="card p-5 shadow-pop border border-border relative overflow-visible">
          <div className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="email">Work or personal email</label>
              <input
                id="email"
                name="email"
                type="email"
                required
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <button className="btn-primary" type="submit" disabled={loading}>
              {loading ? "Submitting…" : "Get early alerts"}
            </button>
            {error && <p className="text-red-600 text-sm m-0">{error}</p>}
            {result && (
              <div className="text-sm p-3 rounded-lg bg-green-50 border border-green-200">
                <p className="text-green-800 m-0 font-medium">Check your inbox!</p>
                <p className="text-green-700 m-0 mt-1">We&apos;ve sent you a verification email. Click the link to activate your subscription.</p>
              </div>
            )}
          </div>
        </form>

        <div className="card p-5 border border-border">
          <div className="space-y-2">
            <p className="font-bold text-ink m-0 text-lg">What you get</p>
            <p className="text-muted m-0 text-sm">Curated signal, ready for your QA or supply teams.</p>
          </div>
          <div className="mt-3 space-y-3">
            {[
              "No login required — secure magic links",
              "Weekly digest emails with your alerts",
              "Filter by product categories",
              "View all hazards and origin countries per alert",
              "Detailed alert pages with full RASFF data",
            ].map((item) => (
              <div key={item} className="flex gap-3 items-start">
                <span className="h-2.5 w-2.5 mt-1 rounded-full bg-primary" />
                <span className="text-textMuted">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="pt-4 border-t border-slate-200 text-center md:text-left space-y-2">
        <p className="text-sm text-muted m-0">
          Powered by public RASFF data. We are not affiliated with RASFF or the European Commission.
        </p>
        <p className="text-sm text-muted m-0">
          Developed by <span className="font-semibold text-ink">CGRV</span>. For issues or queries, contact{" "}
          <a href="mailto:dale@cgrv.co.uk" className="text-primary hover:underline">dale@cgrv.co.uk</a>
        </p>
      </div>
    </div>
  );
}
