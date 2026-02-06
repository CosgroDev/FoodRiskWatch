"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

type Alert = {
  id: string;
  hazard: string | null;
  product_category: string | null;
  product_text: string | null;
  origin_country: string | null;
  notifying_country: string | null;
  alert_date: string | null;
  link: string | null;
  raw_payload: Record<string, unknown> | null;
};

function InfoRow({ label, value }: { label: string; value: string | null }) {
  if (!value) return null;
  return (
    <div className="flex flex-col sm:flex-row sm:gap-4 py-3 border-b border-border last:border-b-0">
      <dt className="text-muted font-medium sm:w-40 shrink-0">{label}</dt>
      <dd className="text-ink">{value}</dd>
    </div>
  );
}

function ExpandableJson({ data }: { data: Record<string, unknown> | null }) {
  const [expanded, setExpanded] = useState(false);

  if (!data) return null;

  return (
    <div className="bg-base border border-border rounded-xl overflow-hidden">
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-4 hover:bg-slate-50 transition"
      >
        <h2 className="font-semibold text-lg">Raw Data (JSON)</h2>
        <svg
          className={`w-5 h-5 text-muted transition-transform ${expanded ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {expanded && (
        <div className="border-t border-border p-4 bg-slate-50">
          <pre className="text-xs overflow-x-auto whitespace-pre-wrap break-words text-secondary">
            {JSON.stringify(data, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}

export default function AlertDetailPage() {
  const params = useParams();
  const id = params.id as string;

  const [alert, setAlert] = useState<Alert | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;

    fetch(`/api/alerts/${encodeURIComponent(id)}`)
      .then(async (res) => {
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.message || "Could not load alert");
        }
        return res.json();
      })
      .then((data) => setAlert(data))
      .catch((err) => setError(err instanceof Error ? err.message : "Unexpected error"))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="card p-6">
        <p>Loading alert details...</p>
      </div>
    );
  }

  if (error || !alert) {
    return (
      <div className="card p-6">
        <h1 className="text-xl font-bold text-red-600">Alert not found</h1>
        <p className="text-muted mt-2">{error || "This alert could not be found."}</p>
        <a href="/" className="btn-primary inline-block mt-4">
          Back to Home
        </a>
      </div>
    );
  }

  const formattedDate = alert.alert_date
    ? new Date(alert.alert_date).toLocaleDateString("en-GB", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : null;

  return (
    <div className="card p-6 space-y-6">
      <div className="space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border border-border bg-base text-primary font-semibold text-sm">
          <span className="h-2 w-2 rounded-full bg-primary" />
          Alert Details
        </div>
        <h1 className="text-2xl font-bold">{alert.product_text || "Food Safety Alert"}</h1>
        <div className="flex flex-wrap gap-2">
          {alert.hazard && (
            <span className="px-3 py-1 rounded-lg bg-red-50 text-red-700 text-sm font-semibold border border-red-200">
              {alert.hazard}
            </span>
          )}
          {alert.product_category && (
            <span className="px-3 py-1 rounded-lg bg-green-50 text-green-700 text-sm font-semibold border border-green-200">
              {alert.product_category}
            </span>
          )}
        </div>
      </div>

      <div className="bg-base border border-border rounded-xl p-4">
        <h2 className="font-semibold text-lg mb-3">Alert Information</h2>
        <dl>
          <InfoRow label="Date" value={formattedDate} />
          <InfoRow label="Hazard" value={alert.hazard} />
          <InfoRow label="Category" value={alert.product_category} />
          <InfoRow label="Product" value={alert.product_text} />
          <InfoRow label="Origin Country" value={alert.origin_country} />
          <InfoRow label="Notifying Country" value={alert.notifying_country} />
        </dl>
      </div>

      <ExpandableJson data={alert.raw_payload} />

      <div className="pt-4 border-t border-border">
        <a href="/" className="text-primary hover:text-primaryHover font-medium">
          &larr; Back to Home
        </a>
      </div>

      <p className="text-xs text-muted">
        Data sourced from the EU RASFF (Rapid Alert System for Food and Feed).
        This information is provided for informational purposes only and has no legal standing.
      </p>
    </div>
  );
}
