export default function PrivacyPage() {
  return (
    <div className="card" style={{ maxWidth: "800px", margin: "0 auto" }}>
      <h1>Privacy Policy</h1>
      <p style={{ color: "#666", marginBottom: "2rem" }}>
        Last updated: February 2025
      </p>

      <section style={{ marginBottom: "2rem" }}>
        <h2>About FoodRisk Watch</h2>
        <p>
          FoodRisk Watch is an independent alert notification service that aggregates publicly
          available food safety information. We are not affiliated with, endorsed by, or
          officially connected to the European Commission, RASFF (Rapid Alert System for Food
          and Feed), or any governmental body.
        </p>
      </section>

      <section style={{ marginBottom: "2rem" }}>
        <h2>Data We Collect</h2>
        <h3>Information You Provide</h3>
        <ul>
          <li><strong>Email address:</strong> Used solely to send you food safety alert notifications</li>
          <li><strong>Filter preferences:</strong> Your selected hazard types, product categories, and countries of interest</li>
          <li><strong>Subscription settings:</strong> Your preferred notification frequency</li>
        </ul>

        <h3>Information We Process</h3>
        <ul>
          <li><strong>Food safety alerts:</strong> Publicly available data sourced from the RASFF Portal API</li>
          <li><strong>Delivery records:</strong> Which alerts have been sent to you (to prevent duplicates)</li>
        </ul>
      </section>

      <section style={{ marginBottom: "2rem" }}>
        <h2>How We Use Your Data</h2>
        <ul>
          <li>To send you personalised food safety alert digests based on your preferences</li>
          <li>To verify your email address when you subscribe</li>
          <li>To allow you to manage your subscription and preferences</li>
        </ul>
        <p>
          We do <strong>not</strong> sell, share, or transfer your personal data to third parties
          for marketing purposes.
        </p>
      </section>

      <section style={{ marginBottom: "2rem" }}>
        <h2>Data Storage and Security</h2>
        <ul>
          <li>Your data is stored in Supabase, using EU-hosted PostgreSQL databases</li>
          <li>All data transmission uses HTTPS encryption</li>
          <li>Access to the database is restricted and protected by authentication</li>
          <li>We retain your data only for as long as your subscription is active</li>
        </ul>
      </section>

      <section style={{ marginBottom: "2rem" }}>
        <h2>Third-Party Services</h2>
        <ul>
          <li><strong>Supabase:</strong> Database hosting (EU region)</li>
          <li><strong>Vercel:</strong> Application hosting</li>
          <li><strong>Resend:</strong> Email delivery service</li>
        </ul>
        <p>
          These services have their own privacy policies and data processing agreements.
        </p>
      </section>

      <section style={{ marginBottom: "2rem" }}>
        <h2>Your Rights</h2>
        <p>You have the right to:</p>
        <ul>
          <li><strong>Access:</strong> Request a copy of the data we hold about you</li>
          <li><strong>Rectification:</strong> Update your preferences at any time via the manage link</li>
          <li><strong>Erasure:</strong> Unsubscribe and request deletion of your data</li>
          <li><strong>Portability:</strong> Request your data in a portable format</li>
        </ul>
        <p>
          To exercise these rights, use the unsubscribe link in any email or contact us directly.
        </p>
      </section>

      <section style={{ marginBottom: "2rem" }}>
        <h2>Cookies</h2>
        <p>
          FoodRisk Watch does not use tracking cookies or analytics. We only use essential
          cookies required for the application to function.
        </p>
      </section>

      <section style={{ marginBottom: "2rem" }}>
        <h2>Changes to This Policy</h2>
        <p>
          We may update this privacy policy from time to time. Any changes will be posted on
          this page with an updated revision date.
        </p>
      </section>

      <section style={{ marginBottom: "2rem" }}>
        <h2>Contact</h2>
        <p>
          For privacy-related enquiries, please contact the site administrator.
        </p>
      </section>
    </div>
  );
}
