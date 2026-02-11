export default function PrivacyPage() {
  return (
    <div className="card p-6 md:p-8 max-w-4xl mx-auto space-y-8">
      <div className="space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border border-border bg-base text-primary font-semibold text-sm">
          <span className="h-2 w-2 rounded-full bg-primary" />
          Legal
        </div>
        <h1 className="text-3xl font-bold">Privacy Policy</h1>
        <p className="text-muted text-sm">Last updated: February 2025</p>
      </div>

      <div className="bg-base border border-border rounded-xl p-5 space-y-4">
        <h2 className="text-xl font-semibold">About FoodRisk Watch</h2>
        <p className="text-secondary leading-relaxed">
          FoodRisk Watch is an independent alert notification service that aggregates publicly
          available food safety information. We are not affiliated with, endorsed by, or
          officially connected to the European Commission, RASFF (Rapid Alert System for Food
          and Feed), or any governmental body.
        </p>
      </div>

      <div className="bg-base border border-border rounded-xl p-5 space-y-4">
        <h2 className="text-xl font-semibold">Data We Collect</h2>

        <div className="space-y-3">
          <h3 className="font-medium text-ink">Information You Provide</h3>
          <ul className="space-y-2 text-secondary">
            <li className="flex gap-3">
              <span className="h-1.5 w-1.5 mt-2 rounded-full bg-primary shrink-0" />
              <span><strong className="text-ink">Email address:</strong> Used solely to send you food safety alert notifications</span>
            </li>
            <li className="flex gap-3">
              <span className="h-1.5 w-1.5 mt-2 rounded-full bg-primary shrink-0" />
              <span><strong className="text-ink">Filter preferences:</strong> Your selected product categories of interest</span>
            </li>
            <li className="flex gap-3">
              <span className="h-1.5 w-1.5 mt-2 rounded-full bg-primary shrink-0" />
              <span><strong className="text-ink">Subscription settings:</strong> Your preferred notification frequency</span>
            </li>
          </ul>
        </div>

        <div className="space-y-3">
          <h3 className="font-medium text-ink">Information We Process</h3>
          <ul className="space-y-2 text-secondary">
            <li className="flex gap-3">
              <span className="h-1.5 w-1.5 mt-2 rounded-full bg-primary shrink-0" />
              <span><strong className="text-ink">Food safety alerts:</strong> Publicly available data sourced from the RASFF Portal API</span>
            </li>
            <li className="flex gap-3">
              <span className="h-1.5 w-1.5 mt-2 rounded-full bg-primary shrink-0" />
              <span><strong className="text-ink">Delivery records:</strong> Which alerts have been sent to you (to prevent duplicates)</span>
            </li>
          </ul>
        </div>
      </div>

      <div className="bg-base border border-border rounded-xl p-5 space-y-4">
        <h2 className="text-xl font-semibold">How We Use Your Data</h2>
        <ul className="space-y-2 text-secondary">
          <li className="flex gap-3">
            <span className="h-1.5 w-1.5 mt-2 rounded-full bg-primary shrink-0" />
            <span>To send you personalised food safety alert digests based on your preferences</span>
          </li>
          <li className="flex gap-3">
            <span className="h-1.5 w-1.5 mt-2 rounded-full bg-primary shrink-0" />
            <span>To verify your email address when you subscribe</span>
          </li>
          <li className="flex gap-3">
            <span className="h-1.5 w-1.5 mt-2 rounded-full bg-primary shrink-0" />
            <span>To allow you to manage your subscription and preferences</span>
          </li>
        </ul>
        <p className="text-secondary leading-relaxed pt-2">
          We do <strong className="text-ink">not</strong> sell, share, or transfer your personal data to third parties
          for marketing purposes.
        </p>
      </div>

      <div className="bg-base border border-border rounded-xl p-5 space-y-4">
        <h2 className="text-xl font-semibold">Data Storage and Security</h2>
        <ul className="space-y-2 text-secondary">
          <li className="flex gap-3">
            <span className="h-1.5 w-1.5 mt-2 rounded-full bg-primary shrink-0" />
            <span>Your data is stored in Supabase, using EU-hosted PostgreSQL databases</span>
          </li>
          <li className="flex gap-3">
            <span className="h-1.5 w-1.5 mt-2 rounded-full bg-primary shrink-0" />
            <span>All data transmission uses HTTPS encryption</span>
          </li>
          <li className="flex gap-3">
            <span className="h-1.5 w-1.5 mt-2 rounded-full bg-primary shrink-0" />
            <span>Access to the database is restricted and protected by authentication</span>
          </li>
          <li className="flex gap-3">
            <span className="h-1.5 w-1.5 mt-2 rounded-full bg-primary shrink-0" />
            <span>We retain your data only for as long as your subscription is active</span>
          </li>
        </ul>
      </div>

      <div className="bg-base border border-border rounded-xl p-5 space-y-4">
        <h2 className="text-xl font-semibold">Third-Party Services</h2>
        <ul className="space-y-2 text-secondary">
          <li className="flex gap-3">
            <span className="h-1.5 w-1.5 mt-2 rounded-full bg-primary shrink-0" />
            <span><strong className="text-ink">Supabase:</strong> Database hosting (EU region)</span>
          </li>
          <li className="flex gap-3">
            <span className="h-1.5 w-1.5 mt-2 rounded-full bg-primary shrink-0" />
            <span><strong className="text-ink">Vercel:</strong> Application hosting</span>
          </li>
          <li className="flex gap-3">
            <span className="h-1.5 w-1.5 mt-2 rounded-full bg-primary shrink-0" />
            <span><strong className="text-ink">Resend:</strong> Email delivery service</span>
          </li>
        </ul>
        <p className="text-secondary leading-relaxed pt-2">
          These services have their own privacy policies and data processing agreements.
        </p>
      </div>

      <div className="bg-base border border-border rounded-xl p-5 space-y-4">
        <h2 className="text-xl font-semibold">Your Rights</h2>
        <p className="text-secondary">You have the right to:</p>
        <ul className="space-y-2 text-secondary">
          <li className="flex gap-3">
            <span className="h-1.5 w-1.5 mt-2 rounded-full bg-primary shrink-0" />
            <span><strong className="text-ink">Access:</strong> Request a copy of the data we hold about you</span>
          </li>
          <li className="flex gap-3">
            <span className="h-1.5 w-1.5 mt-2 rounded-full bg-primary shrink-0" />
            <span><strong className="text-ink">Rectification:</strong> Update your preferences at any time via the manage link</span>
          </li>
          <li className="flex gap-3">
            <span className="h-1.5 w-1.5 mt-2 rounded-full bg-primary shrink-0" />
            <span><strong className="text-ink">Erasure:</strong> Unsubscribe and request deletion of your data</span>
          </li>
          <li className="flex gap-3">
            <span className="h-1.5 w-1.5 mt-2 rounded-full bg-primary shrink-0" />
            <span><strong className="text-ink">Portability:</strong> Request your data in a portable format</span>
          </li>
        </ul>
        <p className="text-secondary leading-relaxed pt-2">
          To exercise these rights, use the unsubscribe link in any email or contact us directly.
        </p>
      </div>

      <div className="bg-base border border-border rounded-xl p-5 space-y-4">
        <h2 className="text-xl font-semibold">Cookies</h2>
        <p className="text-secondary leading-relaxed">
          FoodRisk Watch does not use tracking cookies or analytics. We only use essential
          cookies required for the application to function.
        </p>
      </div>

      <div className="bg-base border border-border rounded-xl p-5 space-y-4">
        <h2 className="text-xl font-semibold">Changes to This Policy</h2>
        <p className="text-secondary leading-relaxed">
          We may update this privacy policy from time to time. Any changes will be posted on
          this page with an updated revision date.
        </p>
      </div>

      <div className="bg-base border border-border rounded-xl p-5 space-y-4">
        <h2 className="text-xl font-semibold">Contact</h2>
        <p className="text-secondary leading-relaxed">
          For privacy-related enquiries, please contact us at{" "}
          <a href="mailto:info@foodrisk.co.uk" className="text-primary hover:underline">info@foodrisk.co.uk</a>
        </p>
      </div>

      <div className="pt-4 border-t border-border">
        <a href="/" className="text-primary hover:text-primaryHover font-medium">
          &larr; Back to Home
        </a>
      </div>
    </div>
  );
}
