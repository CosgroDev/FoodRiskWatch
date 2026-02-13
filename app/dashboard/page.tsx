"use client";

import { Suspense, useEffect, useState, useCallback } from "react";
import { useSearchParams } from "next/navigation";

type Alert = {
  id: string;
  raw_id: string;
  hazards: string[];
  origins: string[];
  product_category: string;
  product_text: string;
  alert_date: string;
  link: string;
};

type StatItem = { name: string; count: number };

type DashboardData = {
  totalAlerts: number;
  topHazards: StatItem[];
  topOrigins: StatItem[];
  topCategories: StatItem[];
  timeSeries: { date: string; count: number }[];
  alerts: Alert[];
  filterOptions: {
    hazards: string[];
    origins: string[];
    categories: string[];
  };
  userCategories: string[];
  selectedDays: number;
};

function TimeRangeToggle({
  value,
  onChange,
}: {
  value: number;
  onChange: (days: number) => void;
}) {
  const options = [
    { label: "7 days", value: 7 },
    { label: "30 days", value: 30 },
    { label: "90 days", value: 90 },
  ];

  return (
    <div className="inline-flex rounded-lg border border-border overflow-hidden">
      {options.map((opt) => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          className={`px-4 py-2 text-sm font-medium transition ${
            value === opt.value
              ? "bg-primary text-white"
              : "bg-surface text-secondary hover:bg-base"
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

function StatCard({
  title,
  value,
  subtitle,
  trend,
}: {
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: "up" | "down" | "neutral";
}) {
  return (
    <div className="bg-surface border border-border rounded-xl p-4 shadow-soft">
      <p className="text-sm text-muted font-medium">{title}</p>
      <p className="text-3xl font-bold text-ink mt-1">{value}</p>
      {subtitle && (
        <p className={`text-sm mt-1 ${
          trend === "up" ? "text-red-600" : trend === "down" ? "text-green-600" : "text-muted"
        }`}>
          {subtitle}
        </p>
      )}
    </div>
  );
}

function MiniBarChart({ data, maxItems = 5 }: { data: StatItem[]; maxItems?: number }) {
  const items = data.slice(0, maxItems);
  const maxCount = Math.max(...items.map((d) => d.count), 1);

  return (
    <div className="space-y-2">
      {items.map((item) => (
        <div key={item.name} className="flex items-center gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex justify-between text-sm mb-1">
              <span className="text-secondary truncate" title={item.name}>
                {item.name}
              </span>
              <span className="text-ink font-medium ml-2">{item.count}</span>
            </div>
            <div className="h-2 bg-base rounded-full overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all"
                style={{ width: `${(item.count / maxCount) * 100}%` }}
              />
            </div>
          </div>
        </div>
      ))}
      {items.length === 0 && (
        <p className="text-sm text-muted">No data available</p>
      )}
    </div>
  );
}

function TimeSeriesChart({ data }: { data: { date: string; count: number }[] }) {
  if (data.length === 0) {
    return <p className="text-sm text-muted">No data available</p>;
  }

  const maxCount = Math.max(...data.map((d) => d.count), 1);
  const height = 120;
  const width = 100; // percentage

  // Create SVG path
  const points = data.map((d, i) => ({
    x: (i / Math.max(data.length - 1, 1)) * 100,
    y: height - (d.count / maxCount) * (height - 20),
  }));

  const pathD = points
    .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`)
    .join(" ");

  // Area fill
  const areaD = `${pathD} L ${points[points.length - 1]?.x || 0} ${height} L 0 ${height} Z`;

  return (
    <div className="relative">
      <svg
        viewBox={`0 0 100 ${height}`}
        preserveAspectRatio="none"
        className="w-full h-32"
      >
        <defs>
          <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgb(var(--color-primary))" stopOpacity="0.3" />
            <stop offset="100%" stopColor="rgb(var(--color-primary))" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={areaD} fill="url(#areaGradient)" />
        <path
          d={pathD}
          fill="none"
          stroke="rgb(var(--color-primary))"
          strokeWidth="0.5"
          vectorEffect="non-scaling-stroke"
        />
      </svg>
      <div className="flex justify-between text-xs text-muted mt-2">
        <span>{data[0]?.date}</span>
        <span>{data[data.length - 1]?.date}</span>
      </div>
    </div>
  );
}

function FilterDropdown({
  label,
  options,
  value,
  onChange,
  placeholder = "All",
}: {
  label: string;
  options: string[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <div className="space-y-1">
      <label className="text-xs font-medium text-muted">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-surface text-ink focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
      >
        <option value="">{placeholder}</option>
        {options.map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>
    </div>
  );
}

function AlertRow({ alert }: { alert: Alert }) {
  const date = new Date(alert.alert_date).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
  });

  return (
    <div className="flex items-start gap-4 p-4 bg-surface border border-border rounded-lg hover:border-primary/40 transition">
      <div className="flex-shrink-0 w-12 text-center">
        <p className="text-sm font-semibold text-ink">{date}</p>
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-ink truncate" title={alert.product_text}>
          {alert.product_text}
        </p>
        <p className="text-sm text-muted mt-0.5">{alert.product_category}</p>
        <div className="flex flex-wrap gap-1 mt-2">
          {alert.hazards.slice(0, 3).map((h) => (
            <span
              key={h}
              className="px-2 py-0.5 text-xs rounded-full bg-red-100 text-red-700"
            >
              {h}
            </span>
          ))}
          {alert.hazards.length > 3 && (
            <span className="px-2 py-0.5 text-xs rounded-full bg-slate-100 text-slate-600">
              +{alert.hazards.length - 3} more
            </span>
          )}
        </div>
      </div>
      <div className="flex-shrink-0">
        {alert.link && (
          <a
            href={alert.link}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-primary hover:underline"
          >
            View
          </a>
        )}
      </div>
    </div>
  );
}

function DashboardContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || undefined;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<DashboardData | null>(null);

  // Filters
  const [days, setDays] = useState(7);
  const [categoryFilter, setCategoryFilter] = useState("");
  const [hazardFilter, setHazardFilter] = useState("");
  const [originFilter, setOriginFilter] = useState("");

  const fetchDashboard = useCallback(async () => {
    if (!token) return;

    setLoading(true);
    setError(null);

    const params = new URLSearchParams();
    params.set("token", token);
    params.set("days", String(days));

    if (categoryFilter) params.set("categories", categoryFilter);
    if (hazardFilter) params.set("hazards", hazardFilter);
    if (originFilter) params.set("origins", originFilter);

    try {
      const res = await fetch(`/api/dashboard?${params.toString()}`);
      const body = await res.json();

      if (!res.ok) {
        throw new Error(body.message || "Failed to load dashboard");
      }

      setData(body as DashboardData);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Unexpected error");
    } finally {
      setLoading(false);
    }
  }, [token, days, categoryFilter, hazardFilter, originFilter]);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  if (!token) {
    return (
      <div className="card p-6 text-center">
        <h1 className="text-xl font-bold text-ink">Access Required</h1>
        <p className="text-muted mt-2">
          Please access this dashboard from the link in your daily digest email.
        </p>
      </div>
    );
  }

  if (error) {
    const isAccessError = error.includes("Daily subscribers") || error.includes("expired");
    return (
      <div className="card p-6 text-center">
        <h1 className="text-xl font-bold text-ink">
          {isAccessError ? "Dashboard Access" : "Error"}
        </h1>
        <p className="text-muted mt-2">{error}</p>
        {error.includes("Daily subscribers") && (
          <a
            href={`/pricing?token=${encodeURIComponent(token)}`}
            className="btn-primary mt-4 inline-block"
          >
            Upgrade to Daily
          </a>
        )}
        {error.includes("expired") && (
          <p className="text-sm text-muted mt-4">
            Click the dashboard link in your latest daily digest email to continue.
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border border-purple-200 bg-purple-50 text-purple-700 font-semibold text-sm">
            <span className="h-2 w-2 rounded-full bg-purple-500" />
            Daily Dashboard
          </div>
          <h1 className="text-2xl font-bold text-ink mt-2">Alert Analytics</h1>
          <p className="text-muted text-sm">
            {loading ? "Loading..." : `${data?.totalAlerts || 0} alerts in the last ${days} days`}
          </p>
        </div>
        <TimeRangeToggle value={days} onChange={setDays} />
      </div>

      {loading && !data ? (
        <div className="grid gap-4 md:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-surface border border-border rounded-xl p-4 h-24 animate-pulse" />
          ))}
        </div>
      ) : data ? (
        <>
          {/* Stats Cards */}
          <div className="grid gap-4 md:grid-cols-3">
            <StatCard
              title="Total Alerts"
              value={data.totalAlerts}
              subtitle={`Last ${days} days`}
            />
            <StatCard
              title="Top Hazard"
              value={data.topHazards[0]?.name || "—"}
              subtitle={data.topHazards[0] ? `${data.topHazards[0].count} alerts` : undefined}
            />
            <StatCard
              title="Top Origin"
              value={data.topOrigins[0]?.name || "—"}
              subtitle={data.topOrigins[0] ? `${data.topOrigins[0].count} alerts` : undefined}
            />
          </div>

          {/* Filters */}
          <div className="card p-4 border border-border">
            <p className="text-sm font-semibold text-ink mb-3">Filter Alerts</p>
            <div className="grid gap-4 md:grid-cols-3">
              <FilterDropdown
                label="Category"
                options={data.filterOptions.categories}
                value={categoryFilter}
                onChange={setCategoryFilter}
                placeholder="All categories"
              />
              <FilterDropdown
                label="Hazard"
                options={data.filterOptions.hazards}
                value={hazardFilter}
                onChange={setHazardFilter}
                placeholder="All hazards"
              />
              <FilterDropdown
                label="Origin Country"
                options={data.filterOptions.origins}
                value={originFilter}
                onChange={setOriginFilter}
                placeholder="All origins"
              />
            </div>
            {(categoryFilter || hazardFilter || originFilter) && (
              <button
                onClick={() => {
                  setCategoryFilter("");
                  setHazardFilter("");
                  setOriginFilter("");
                }}
                className="text-sm text-primary hover:underline mt-3"
              >
                Clear all filters
              </button>
            )}
          </div>

          {/* Charts Row */}
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Time Series */}
            <div className="card p-5 border border-border">
              <p className="text-sm font-semibold text-ink mb-4">Alerts Over Time</p>
              <TimeSeriesChart data={data.timeSeries} />
            </div>

            {/* Top Hazards */}
            <div className="card p-5 border border-border">
              <p className="text-sm font-semibold text-ink mb-4">Top Hazards</p>
              <MiniBarChart data={data.topHazards} maxItems={5} />
            </div>
          </div>

          {/* Second Charts Row */}
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Top Origins */}
            <div className="card p-5 border border-border">
              <p className="text-sm font-semibold text-ink mb-4">Top Origin Countries</p>
              <MiniBarChart data={data.topOrigins} maxItems={5} />
            </div>

            {/* Top Categories */}
            <div className="card p-5 border border-border">
              <p className="text-sm font-semibold text-ink mb-4">Top Categories</p>
              <MiniBarChart data={data.topCategories} maxItems={5} />
            </div>
          </div>

          {/* Recent Alerts */}
          <div className="card p-5 border border-border">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-semibold text-ink">Recent Alerts</p>
              <span className="text-xs text-muted">
                Showing {Math.min(data.alerts.length, 50)} of {data.totalAlerts}
              </span>
            </div>
            <div className="space-y-3 max-h-[600px] overflow-y-auto">
              {data.alerts.length > 0 ? (
                data.alerts.map((alert) => (
                  <AlertRow key={alert.id} alert={alert} />
                ))
              ) : (
                <p className="text-sm text-muted text-center py-8">
                  No alerts found for the selected filters
                </p>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 pt-4 border-t border-border">
            <a
              href={`/preferences?token=${encodeURIComponent(token)}`}
              className="text-sm text-primary hover:underline"
            >
              &larr; Back to Preferences
            </a>
            <p className="text-xs text-muted">
              Dashboard data refreshes with each visit. Alerts based on your configured categories.
            </p>
          </div>
        </>
      ) : null}
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<div className="card p-6"><p>Loading dashboard...</p></div>}>
      <DashboardContent />
    </Suspense>
  );
}
