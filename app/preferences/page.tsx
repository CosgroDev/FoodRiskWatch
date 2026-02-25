"use client";

import { useEffect, useMemo, useState } from "react";
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
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <label>{label}</label>
        {values.length > 0 && (
          <button
            type="button"
            onClick={() => onChange([])}
            className="text-xs font-semibold text-blue-700 hover:text-blue-800 transition"
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
              className={`px-3 py-2 text-sm rounded-lg border transition ${
                active
                  ? "bg-blue-600 text-white border-blue-600"
                  : "bg-white text-slate-700 border-slate-300 hover:border-blue-300"
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

export default function PreferencesPage() {
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
      <div className="content-wrap">
        <div className="card p-6 max-w-xl">
          <h1 className="text-xl font-bold">Missing token</h1>
          <p className="text-slate-600">Open this page from your magic manage link.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="content-wrap space-y-5">
      <section className="card p-6 md:p-7 space-y-4">
        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-700">Manage alerts</p>
          <h1 className="text-2xl font-bold text-slate-900">Your alert filters</h1>
          <p className="text-sm text-slate-500">
            Weekly digests are included on the free tier. Daily and instant are shown as preview options.
          </p>
        </div>

        {loading && <p className="text-slate-600">Loading...</p>}
        {error && <p className="text-red-600">{error}</p>}
        {message && <p className="text-green-700">{message}</p>}

        <div className="grid gap-3 md:grid-cols-3">
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <OptionPills label="Hazards" options={hazardOptions} values={hazards} onChange={setHazards} />
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <OptionPills label="Product categories" options={categoryOptions} values={categories} onChange={setCategories} />
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <OptionPills label="Countries" options={countryOptions} values={countries} onChange={setCountries} />
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 max-w-md">
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
                      ? "border-blue-600 bg-blue-600 text-white"
                      : "border-slate-300 bg-white text-slate-700 hover:border-blue-300"
                  } ${opt.disabled ? "opacity-60 cursor-not-allowed" : ""}`}
                >
                  <span>{opt.label}</span>
                  <span className={`h-3 w-3 rounded-full ${frequency === opt.value ? "bg-white" : "bg-slate-300"}`} />
                </button>
              ))}
            </div>
          </div>
        </div>

        <button className="btn-primary max-w-xs" onClick={save} disabled={saving}>
          {saving ? "Saving..." : "Save preferences"}
        </button>
      </section>
    </div>
  );
}

