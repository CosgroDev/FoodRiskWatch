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

      {alert.link && (
        <div className="bg-base border border-border rounded-xl p-4">
          <h2 className="font-semibold text-lg mb-3">Official Source</h2>
          <p className="text-muted text-sm mb-3">
            View the official notification on the RASFF portal for complete details.
          </p>
          <a
            href={alert.link}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-primary inline-flex items-center gap-2"
          >
            View on RASFF Portal
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </a>
        </div>
      )}

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
