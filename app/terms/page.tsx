function TermsIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden="true">
      <rect x="5" y="4" width="14" height="16" rx="2" stroke="currentColor" strokeWidth="1.8" />
      <path d="M8 9h8M8 13h8M8 17h5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

export default function TermsPage() {
  return (
    <div className="content-wrap">
      <article className="card p-6 md:p-8 max-w-4xl space-y-6">
        <div className="flex items-center gap-3">
          <span className="icon-badge">
            <TermsIcon />
          </span>
          <div>
            <p className="m-0 text-xs font-semibold uppercase tracking-[0.16em] text-blue-700">Legal</p>
            <h1 className="m-0 text-2xl md:text-3xl font-bold text-slate-900">Terms of Service</h1>
          </div>
        </div>

        <p className="text-sm text-slate-500 m-0">Last updated: February 2025</p>

        <section className="space-y-2">
          <h2 className="text-lg font-semibold text-slate-900 m-0">Important Disclaimer</h2>
          <p className="text-slate-700 m-0">
            FoodRisk Watch is an independent, unofficial service. We are not affiliated with, endorsed by, or
            officially connected to the European Commission, RASFF (Rapid Alert System for Food and Feed), or any
            governmental or regulatory body. The information provided through this service has no legal standing and
            should not be relied upon for regulatory compliance, legal decisions, or official food safety actions.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-semibold text-slate-900 m-0">1. Service Description</h2>
          <p className="text-slate-700 m-0">
            FoodRisk Watch provides email notifications about food safety alerts by aggregating publicly available
            information from the RASFF Portal. This is an informational service only and does not constitute official
            food safety advice.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-semibold text-slate-900 m-0">2. Data Source and Accuracy</h2>
          <ul className="space-y-1 text-slate-700">
            <li>
              Alert data is sourced from the publicly accessible RASFF Portal API operated by the European Commission.
            </li>
            <li>We do not guarantee the accuracy, completeness, or timeliness of the information provided.</li>
            <li>Data may be delayed, incomplete, or contain errors introduced during processing.</li>
            <li>Always verify alert information through official channels before taking any action.</li>
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-semibold text-slate-900 m-0">3. No Legal or Regulatory Standing</h2>
          <p className="text-slate-700 m-0">The alerts and notifications provided by FoodRisk Watch:</p>
          <ul className="space-y-1 text-slate-700">
            <li>Have no legal implications or regulatory authority</li>
            <li>Cannot be used as evidence of compliance or non-compliance</li>
            <li>Do not constitute official notification under any food safety regulation</li>
            <li>Should not replace official food safety monitoring systems</li>
            <li>Are provided for informational purposes only</li>
          </ul>
          <p className="text-slate-700 m-0">
            For official food safety information and regulatory guidance, please consult your national food safety
            authority or the official RASFF Portal.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-semibold text-slate-900 m-0">4. Limitation of Liability</h2>
          <p className="text-slate-700 m-0">
            This service is provided &quot;as is&quot; without warranties of any kind, either express or implied. We
            shall not be liable for:
          </p>
          <ul className="space-y-1 text-slate-700">
            <li>Any decisions made based on information from this service</li>
            <li>Financial losses, business interruption, or other damages</li>
            <li>Missed alerts, delayed notifications, or service interruptions</li>
            <li>Inaccuracies or errors in the alert data</li>
            <li>Any action or inaction taken as a result of using this service</li>
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-semibold text-slate-900 m-0">5. Acceptable Use</h2>
          <p className="text-slate-700 m-0">By using FoodRisk Watch, you agree to:</p>
          <ul className="space-y-1 text-slate-700">
            <li>Provide a valid email address that you own or have permission to use</li>
            <li>Not use the service for any unlawful purpose</li>
            <li>Not attempt to overload, disrupt, or gain unauthorised access to the service</li>
            <li>Not redistribute the service or its content commercially without permission</li>
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-semibold text-slate-900 m-0">6. Service Availability</h2>
          <p className="text-slate-700 m-0">
            We do not guarantee uninterrupted or error-free service. We may modify, suspend, or discontinue the
            service at any time without prior notice. Scheduled maintenance and updates may temporarily affect
            availability.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-semibold text-slate-900 m-0">7. Intellectual Property</h2>
          <p className="text-slate-700 m-0">
            The RASFF data is sourced from the European Commission and is subject to their terms of use. The FoodRisk
            Watch service, design, and code are the property of Food Risk. &quot;RASFF&quot; is a trademark of the
            European Commission.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-semibold text-slate-900 m-0">8. Changes to Terms</h2>
          <p className="text-slate-700 m-0">
            We reserve the right to modify these terms at any time. Continued use of the service after changes
            constitutes acceptance of the new terms. Material changes will be communicated via email where possible.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-semibold text-slate-900 m-0">9. Contact</h2>
          <p className="text-slate-700 m-0">
            For questions about these terms, please contact us at{" "}
            <a href="mailto:info@foodrisk.co.uk" className="text-blue-700 underline">
              info@foodrisk.co.uk
            </a>
          </p>
        </section>
      </article>
    </div>
  );
}

