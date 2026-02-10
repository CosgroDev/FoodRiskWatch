"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

const tiers = [
  {
    name: "Monthly",
    price: "Free",
    priceDetail: "forever",
    frequency: "monthly",
    description: "Get started with monthly food safety digests",
    features: [
      "Monthly digest on the 1st",
      "Filter by product categories",
      "Aggregated hazards & origins",
      "Full alert details",
    ],
    cta: "Current Plan",
    highlighted: false,
    color: "primary",
  },
  {
    name: "Weekly",
    price: "£7",
    priceDetail: "/month",
    frequency: "weekly",
    description: "Stay informed with weekly updates",
    features: [
      "Weekly digest every Monday",
      "Filter by product categories",
      "Aggregated hazards & origins",
      "Full alert details",
      "Priority email support",
    ],
    cta: "Upgrade to Weekly",
    highlighted: true,
    color: "blue",
  },
  {
    name: "Daily",
    price: "£11",
    priceDetail: "/month",
    frequency: "daily",
    description: "Never miss an alert with daily updates",
    features: [
      "Daily digest every morning",
      "Filter by product categories",
      "Aggregated hazards & origins",
      "Full alert details",
      "Priority email support",
    ],
    cta: "Upgrade to Daily",
    highlighted: false,
    color: "purple",
  },
];

function PricingContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleUpgrade = async (frequency: string) => {
    if (!token) {
      setError("Please access this page from your manage preferences link");
      return;
    }

    setLoading(frequency);
    setError(null);

    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, frequency }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.message || "Could not start checkout");
      }

      const { url } = await res.json();
      if (url) {
        window.location.href = url;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unexpected error");
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="card p-6 md:p-8 max-w-5xl mx-auto space-y-8">
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border border-border bg-base text-primary font-semibold text-sm">
          <span className="h-2 w-2 rounded-full bg-primary" />
          Pricing
        </div>
        <h1 className="text-3xl font-bold">Choose your alert frequency</h1>
        <p className="text-muted max-w-2xl mx-auto">
          All plans include the same powerful features. Choose how often you want to receive your food safety digest.
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
          <p className="text-red-700">{error}</p>
        </div>
      )}

      <div className="grid md:grid-cols-3 gap-6">
        {tiers.map((tier) => (
          <div
            key={tier.name}
            className={`relative rounded-2xl border-2 p-6 flex flex-col ${
              tier.highlighted
                ? "border-blue-500 bg-blue-50/30 shadow-lg scale-[1.02]"
                : "border-border bg-base"
            }`}
          >
            {tier.highlighted && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <span className="bg-blue-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                  Most Popular
                </span>
              </div>
            )}

            <div className="mb-4">
              <h3 className={`text-xl font-bold ${
                tier.color === "blue" ? "text-blue-700" :
                tier.color === "purple" ? "text-purple-700" :
                "text-ink"
              }`}>
                {tier.name}
              </h3>
              <p className="text-muted text-sm mt-1">{tier.description}</p>
            </div>

            <div className="mb-6">
              <span className={`text-4xl font-extrabold ${
                tier.color === "blue" ? "text-blue-700" :
                tier.color === "purple" ? "text-purple-700" :
                "text-ink"
              }`}>
                {tier.price}
              </span>
              <span className="text-muted text-sm">{tier.priceDetail}</span>
            </div>

            <ul className="space-y-3 mb-6 flex-1">
              {tier.features.map((feature) => (
                <li key={feature} className="flex gap-2 text-sm">
                  <svg
                    className={`w-5 h-5 shrink-0 ${
                      tier.color === "blue" ? "text-blue-500" :
                      tier.color === "purple" ? "text-purple-500" :
                      "text-primary"
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-secondary">{feature}</span>
                </li>
              ))}
            </ul>

            {tier.frequency === "monthly" ? (
              <div className="px-4 py-3 rounded-lg bg-surface border border-border text-center text-muted font-medium">
                {token ? "Your Current Plan" : "Free Forever"}
              </div>
            ) : (
              <button
                onClick={() => handleUpgrade(tier.frequency)}
                disabled={loading !== null}
                className={`px-4 py-3 rounded-lg font-semibold transition ${
                  tier.color === "blue"
                    ? "bg-blue-600 hover:bg-blue-700 text-white"
                    : "bg-purple-600 hover:bg-purple-700 text-white"
                } ${loading === tier.frequency ? "opacity-70 cursor-wait" : ""}`}
              >
                {loading === tier.frequency ? "Loading..." : tier.cta}
              </button>
            )}
          </div>
        ))}
      </div>

      <div className="text-center space-y-4 pt-4 border-t border-border">
        <p className="text-sm text-muted">
          All paid plans include a 7-day free trial. Cancel anytime.
        </p>
        <div className="flex justify-center gap-6 text-sm">
          <a href="/terms" className="text-primary hover:underline">Terms of Service</a>
          <a href="/privacy" className="text-primary hover:underline">Privacy Policy</a>
        </div>
        {token && (
          <a
            href={`/preferences?token=${encodeURIComponent(token)}`}
            className="inline-block text-primary hover:underline font-medium"
          >
            &larr; Back to Preferences
          </a>
        )}
      </div>
    </div>
  );
}

export default function PricingPage() {
  return (
    <Suspense fallback={<div className="card p-6"><p>Loading...</p></div>}>
      <PricingContent />
    </Suspense>
  );
}
