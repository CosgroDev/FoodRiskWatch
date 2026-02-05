import { notFound } from "next/navigation";
import { supabaseServer } from "../../../lib/supabase/server";
import { autoCleanRecord, autoCleanHazards } from "../../../lib/normalizer-auto";
import Link from "next/link";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

const RASFF_API_URL = "https://api.datalake.sante.service.ec.europa.eu/rasff/irasff-general-info-view";

// Fetch alert from RASFF API by notification reference
async function fetchFromRasffApi(notificationRef: string): Promise<Record<string, unknown> | null> {
  try {
    // Try to fetch by notification reference filter
    const url = `${RASFF_API_URL}?format=json&api-version=v1.0&$filter=notification_reference eq '${notificationRef}'`;
    const res = await fetch(url);
    if (!res.ok) return null;

    const json = await res.json();
    const records = json.value || json.records || [];

    if (records.length > 0) {
      return records[0];
    }
    return null;
  } catch (err) {
    console.error("RASFF API fetch error:", err);
    return null;
  }
}

// Helper to format dates nicely
function formatDate(dateStr: string | null): string {
  if (!dateStr) return "Unknown";
  try {
    return new Date(dateStr).toLocaleDateString("en-GB", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  } catch {
    return dateStr;
  }
}

// Get risk level styling
function getRiskStyle(level: string): { bg: string; text: string; border: string } {
  const l = level.toLowerCase();
  if (l === "serious") return { bg: "bg-red-50", text: "text-red-700", border: "border-red-200" };
  if (l.includes("potential")) return { bg: "bg-orange-50", text: "text-orange-700", border: "border-orange-200" };
  if (l === "not serious") return { bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-200" };
  if (l === "no risk") return { bg: "bg-green-50", text: "text-green-700", border: "border-green-200" };
  return { bg: "bg-gray-50", text: "text-gray-700", border: "border-gray-200" };
}

// Get hazard category styling
function getHazardStyle(category: string): { bg: string; text: string } {
  const c = category.toLowerCase();
  if (c.includes("pathogen")) return { bg: "bg-red-100", text: "text-red-800" };
  if (c.includes("mycotoxin") || c.includes("toxin")) return { bg: "bg-orange-100", text: "text-orange-800" };
  if (c.includes("pesticide")) return { bg: "bg-yellow-100", text: "text-yellow-800" };
  if (c.includes("heavy metal")) return { bg: "bg-amber-100", text: "text-amber-800" };
  if (c.includes("allergen")) return { bg: "bg-purple-100", text: "text-purple-800" };
  if (c.includes("foreign")) return { bg: "bg-slate-100", text: "text-slate-800" };
  return { bg: "bg-gray-100", text: "text-gray-800" };
}

export default async function AlertDetailPage({ params }: Params) {
  const { id } = await params;

  let rawPayload: Record<string, unknown> | null = null;
  let sourceId: string | null = null;

  // Try database first if configured
  let sb;
  try {
    sb = supabaseServer();

    // Try fact ID first
    const { data: factData } = await sb
      .from("alerts_fact")
      .select("*, alerts_raw(payload_json, source_id)")
      .eq("id", id)
      .maybeSingle();

    if (factData?.alerts_raw) {
      rawPayload = factData.alerts_raw.payload_json;
      sourceId = factData.alerts_raw.source_id;
    }

    // Try raw ID if not found
    if (!rawPayload) {
      const { data: rawData } = await sb
        .from("alerts_raw")
        .select("*")
        .eq("id", id)
        .maybeSingle();

      if (rawData) {
        rawPayload = rawData.payload_json;
        sourceId = rawData.source_id;
      }
    }

    // Try source_id (notification reference)
    if (!rawPayload) {
      const { data: sourceData } = await sb
        .from("alerts_raw")
        .select("*")
        .eq("source_id", id)
        .maybeSingle();

      if (sourceData) {
        rawPayload = sourceData.payload_json;
        sourceId = sourceData.source_id;
      }
    }
  } catch {
    // Database not configured, will try API fallback
  }

  // Fallback: Try fetching from RASFF API directly (for preview/non-ingested data)
  if (!rawPayload) {
    const apiData = await fetchFromRasffApi(id);
    if (apiData) {
      rawPayload = apiData;
      sourceId = id;
    }
  }

  if (!rawPayload) {
    notFound();
  }

  // Clean the data
  const cleaned = autoCleanRecord(rawPayload);
  const rawHazard = (rawPayload.hazard_category_name || rawPayload.hazard_desc || rawPayload.hazard || "") as string;
  const hazards = autoCleanHazards(rawHazard);

  const riskStyle = getRiskStyle(cleaned.riskLevel);

  // Extract additional raw fields for detailed view
  const notificationRef = (rawPayload.notification_reference || rawPayload.referenceNumber || sourceId) as string;
  const notificationType = (rawPayload.notification_type_desc || rawPayload.notificationType || "") as string;
  const actionTaken = (rawPayload.action_taken_desc || rawPayload.actionTaken || "") as string;
  const distributionStatus = (rawPayload.distribution_status_desc || rawPayload.distributionStatus || "") as string;
  const subject = (rawPayload.subject || "") as string;

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <Link href="/" className="flex items-center gap-2 text-teal-600 hover:text-teal-700">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            <span className="font-medium">Back to FoodRisk Watch</span>
          </Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Risk Level Banner */}
        <div className={`rounded-xl border-2 ${riskStyle.border} ${riskStyle.bg} p-4 mb-6`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500 uppercase tracking-wide">Risk Assessment</p>
              <p className={`text-2xl font-bold ${riskStyle.text}`}>{cleaned.riskLevel}</p>
            </div>
            {notificationRef && (
              <div className="text-right">
                <p className="text-sm text-gray-500">Reference</p>
                <p className="font-mono text-lg font-semibold text-gray-700">{notificationRef}</p>
              </div>
            )}
          </div>
        </div>

        {/* Main Content Card */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          {/* Product Header */}
          <div className="bg-gradient-to-r from-teal-500 to-teal-600 px-6 py-8 text-white">
            <h1 className="text-2xl font-bold mb-2">{cleaned.productText}</h1>
            <p className="text-teal-100">{cleaned.productCategory}</p>
          </div>

          {/* Hazards Section */}
          <div className="px-6 py-6 border-b border-gray-100">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Hazards Identified</h2>
            <div className="flex flex-wrap gap-2">
              {hazards.map((hazard, idx) => {
                const style = getHazardStyle(hazard.category);
                return (
                  <span
                    key={idx}
                    className={`inline-flex items-center gap-2 px-4 py-2 rounded-full ${style.bg} ${style.text} font-medium`}
                  >
                    <span className="font-semibold">{hazard.name}</span>
                    <span className="text-xs opacity-75">({hazard.category})</span>
                  </span>
                );
              })}
            </div>
          </div>

          {/* Details Grid */}
          <div className="px-6 py-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">Origin Country</h3>
              <p className="text-lg font-medium text-gray-900">{cleaned.originCountry || "Unknown"}</p>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">Notified By</h3>
              <p className="text-lg font-medium text-gray-900">{cleaned.notifyingCountry || "Unknown"}</p>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">Alert Date</h3>
              <p className="text-lg font-medium text-gray-900">{formatDate(cleaned.alertDate)}</p>
            </div>
            {notificationType && (
              <div>
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">Notification Type</h3>
                <p className="text-lg font-medium text-gray-900">{notificationType}</p>
              </div>
            )}
          </div>

          {/* Subject/Description if available */}
          {subject && (
            <div className="px-6 py-6 border-t border-gray-100">
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">Description</h3>
              <p className="text-gray-700 leading-relaxed">{subject}</p>
            </div>
          )}

          {/* Action Taken */}
          {actionTaken && (
            <div className="px-6 py-6 border-t border-gray-100">
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">Action Taken</h3>
              <p className="text-gray-700">{actionTaken}</p>
            </div>
          )}

          {/* Distribution Status */}
          {distributionStatus && (
            <div className="px-6 py-6 border-t border-gray-100">
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">Distribution Status</h3>
              <p className="text-gray-700">{distributionStatus}</p>
            </div>
          )}

          {/* Raw Data Accordion */}
          <details className="px-6 py-6 border-t border-gray-100">
            <summary className="cursor-pointer text-sm font-semibold text-gray-500 uppercase tracking-wide hover:text-gray-700">
              View Raw RASFF Data
            </summary>
            <pre className="mt-4 p-4 bg-gray-50 rounded-lg overflow-x-auto text-xs text-gray-600">
              {JSON.stringify(rawPayload, null, 2)}
            </pre>
          </details>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-sm text-gray-500">
          <p>Data sourced from the EU RASFF (Rapid Alert System for Food and Feed)</p>
          <p className="mt-1">
            <Link href="/" className="text-teal-600 hover:underline">
              Subscribe to FoodRisk Watch
            </Link>
            {" "}to receive alerts matching your preferences.
          </p>
        </div>
      </main>
    </div>
  );
}
