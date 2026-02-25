function LockIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden="true">
      <rect x="5" y="10" width="14" height="10" rx="2" stroke="currentColor" strokeWidth="1.8" />
      <path d="M8 10V7a4 4 0 1 1 8 0v3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

export default function PrivacyPage() {
  return (
    <div className="content-wrap">
      <article className="card p-6 md:p-8 max-w-4xl space-y-6">
        <div className="flex items-center gap-3">
          <span className="icon-badge">
            <LockIcon />
          </span>
          <div>
            <p className="m-0 text-xs font-semibold uppercase tracking-[0.16em] text-blue-700">Policy</p>
            <h1 className="m-0 text-2xl md:text-3xl font-bold text-slate-900">Privacy Policy</h1>
          </div>
        </div>

        <p className="text-sm text-slate-500 m-0">Last updated: February 2025</p>

        <section className="space-y-2">
          <h2 className="text-lg font-semibold text-slate-900 m-0">About FoodRisk Watch</h2>
          <p className="text-slate-700 m-0">
            FoodRisk Watch is an independent alert notification service that aggregates publicly available food safety
            information. We are not affiliated with, endorsed by, or officially connected to the European Commission,
            RASFF (Rapid Alert System for Food and Feed), or any governmental body.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-semibold text-slate-900 m-0">Data We Collect</h2>
          <h3 className="text-base font-semibold text-slate-800 m-0">Information You Provide</h3>
          <ul className="space-y-1 text-slate-700">
            <li>Email address: Used solely to send you food safety alert notifications</li>
            <li>Filter preferences: Your selected product categories of interest</li>
            <li>Subscription settings: Your preferred notification frequency</li>
          </ul>
          <h3 className="text-base font-semibold text-slate-800 m-0">Information We Process</h3>
          <ul className="space-y-1 text-slate-700">
            <li>Food safety alerts: Publicly available data sourced from the RASFF Portal API</li>
            <li>Delivery records: Which alerts have been sent to you (to prevent duplicates)</li>
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-semibold text-slate-900 m-0">How We Use Your Data</h2>
          <ul className="space-y-1 text-slate-700">
            <li>To send you personalised food safety alert digests based on your preferences</li>
            <li>To verify your email address when you subscribe</li>
            <li>To allow you to manage your subscription and preferences</li>
          </ul>
          <p className="text-slate-700 m-0">
            We do not sell, share, or transfer your personal data to third parties for marketing purposes.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-semibold text-slate-900 m-0">Data Storage and Security</h2>
          <ul className="space-y-1 text-slate-700">
            <li>Your data is stored in Supabase, using EU-hosted PostgreSQL databases</li>
            <li>All data transmission uses HTTPS encryption</li>
            <li>Access to the database is restricted and protected by authentication</li>
            <li>We retain your data only for as long as your subscription is active</li>
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-semibold text-slate-900 m-0">Third-Party Services</h2>
          <ul className="space-y-1 text-slate-700">
            <li>Supabase: Database hosting (EU region)</li>
            <li>Vercel: Application hosting</li>
            <li>Resend: Email delivery service</li>
          </ul>
          <p className="text-slate-700 m-0">
            These services have their own privacy policies and data processing agreements.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-semibold text-slate-900 m-0">Your Rights</h2>
          <p className="text-slate-700 m-0">You have the right to:</p>
          <ul className="space-y-1 text-slate-700">
            <li>Access: Request a copy of the data we hold about you</li>
            <li>Rectification: Update your preferences at any time via the manage link</li>
            <li>Erasure: Unsubscribe and request deletion of your data</li>
            <li>Portability: Request your data in a portable format</li>
          </ul>
          <p className="text-slate-700 m-0">
            To exercise these rights, use the unsubscribe link in any email or contact us directly.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-semibold text-slate-900 m-0">Cookies</h2>
          <p className="text-slate-700 m-0">
            FoodRisk Watch does not use tracking cookies or analytics. We only use essential cookies required for the
            application to function.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-semibold text-slate-900 m-0">Changes to This Policy</h2>
          <p className="text-slate-700 m-0">
            We may update this privacy policy from time to time. Any changes will be posted on this page with an
            updated revision date.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-semibold text-slate-900 m-0">Contact</h2>
          <p className="text-slate-700 m-0">
            For privacy-related enquiries, please contact us at{" "}
            <a href="mailto:info@foodrisk.co.uk" className="text-blue-700 underline">
              info@foodrisk.co.uk
            </a>
          </p>
        </section>
      </article>
    </div>
  );
}

