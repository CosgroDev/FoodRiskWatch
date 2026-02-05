"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";

const hazardOptions = ["Salmonella", "Listeria", "E.coli", "Mycotoxin", "Allergen", "Physical contaminant"];
const categoryOptions = ["Meat", "Dairy", "Produce", "Seafood", "Bakery", "Beverages"];
const countryOptions = ["Belgium", "France", "Germany", "Italy", "Netherlands", "Spain", "United Kingdom"];

type PrefsResponse = {
  frequency: "weekly" | "daily" | "instant";
  hazards: string[];
  categories: string[];
  countries: string[];
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
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <label>{label}</label>
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

  const [frequency, setFrequency] = useState<"weekly" | "daily" | "instant">("weekly");
  const [hazards, setHazards] = useState<string[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [countries, setCountries] = useState<string[]>([]);

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
        setHazards(data.hazards || []);
        setCategories(data.categories || []);
        setCountries(data.countries || []);
      })
      .catch((err: unknown) => setError(err instanceof Error ? err.message : "Unexpected error"))
      .finally(() => setLoading(false));
  }, [token]);

  const disabledFrequencies = useMemo(() => ({ daily: true, instant: true }), []);

  const save = async () => {
    if (!token) return;
    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      const res = await fetch("/api/preferences", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, frequency, hazards, categories, countries }),
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
        <h1 className="text-2xl font-bold">Your alert filters</h1>
        <p className="text-muted text-sm">
          Weekly digests are included on the free tier. Daily and instant are previewed for later.
        </p>
      </div>

      {loading && <p>Loading…</p>}
      {error && <p className="text-red-600">{error}</p>}
      {message && <p className="text-green-700">{message}</p>}

      <div className="grid gap-3 md:grid-cols-3">
        <div className="p-3 bg-base border border-border rounded-xl shadow-soft">
          <OptionPills label="Hazards" options={hazardOptions} values={hazards} onChange={setHazards} />
        </div>
        <div className="p-3 bg-base border border-border rounded-xl shadow-soft">
          <OptionPills label="Product categories" options={categoryOptions} values={categories} onChange={setCategories} />
        </div>
        <div className="p-3 bg-base border border-border rounded-xl shadow-soft">
          <OptionPills label="Countries" options={countryOptions} values={countries} onChange={setCountries} />
        </div>
      </div>

      <div className="p-3 bg-base border border-border rounded-xl shadow-soft max-w-xs">
        <div className="grid gap-2">
          <label>Frequency</label>
          <div className="flex flex-col gap-2">
            {[
              { value: "weekly", label: "Weekly (included)", disabled: false },
              { value: "daily", label: "Daily (coming soon)", disabled: disabledFrequencies.daily },
              { value: "instant", label: "Instant (coming soon)", disabled: disabledFrequencies.instant },
            ].map((opt) => (
              <button
                key={opt.value}
                type="button"
                disabled={opt.disabled}
                onClick={() => !opt.disabled && setFrequency(opt.value as typeof frequency)}
                className={`flex items-center justify-between rounded-lg border px-3 py-2 text-sm transition ${
                  frequency === opt.value
                    ? "border-primary bg-primary text-white"
                    : "border-border bg-surface text-secondary hover:border-primary/60"
                } ${opt.disabled ? "opacity-60 cursor-not-allowed" : ""}`}
              >
                <span>{opt.label}</span>
                <span
                  className={`h-3 w-3 rounded-full ${
                    frequency === opt.value ? "bg-white" : "bg-border"
                  }`}
                />
              </button>
            ))}
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
