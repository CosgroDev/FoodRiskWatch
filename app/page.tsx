"use client";

import { FormEvent, useState } from "react";
import { Section, SectionHeader } from "@/components/Section";
import { Tabs } from "@/components/Tabs";
import { FeatureCard } from "@/components/FeatureCard";

type SubscribeResponse = {
  verifyUrl?: string;
  manageUrl?: string;
  isExistingUser?: boolean;
};

const features = [
  {
    title: "Real-time RASFF Alerts",
    description: "Get notified of EU food safety alerts as they're published. Stay ahead of potential risks in your supply chain.",
  },
  {
    title: "Category Filtering",
    description: "Filter alerts by product categories that matter to your business. Focus on what's relevant to you.",
  },
  {
    title: "Aggregated Hazards",
    description: "See all hazards and origin countries per alert in one view. Quickly assess risk exposure.",
  },
  {
    title: "Flexible Digests",
    description: "Choose daily, weekly, or monthly summaries. Get the right frequency for your workflow.",
  },
  {
    title: "Magic Link Auth",
    description: "No passwords to remember. Secure access via email link. Simple and safe.",
  },
  {
    title: "Detailed Reports",
    description: "Access full RASFF data for compliance documentation. Everything you need for audits.",
  },
];

const demoTabs = [
  { id: "dashboard", label: "Alert Dashboard" },
  { id: "hazards", label: "Hazard Analysis" },
  { id: "categories", label: "Category Filters" },
  { id: "settings", label: "Notifications" },
];

const sampleAlerts = [
  { id: 1, product: "Organic almonds", hazard: "Salmonella", origin: "Turkey", date: "2024-01-15", selected: true },
  { id: 2, product: "Frozen berries", hazard: "Norovirus", origin: "Poland", date: "2024-01-14", selected: false },
  { id: 3, product: "Olive oil", hazard: "Pesticide residue", origin: "Spain", date: "2024-01-13", selected: false },
];

export default function HomePage() {
  const [email, setEmail] = useState("");
  const [result, setResult] = useState<SubscribeResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedAlert, setSelectedAlert] = useState(sampleAlerts[0]);

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
    <div className="space-y-0">
      {/* Hero Section */}
      <Section className="text-center pt-8 md:pt-12 pb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-border bg-base text-primary font-semibold text-sm mb-6">
          <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
          FoodRisk Watch
        </div>
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-text leading-tight max-w-4xl mx-auto">
          Food safety alerts, tailored to you.
        </h1>
        <p className="mt-6 text-lg md:text-xl text-textMuted max-w-2xl mx-auto leading-relaxed">
          Turn public EU RASFF alerts into clean, actionable digests. Filter by product categories,
          track hazards, and stay compliant with automated notifications.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <a href="#get-started" className="btn-primary w-auto px-6">
            Get started free
          </a>
          <a href="#demo" className="btn-muted">
            See how it works
          </a>
        </div>
      </Section>

      {/* Features Grid */}
      <Section className="bg-base border-y border-border">
        <SectionHeader
          title="Everything you need for food safety monitoring"
          subtitle="Built for QA teams, compliance officers, and supply chain managers who need reliable, timely alerts."
          centered
        />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => (
            <FeatureCard key={feature.title} title={feature.title} description={feature.description} />
          ))}
        </div>
      </Section>

      {/* Authentication Section */}
      <Section id="get-started">
        <div className="max-w-xl mx-auto">
          <SectionHeader
            title="Welcome to FoodRisk Watch"
            subtitle="Enter your email to get started or sign in to manage your existing alerts."
            centered
          />
          <div className="card p-6 md:p-8 shadow-pop">
            <form onSubmit={onSubmit} className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="email">Your email address</label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  aria-describedby="email-help"
                />
              </div>
              <button className="btn-primary" type="submit" disabled={loading}>
                {loading ? "Sending link…" : "Continue with email"}
              </button>
              <p id="email-help" className="text-xs text-textMuted text-center">
                No password needed. We&apos;ll email you a secure magic link.
              </p>
              {error && (
                <p className="text-danger text-sm text-center" role="alert">
                  {error}
                </p>
              )}
              {result && (
                <div className="p-4 rounded-lg bg-green-50 border border-green-200" role="status">
                  <p className="text-green-800 font-medium text-center">Check your inbox!</p>
                  {result.isExistingUser ? (
                    <p className="text-green-700 text-sm text-center mt-1">
                      Welcome back! We&apos;ve sent you a link to manage your preferences.
                    </p>
                  ) : (
                    <p className="text-green-700 text-sm text-center mt-1">
                      We&apos;ve sent you an email with a link to set up your alerts.
                    </p>
                  )}
                </div>
              )}
            </form>
            <div className="mt-6 pt-6 border-t border-border">
              <p className="text-sm text-textMuted text-center">
                Already have an account?{" "}
                <button
                  type="button"
                  onClick={() => document.getElementById("email")?.focus()}
                  className="text-primary font-semibold hover:underline"
                >
                  Sign in with email
                </button>
              </p>
            </div>
          </div>
        </div>
      </Section>

      {/* Demo Section */}
      <Section id="demo" className="bg-base border-y border-border">
        <SectionHeader
          title="See FoodRisk Watch in action"
          subtitle="Explore how our platform helps you monitor food safety alerts efficiently."
          centered
        />
        <div className="card p-4 md:p-6">
          <Tabs tabs={demoTabs}>
            {(activeTab) => (
              <div className="min-h-[320px]">
                {activeTab === "dashboard" && (
                  <div className="grid md:grid-cols-5 gap-4">
                    {/* Alert List */}
                    <div className="md:col-span-2 space-y-2">
                      {sampleAlerts.map((alert) => (
                        <button
                          key={alert.id}
                          onClick={() => setSelectedAlert(alert)}
                          className={`w-full text-left p-3 rounded-lg border transition-all duration-150 ${
                            selectedAlert.id === alert.id
                              ? "border-primary bg-primary/5 shadow-soft"
                              : "border-border hover:border-primary/50 hover:bg-surface"
                          }`}
                        >
                          <p className="font-semibold text-text text-sm">{alert.product}</p>
                          <p className="text-xs text-textMuted mt-1">
                            {alert.hazard} · {alert.origin}
                          </p>
                        </button>
                      ))}
                    </div>
                    {/* Alert Details */}
                    <div className="md:col-span-3 p-4 rounded-lg border border-border bg-surface">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="font-bold text-text">{selectedAlert.product}</h4>
                        <span className="px-2 py-1 rounded-full bg-danger/10 text-danger text-xs font-semibold">
                          Active Alert
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-textMuted">Hazard</p>
                          <p className="font-semibold text-text">{selectedAlert.hazard}</p>
                        </div>
                        <div>
                          <p className="text-textMuted">Origin</p>
                          <p className="font-semibold text-text">{selectedAlert.origin}</p>
                        </div>
                        <div>
                          <p className="text-textMuted">Date Published</p>
                          <p className="font-semibold text-text">{selectedAlert.date}</p>
                        </div>
                        <div>
                          <p className="text-textMuted">Notification</p>
                          <p className="font-semibold text-primary">Alert</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === "hazards" && (
                  <div className="space-y-4">
                    <p className="text-sm text-textMuted">
                      Analyze hazard trends across your monitored categories.
                    </p>
                    <div className="grid md:grid-cols-3 gap-4">
                      {[
                        { name: "Salmonella", count: 23, trend: "+5" },
                        { name: "Pesticide residue", count: 18, trend: "+2" },
                        { name: "Heavy metals", count: 12, trend: "-3" },
                      ].map((hazard) => (
                        <div key={hazard.name} className="p-4 rounded-lg border border-border bg-surface">
                          <p className="font-semibold text-text">{hazard.name}</p>
                          <div className="flex items-baseline gap-2 mt-2">
                            <span className="text-2xl font-bold text-text">{hazard.count}</span>
                            <span
                              className={`text-sm font-semibold ${
                                hazard.trend.startsWith("+") ? "text-danger" : "text-success"
                              }`}
                            >
                              {hazard.trend} this month
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {activeTab === "categories" && (
                  <div className="space-y-4">
                    <p className="text-sm text-textMuted">
                      Select product categories to filter your alerts.
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {[
                        { name: "Nuts & Seeds", active: true },
                        { name: "Fruits & Vegetables", active: true },
                        { name: "Fish & Seafood", active: false },
                        { name: "Meat & Poultry", active: false },
                        { name: "Dairy Products", active: true },
                        { name: "Cereals & Bakery", active: false },
                        { name: "Herbs & Spices", active: true },
                        { name: "Oils & Fats", active: false },
                      ].map((cat) => (
                        <button
                          key={cat.name}
                          className={`px-4 py-2 rounded-full text-sm font-semibold border transition-all duration-150 ${
                            cat.active
                              ? "bg-primary text-white border-primary"
                              : "bg-surface text-secondary border-border hover:border-primary"
                          }`}
                        >
                          {cat.name}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {activeTab === "settings" && (
                  <div className="max-w-md space-y-4">
                    <p className="text-sm text-textMuted">
                      Configure how and when you receive alerts.
                    </p>
                    <div className="space-y-3">
                      {[
                        { label: "Daily digest", description: "Every morning at 8 AM", checked: true },
                        { label: "Weekly summary", description: "Every Monday morning", checked: false },
                        { label: "Monthly report", description: "First of each month", checked: false },
                      ].map((option) => (
                        <label
                          key={option.label}
                          className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all duration-150 ${
                            option.checked ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
                          }`}
                        >
                          <input
                            type="radio"
                            name="frequency"
                            defaultChecked={option.checked}
                            className="mt-0.5 h-4 w-4 accent-primary"
                          />
                          <div>
                            <p className="font-semibold text-text text-sm">{option.label}</p>
                            <p className="text-xs text-textMuted">{option.description}</p>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </Tabs>
        </div>
      </Section>

      {/* Footer */}
      <footer className="py-8 text-center border-t border-border">
        <p className="text-sm text-textMuted">
          <span className="font-semibold text-text">FoodRisk Watch</span> · Powered by public RASFF data
        </p>
        <p className="text-xs text-textMuted mt-2">
          &copy; {new Date().getFullYear()} Food Risk. All rights reserved.
        </p>
        <p className="text-xs text-textMuted mt-2">
          <a href="mailto:info@foodrisk.co.uk" className="text-primary hover:underline">
            info@foodrisk.co.uk
          </a>
        </p>
      </footer>
    </div>
  );
}
