export default function TermsPage() {
  return (
    <div className="card" style={{ maxWidth: "800px", margin: "0 auto" }}>
      <h1>Terms of Service</h1>
      <p style={{ color: "#666", marginBottom: "2rem" }}>
        Last updated: February 2025
      </p>

      <section style={{ marginBottom: "2rem", padding: "1rem", backgroundColor: "#fff3cd", borderRadius: "8px", border: "1px solid #ffc107" }}>
        <h2 style={{ color: "#856404", marginTop: 0 }}>Important Disclaimer</h2>
        <p style={{ color: "#856404", marginBottom: 0 }}>
          <strong>FoodRisk Watch is an independent, unofficial service.</strong> We are not affiliated with,
          endorsed by, or officially connected to the European Commission, RASFF (Rapid Alert System
          for Food and Feed), or any governmental or regulatory body. The information provided through
          this service has <strong>no legal standing</strong> and should not be relied upon for regulatory
          compliance, legal decisions, or official food safety actions.
        </p>
      </section>

      <section style={{ marginBottom: "2rem" }}>
        <h2>1. Service Description</h2>
        <p>
          FoodRisk Watch provides email notifications about food safety alerts by aggregating
          publicly available information from the RASFF Portal. This is an informational service
          only and does not constitute official food safety advice.
        </p>
      </section>

      <section style={{ marginBottom: "2rem" }}>
        <h2>2. Data Source and Accuracy</h2>
        <ul>
          <li>
            Alert data is sourced from the publicly accessible RASFF Portal API operated by
            the European Commission.
          </li>
          <li>
            We do not guarantee the accuracy, completeness, or timeliness of the information
            provided.
          </li>
          <li>
            Data may be delayed, incomplete, or contain errors introduced during processing.
          </li>
          <li>
            <strong>Always verify alert information</strong> through official channels before
            taking any action.
          </li>
        </ul>
      </section>

      <section style={{ marginBottom: "2rem" }}>
        <h2>3. No Legal or Regulatory Standing</h2>
        <p>
          The alerts and notifications provided by FoodRisk Watch:
        </p>
        <ul>
          <li>Have no legal implications or regulatory authority</li>
          <li>Cannot be used as evidence of compliance or non-compliance</li>
          <li>Do not constitute official notification under any food safety regulation</li>
          <li>Should not replace official food safety monitoring systems</li>
          <li>Are provided for informational purposes only</li>
        </ul>
        <p>
          For official food safety information and regulatory guidance, please consult your
          national food safety authority or the official RASFF Portal.
        </p>
      </section>

      <section style={{ marginBottom: "2rem" }}>
        <h2>4. Limitation of Liability</h2>
        <p>
          This service is provided &quot;as is&quot; without warranties of any kind, either express
          or implied. We shall not be liable for:
        </p>
        <ul>
          <li>Any decisions made based on information from this service</li>
          <li>Financial losses, business interruption, or other damages</li>
          <li>Missed alerts, delayed notifications, or service interruptions</li>
          <li>Inaccuracies or errors in the alert data</li>
          <li>Any action or inaction taken as a result of using this service</li>
        </ul>
      </section>

      <section style={{ marginBottom: "2rem" }}>
        <h2>5. Acceptable Use</h2>
        <p>By using FoodRisk Watch, you agree to:</p>
        <ul>
          <li>Provide a valid email address that you own or have permission to use</li>
          <li>Not use the service for any unlawful purpose</li>
          <li>Not attempt to overload, disrupt, or gain unauthorised access to the service</li>
          <li>Not redistribute the service or its content commercially without permission</li>
        </ul>
      </section>

      <section style={{ marginBottom: "2rem" }}>
        <h2>6. Service Availability</h2>
        <p>
          We do not guarantee uninterrupted or error-free service. We may modify, suspend, or
          discontinue the service at any time without prior notice. Scheduled maintenance and
          updates may temporarily affect availability.
        </p>
      </section>

      <section style={{ marginBottom: "2rem" }}>
        <h2>7. Intellectual Property</h2>
        <p>
          The RASFF data is sourced from the European Commission and is subject to their
          terms of use. The FoodRisk Watch service, design, and code are the property of
          the service operator. &quot;RASFF&quot; is a trademark of the European Commission.
        </p>
      </section>

      <section style={{ marginBottom: "2rem" }}>
        <h2>8. Changes to Terms</h2>
        <p>
          We reserve the right to modify these terms at any time. Continued use of the service
          after changes constitutes acceptance of the new terms. Material changes will be
          communicated via email where possible.
        </p>
      </section>

      <section style={{ marginBottom: "2rem" }}>
        <h2>9. Contact</h2>
        <p>
          For questions about these terms, please contact the site administrator.
        </p>
      </section>
    </div>
  );
}
