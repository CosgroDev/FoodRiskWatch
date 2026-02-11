export default function TermsPage() {
  return (
    <div className="card p-6 md:p-8 max-w-4xl mx-auto space-y-8">
      <div className="space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border border-border bg-base text-primary font-semibold text-sm">
          <span className="h-2 w-2 rounded-full bg-primary" />
          Legal
        </div>
        <h1 className="text-3xl font-bold">Terms of Service</h1>
        <p className="text-muted text-sm">Last updated: February 2025</p>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 space-y-3">
        <h2 className="text-xl font-semibold text-amber-800">Important Disclaimer</h2>
        <p className="text-amber-800 leading-relaxed">
          <strong>FoodRisk Watch is an independent, unofficial service.</strong> We are not affiliated with,
          endorsed by, or officially connected to the European Commission, RASFF (Rapid Alert System
          for Food and Feed), or any governmental or regulatory body. The information provided through
          this service has <strong>no legal standing</strong> and should not be relied upon for regulatory
          compliance, legal decisions, or official food safety actions.
        </p>
      </div>

      <div className="bg-base border border-border rounded-xl p-5 space-y-4">
        <h2 className="text-xl font-semibold">1. Service Description</h2>
        <p className="text-secondary leading-relaxed">
          FoodRisk Watch provides email notifications about food safety alerts by aggregating
          publicly available information from the RASFF Portal. This is an informational service
          only and does not constitute official food safety advice.
        </p>
      </div>

      <div className="bg-base border border-border rounded-xl p-5 space-y-4">
        <h2 className="text-xl font-semibold">2. Data Source and Accuracy</h2>
        <ul className="space-y-2 text-secondary">
          <li className="flex gap-3">
            <span className="h-1.5 w-1.5 mt-2 rounded-full bg-primary shrink-0" />
            <span>Alert data is sourced from the publicly accessible RASFF Portal API operated by the European Commission.</span>
          </li>
          <li className="flex gap-3">
            <span className="h-1.5 w-1.5 mt-2 rounded-full bg-primary shrink-0" />
            <span>We do not guarantee the accuracy, completeness, or timeliness of the information provided.</span>
          </li>
          <li className="flex gap-3">
            <span className="h-1.5 w-1.5 mt-2 rounded-full bg-primary shrink-0" />
            <span>Data may be delayed, incomplete, or contain errors introduced during processing.</span>
          </li>
          <li className="flex gap-3">
            <span className="h-1.5 w-1.5 mt-2 rounded-full bg-primary shrink-0" />
            <span><strong className="text-ink">Always verify alert information</strong> through official channels before taking any action.</span>
          </li>
        </ul>
      </div>

      <div className="bg-base border border-border rounded-xl p-5 space-y-4">
        <h2 className="text-xl font-semibold">3. No Legal or Regulatory Standing</h2>
        <p className="text-secondary leading-relaxed">
          The alerts and notifications provided by FoodRisk Watch:
        </p>
        <ul className="space-y-2 text-secondary">
          <li className="flex gap-3">
            <span className="h-1.5 w-1.5 mt-2 rounded-full bg-primary shrink-0" />
            <span>Have no legal implications or regulatory authority</span>
          </li>
          <li className="flex gap-3">
            <span className="h-1.5 w-1.5 mt-2 rounded-full bg-primary shrink-0" />
            <span>Cannot be used as evidence of compliance or non-compliance</span>
          </li>
          <li className="flex gap-3">
            <span className="h-1.5 w-1.5 mt-2 rounded-full bg-primary shrink-0" />
            <span>Do not constitute official notification under any food safety regulation</span>
          </li>
          <li className="flex gap-3">
            <span className="h-1.5 w-1.5 mt-2 rounded-full bg-primary shrink-0" />
            <span>Should not replace official food safety monitoring systems</span>
          </li>
          <li className="flex gap-3">
            <span className="h-1.5 w-1.5 mt-2 rounded-full bg-primary shrink-0" />
            <span>Are provided for informational purposes only</span>
          </li>
        </ul>
        <p className="text-secondary leading-relaxed pt-2">
          For official food safety information and regulatory guidance, please consult your
          national food safety authority or the official RASFF Portal.
        </p>
      </div>

      <div className="bg-base border border-border rounded-xl p-5 space-y-4">
        <h2 className="text-xl font-semibold">4. Limitation of Liability</h2>
        <p className="text-secondary leading-relaxed">
          This service is provided &quot;as is&quot; without warranties of any kind, either express
          or implied. We shall not be liable for:
        </p>
        <ul className="space-y-2 text-secondary">
          <li className="flex gap-3">
            <span className="h-1.5 w-1.5 mt-2 rounded-full bg-primary shrink-0" />
            <span>Any decisions made based on information from this service</span>
          </li>
          <li className="flex gap-3">
            <span className="h-1.5 w-1.5 mt-2 rounded-full bg-primary shrink-0" />
            <span>Financial losses, business interruption, or other damages</span>
          </li>
          <li className="flex gap-3">
            <span className="h-1.5 w-1.5 mt-2 rounded-full bg-primary shrink-0" />
            <span>Missed alerts, delayed notifications, or service interruptions</span>
          </li>
          <li className="flex gap-3">
            <span className="h-1.5 w-1.5 mt-2 rounded-full bg-primary shrink-0" />
            <span>Inaccuracies or errors in the alert data</span>
          </li>
          <li className="flex gap-3">
            <span className="h-1.5 w-1.5 mt-2 rounded-full bg-primary shrink-0" />
            <span>Any action or inaction taken as a result of using this service</span>
          </li>
        </ul>
      </div>

      <div className="bg-base border border-border rounded-xl p-5 space-y-4">
        <h2 className="text-xl font-semibold">5. Acceptable Use</h2>
        <p className="text-secondary leading-relaxed">By using FoodRisk Watch, you agree to:</p>
        <ul className="space-y-2 text-secondary">
          <li className="flex gap-3">
            <span className="h-1.5 w-1.5 mt-2 rounded-full bg-primary shrink-0" />
            <span>Provide a valid email address that you own or have permission to use</span>
          </li>
          <li className="flex gap-3">
            <span className="h-1.5 w-1.5 mt-2 rounded-full bg-primary shrink-0" />
            <span>Not use the service for any unlawful purpose</span>
          </li>
          <li className="flex gap-3">
            <span className="h-1.5 w-1.5 mt-2 rounded-full bg-primary shrink-0" />
            <span>Not attempt to overload, disrupt, or gain unauthorised access to the service</span>
          </li>
          <li className="flex gap-3">
            <span className="h-1.5 w-1.5 mt-2 rounded-full bg-primary shrink-0" />
            <span>Not redistribute the service or its content commercially without permission</span>
          </li>
        </ul>
      </div>

      <div className="bg-base border border-border rounded-xl p-5 space-y-4">
        <h2 className="text-xl font-semibold">6. Service Availability</h2>
        <p className="text-secondary leading-relaxed">
          We do not guarantee uninterrupted or error-free service. We may modify, suspend, or
          discontinue the service at any time without prior notice. Scheduled maintenance and
          updates may temporarily affect availability.
        </p>
      </div>

      <div className="bg-base border border-border rounded-xl p-5 space-y-4">
        <h2 className="text-xl font-semibold">7. Intellectual Property</h2>
        <p className="text-secondary leading-relaxed">
          The RASFF data is sourced from the European Commission and is subject to their
          terms of use. The FoodRisk Watch service, design, and code are the property of
          Food Risk. &quot;RASFF&quot; is a trademark of the European Commission.
        </p>
      </div>

      <div className="bg-base border border-border rounded-xl p-5 space-y-4">
        <h2 className="text-xl font-semibold">8. Changes to Terms</h2>
        <p className="text-secondary leading-relaxed">
          We reserve the right to modify these terms at any time. Continued use of the service
          after changes constitutes acceptance of the new terms. Material changes will be
          communicated via email where possible.
        </p>
      </div>

      <div className="bg-base border border-border rounded-xl p-5 space-y-4">
        <h2 className="text-xl font-semibold">9. Contact</h2>
        <p className="text-secondary leading-relaxed">
          For questions about these terms, please contact us at{" "}
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
