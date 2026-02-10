"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

type PrefsResponse = {
  frequency: "monthly" | "weekly" | "daily";
  categories: string[];
  availableCategories: string[];
};

function OptionPills({
  label,
  options,
  values,
  onChange,
}: {
  label: string;
  options: string[];
  values: string[];
  onChange: (values: string[]) => void;
}) {
  const toggle = (value: string) => {
    if (values.includes(value)) {
      onChange(values.filter((v) => v !== value));
    } else {
      onChange([...values, value]);
    }
  };

  const allSelected = options.length > 0 && values.length === options.length;

  const selectAll = () => {
    onChange([...options]);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <label className="font-semibold">{label}</label>
        <div className="flex gap-2">
          {!allSelected && options.length > 0 && (
            <button
              type="button"
              onClick={selectAll}
              className="text-xs font-semibold text-primary hover:text-primaryHover transition"
            >
              Select all
            </button>
          )}
          {values.length > 0 && (
            <button
              type="button"
              onClick={() => onChange([])}
              className="text-xs font-semibold text-primary hover:text-primaryHover transition"
            >
              Clear
            </button>
          )}
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        {options.map((opt) => {
          const active = values.includes(opt);
          return (
            <button
              key={opt}
              type="button"
              onClick={() => toggle(opt)}
              className={`px-3 py-2 text-sm rounded-lg border transition shadow-[0_4px_10px_rgba(15,23,42,0.05)] ${
                active
                  ? "bg-primary text-white border-primary"
                  : "bg-surface text-secondary border-border hover:border-primary/60"
              }`}
            >
              {opt}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function PreferencesContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || undefined;
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const [frequency, setFrequency] = useState<"monthly" | "weekly" | "daily">("monthly");
  const [categories, setCategories] = useState<string[]>([]);

  // Dynamic options from the database
  const [availableCategories, setAvailableCategories] = useState<string[]>([]);

  useEffect(() => {
    if (!token) return;
    setLoading(true);
    fetch(`/api/preferences?token=${encodeURIComponent(token)}`)
      .then(async (res) => {
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.message || "Could not load preferences");
        }
        const data = (await res.json()) as PrefsResponse;
        setFrequency(data.frequency);
        setCategories(data.categories || []);
        setAvailableCategories(data.availableCategories || []);
      })
      .catch((err: unknown) => setError(err instanceof Error ? err.message : "Unexpected error"))
      .finally(() => setLoading(false));
  }, [token]);

  const isPaidTier = frequency === "weekly" || frequency === "daily";

  const save = async () => {
    if (!token) return;
    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      const res = await fetch("/api/preferences", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, frequency, categories }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.message || "Could not save preferences");
      }
      setMessage("Preferences saved");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Unexpected error");
    } finally {
      setSaving(false);
    }
  };

  if (!token) {
    return (
      <div className="card p-6">
        <h1 className="text-xl font-bold">Missing token</h1>
        <p>Open this page from your magic manage link.</p>
      </div>
    );
  }

  return (
    <div className="card p-6 space-y-5">
      <div className="space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border border-border bg-base text-primary font-semibold text-sm">
          <span className="h-2 w-2 rounded-full bg-primary" />
          Manage alerts
        </div>
        <h1 className="text-2xl font-bold">Your alert preferences</h1>
        <p className="text-muted text-sm">
          Choose which product categories you want to receive alerts for.
        </p>
      </div>

      {loading && <p>Loading…</p>}
      {error && <p className="text-red-600">{error}</p>}
      {message && <p className="text-green-700">{message}</p>}

      <div className="p-4 bg-base border border-border rounded-xl shadow-soft">
        <OptionPills label="Product Categories" options={availableCategories} values={categories} onChange={setCategories} />
        {availableCategories.length === 0 && !loading && (
          <p className="text-xs text-muted mt-2">No category data available yet.</p>
        )}
      </div>

      <div className="p-4 bg-base border border-border rounded-xl shadow-soft">
        <div className="grid gap-3">
          <div className="flex items-center justify-between">
            <label className="font-semibold">Your Plan</label>
            <a href="/pricing" className="text-sm text-primary hover:underline font-medium">
              {isPaidTier ? "Manage subscription" : "Upgrade plan"}
            </a>
          </div>
          <div className={`flex items-center gap-3 rounded-lg border px-4 py-3 ${
            frequency === "monthly"
              ? "border-primary bg-primary/5"
              : frequency === "weekly"
              ? "border-blue-500 bg-blue-50"
              : "border-purple-500 bg-purple-50"
          }`}>
            <div className="flex-1">
              <p className="font-semibold text-ink">
                {frequency === "monthly" && "Monthly (Free)"}
                {frequency === "weekly" && "Weekly (£7/month)"}
                {frequency === "daily" && "Daily (£11/month)"}
              </p>
              <p className="text-sm text-muted">
                {frequency === "monthly" && "Digest sent on the 1st of each month"}
                {frequency === "weekly" && "Digest sent every Monday morning"}
                {frequency === "daily" && "Digest sent every morning"}
              </p>
            </div>
            <span className={`px-2 py-1 rounded text-xs font-semibold ${
              frequency === "monthly"
                ? "bg-primary/10 text-primary"
                : frequency === "weekly"
                ? "bg-blue-100 text-blue-700"
                : "bg-purple-100 text-purple-700"
            }`}>
              {frequency === "monthly" ? "Free" : "Pro"}
            </span>
          </div>
        </div>
      </div>

      <button className="btn-primary max-w-xs" onClick={save} disabled={saving}>
        {saving ? "Saving…" : "Save preferences"}
      </button>
    </div>
  );
}

export default function PreferencesPage() {
  return (
    <Suspense fallback={<div className="card p-6"><p>Loading…</p></div>}>
      <PreferencesContent />
    </Suspense>
  );
}
