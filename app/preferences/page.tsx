"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";

type PrefsResponse = {
  frequency: "weekly" | "daily" | "instant";
  hazards: string[];
  categories: string[];
  countries: string[];
  availableHazards: string[];
  availableCategories: string[];
  availableCountries: string[];
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

  // Dynamic options from the database
  const [availableHazards, setAvailableHazards] = useState<string[]>([]);
  const [availableCategories, setAvailableCategories] = useState<string[]>([]);
  const [availableCountries, setAvailableCountries] = useState<string[]>([]);

  const showAll = hazards.length === 0 && categories.length === 0 && countries.length === 0;

  const toggleShowAll = () => {
    if (!showAll) {
      // Clear all filters to enable "show all"
      setHazards([]);
      setCategories([]);
      setCountries([]);
    }
  };

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
        // Set available options from the database
        setAvailableHazards(data.availableHazards || []);
        setAvailableCategories(data.availableCategories || []);
        setAvailableCountries(data.availableCountries || []);
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

      <div className="p-4 bg-base border border-border rounded-xl shadow-soft">
        <button
          type="button"
          onClick={toggleShowAll}
          className={`flex items-center gap-3 w-full text-left ${showAll ? "" : "opacity-70"}`}
        >
          <span
            className={`flex items-center justify-center w-6 h-6 rounded-md border-2 transition ${
              showAll
                ? "bg-primary border-primary text-white"
                : "border-border bg-surface"
            }`}
          >
            {showAll && (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            )}
          </span>
          <div>
            <span className="font-semibold">Show all alerts</span>
            <p className="text-sm text-muted">Receive all food safety alerts without filtering</p>
          </div>
        </button>
      </div>

      <div className={`grid gap-3 md:grid-cols-3 ${showAll ? "opacity-50 pointer-events-none" : ""}`}>
        <div className="p-3 bg-base border border-border rounded-xl shadow-soft">
          <OptionPills label="Hazards" options={availableHazards} values={hazards} onChange={setHazards} />
          {availableHazards.length === 0 && !loading && (
            <p className="text-xs text-muted mt-2">No hazard data available yet. Run the ingest job to populate options.</p>
          )}
        </div>
        <div className="p-3 bg-base border border-border rounded-xl shadow-soft">
          <OptionPills label="Product categories" options={availableCategories} values={categories} onChange={setCategories} />
          {availableCategories.length === 0 && !loading && (
            <p className="text-xs text-muted mt-2">No category data available yet. Run the ingest job to populate options.</p>
          )}
        </div>
        <div className="p-3 bg-base border border-border rounded-xl shadow-soft">
          <OptionPills label="Countries" options={availableCountries} values={countries} onChange={setCountries} />
          {availableCountries.length === 0 && !loading && (
            <p className="text-xs text-muted mt-2">No country data available yet. Run the ingest job to populate options.</p>
          )}
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
