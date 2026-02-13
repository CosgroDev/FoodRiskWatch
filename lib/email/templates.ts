type Alert = {
  id: string;
  hazards: string[];
  countries: string[];
  product_category: string | null;
  product_text: string | null;
  alert_date: string | null;
  link: string | null;
};

export function verificationEmailHtml(verifyUrl: string): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Verify your FoodRisk Watch subscription</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #1e293b; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="text-align: center; margin-bottom: 30px;">
    <h1 style="color: #16a34a; margin: 0;">FoodRisk Watch</h1>
    <p style="color: #64748b; margin: 5px 0 0;">Food Safety Alerts for Europe</p>
  </div>

  <div style="background: #f8fafc; border-radius: 12px; padding: 30px; margin-bottom: 20px;">
    <h2 style="margin-top: 0; color: #1e293b;">Confirm your subscription</h2>
    <p>Thanks for signing up for FoodRisk Watch! Click the button below to verify your email and start receiving food safety alerts.</p>

    <div style="text-align: center; margin: 30px 0;">
      <a href="${verifyUrl}" style="background: #16a34a; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; display: inline-block;">Verify my email</a>
    </div>

    <p style="color: #64748b; font-size: 14px;">This link expires in 24 hours.</p>
  </div>

  <p style="color: #64748b; font-size: 14px;">If you didn't sign up for FoodRisk Watch, you can safely ignore this email.</p>

  <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 30px 0;">

  <p style="color: #94a3b8; font-size: 12px; text-align: center;">
    FoodRisk Watch - Keeping you informed about food safety in Europe
  </p>
</body>
</html>
  `.trim();
}

export function verificationEmailText(verifyUrl: string): string {
  return `
Confirm your FoodRisk Watch subscription

Thanks for signing up for FoodRisk Watch! Click the link below to verify your email and start receiving food safety alerts.

Verify your email: ${verifyUrl}

This link expires in 24 hours.

If you didn't sign up for FoodRisk Watch, you can safely ignore this email.

--
FoodRisk Watch - Keeping you informed about food safety in Europe
  `.trim();
}

export function loginEmailHtml(manageUrl: string): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Manage your FoodRisk Watch preferences</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #1e293b; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="text-align: center; margin-bottom: 30px;">
    <h1 style="color: #16a34a; margin: 0;">FoodRisk Watch</h1>
    <p style="color: #64748b; margin: 5px 0 0;">Food Safety Alerts for Europe</p>
  </div>

  <div style="background: #f8fafc; border-radius: 12px; padding: 30px; margin-bottom: 20px;">
    <h2 style="margin-top: 0; color: #1e293b;">Welcome back!</h2>
    <p>You're already subscribed to FoodRisk Watch. Click the button below to manage your alert preferences.</p>

    <div style="text-align: center; margin: 30px 0;">
      <a href="${manageUrl}" style="background: #16a34a; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; display: inline-block;">Manage my preferences</a>
    </div>

    <p style="color: #64748b; font-size: 14px;">This link expires in 30 days.</p>
  </div>

  <p style="color: #64748b; font-size: 14px;">If you didn't request this email, you can safely ignore it.</p>

  <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 30px 0;">

  <p style="color: #94a3b8; font-size: 12px; text-align: center;">
    FoodRisk Watch - Keeping you informed about food safety in Europe
  </p>
</body>
</html>
  `.trim();
}

export function loginEmailText(manageUrl: string): string {
  return `
Welcome back to FoodRisk Watch!

You're already subscribed to FoodRisk Watch. Click the link below to manage your alert preferences.

Manage your preferences: ${manageUrl}

This link expires in 30 days.

If you didn't request this email, you can safely ignore it.

--
FoodRisk Watch - Keeping you informed about food safety in Europe
  `.trim();
}

function getPeriodText(frequency: string): { period: string; adjective: string } {
  switch (frequency) {
    case "daily":
      return { period: "today", adjective: "Daily" };
    case "weekly":
      return { period: "this week", adjective: "Weekly" };
    case "monthly":
      return { period: "this month", adjective: "Monthly" };
    default:
      return { period: "this week", adjective: "Weekly" };
  }
}

export function digestEmailHtml(
  alerts: Alert[],
  manageUrl: string,
  unsubscribeUrl: string,
  baseUrl: string,
  frequency: string = "weekly",
  dashboardUrl?: string
): string {
  const { period, adjective } = getPeriodText(frequency);
  const isDaily = frequency === "daily";
  const alertRows = alerts
    .map((alert) => {
      const date = alert.alert_date
        ? new Date(alert.alert_date).toLocaleDateString("en-GB", {
            day: "numeric",
            month: "short",
            year: "numeric",
          })
        : "Unknown date";

      const detailUrl = `${baseUrl}/alerts/${encodeURIComponent(alert.id)}`;

      // Render hazard pills
      const hazardPills = alert.hazards
        .map(h => `<span style="background: #fef2f2; color: #dc2626; padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: 600; display: inline-block; margin: 2px 4px 2px 0;">${h}</span>`)
        .join("");

      // Render country pills
      const countryPills = alert.countries
        .map(c => `<span style="background: #eff6ff; color: #2563eb; padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: 600; display: inline-block; margin: 2px 4px 2px 0;">${c}</span>`)
        .join("");

      return `
        <tr>
          <td style="padding: 16px; border-bottom: 1px solid #e2e8f0;">
            <div style="margin-bottom: 8px;">
              <span style="background: #f0fdf4; color: #16a34a; padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: 600;">${alert.product_category || "Unknown category"}</span>
            </div>
            <p style="margin: 0 0 12px; font-weight: 500;">${alert.product_text || "No product description"}</p>
            <div style="margin-bottom: 8px;">
              <span style="color: #64748b; font-size: 12px; font-weight: 500;">Hazards:</span>
              ${hazardPills}
            </div>
            <div style="margin-bottom: 12px;">
              <span style="color: #64748b; font-size: 12px; font-weight: 500;">Origin:</span>
              ${countryPills}
            </div>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 0;"><a href="${detailUrl}" style="color: #16a34a; font-size: 14px; font-weight: 500;">View details &rarr;</a></td>
                <td style="padding: 0; text-align: right;"><span style="color: #94a3b8; font-size: 12px;">${date}</span></td>
              </tr>
            </table>
          </td>
        </tr>
      `;
    })
    .join("");

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your ${adjective} FoodRisk Watch Digest</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #1e293b; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="text-align: center; margin-bottom: 30px;">
    <h1 style="color: #16a34a; margin: 0;">FoodRisk Watch</h1>
    <p style="color: #64748b; margin: 5px 0 0;">Your ${adjective} Food Safety Digest</p>
  </div>

  <div style="background: #f8fafc; border-radius: 12px; padding: 20px; margin-bottom: 20px;">
    <h2 style="margin-top: 0; color: #1e293b;">${alerts.length} alert${alerts.length === 1 ? "" : "s"} ${period}</h2>
    <p style="color: #64748b; margin-bottom: 0;">Based on your filter preferences, here are the food safety alerts that match your criteria.</p>
  </div>

  ${isDaily && dashboardUrl ? `
  <div style="background: #faf5ff; border-radius: 12px; padding: 20px; margin-bottom: 20px; border: 1px solid #e9d5ff; text-align: center;">
    <p style="margin: 0 0 12px; color: #6b21a8; font-weight: 500;">View trends, filter alerts, and explore your data</p>
    <a href="${dashboardUrl}" style="background: #9333ea; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; display: inline-block;">Open Dashboard</a>
  </div>
  ` : ''}

  <table style="width: 100%; border-collapse: collapse; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
    <tbody>
      ${alertRows}
    </tbody>
  </table>

  <div style="text-align: center; margin-top: 30px;">
    <a href="${manageUrl}" style="color: #16a34a; text-decoration: none; font-weight: 500;">Manage preferences</a>
    <span style="color: #cbd5e1; margin: 0 10px;">|</span>
    <a href="${unsubscribeUrl}" style="color: #64748b; text-decoration: none;">Unsubscribe</a>
  </div>

  <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 30px 0;">

  <p style="color: #94a3b8; font-size: 12px; text-align: center;">
    FoodRisk Watch - Keeping you informed about food safety in Europe<br>
    Data sourced from the EU RASFF (Rapid Alert System for Food and Feed)
  </p>
</body>
</html>
  `.trim();
}

export function digestEmailText(
  alerts: Alert[],
  manageUrl: string,
  unsubscribeUrl: string,
  baseUrl: string,
  frequency: string = "weekly",
  dashboardUrl?: string
): string {
  const { period, adjective } = getPeriodText(frequency);
  const isDaily = frequency === "daily";
  const alertList = alerts
    .map((alert) => {
      const date = alert.alert_date
        ? new Date(alert.alert_date).toLocaleDateString("en-GB")
        : "Unknown date";
      const detailUrl = `${baseUrl}/alerts/${encodeURIComponent(alert.id)}`;
      const hazardsList = alert.hazards.join(", ");
      const countriesList = alert.countries.join(", ");
      return `
- ${alert.product_category || "Unknown category"} | ${date}
  ${alert.product_text || "No product description"}
  Hazards: ${hazardsList}
  Origin: ${countriesList}
  Details: ${detailUrl}
      `.trim();
    })
    .join("\n\n");

  const dashboardSection = isDaily && dashboardUrl ? `
VIEW YOUR DASHBOARD
View trends, filter alerts, and explore your data:
${dashboardUrl}

---

` : '';

  return `
FoodRisk Watch - Your ${adjective} Digest

${alerts.length} alert${alerts.length === 1 ? "" : "s"} ${period}

Based on your filter preferences, here are the food safety alerts that match your criteria:
${dashboardSection}
${alertList}

---

Manage preferences: ${manageUrl}
Unsubscribe: ${unsubscribeUrl}

--
FoodRisk Watch - Keeping you informed about food safety in Europe
Data sourced from the EU RASFF (Rapid Alert System for Food and Feed)
  `.trim();
}

export function welcomeDigestEmailHtml(
  alerts: Alert[],
  manageUrl: string,
  unsubscribeUrl: string,
  baseUrl: string
): string {
  const alertRows = alerts
    .map((alert) => {
      const date = alert.alert_date
        ? new Date(alert.alert_date).toLocaleDateString("en-GB", {
            day: "numeric",
            month: "short",
            year: "numeric",
          })
        : "Unknown date";

      const detailUrl = `${baseUrl}/alerts/${encodeURIComponent(alert.id)}`;

      const hazardPills = alert.hazards
        .map(h => `<span style="background: #fef2f2; color: #dc2626; padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: 600; display: inline-block; margin: 2px 4px 2px 0;">${h}</span>`)
        .join("");

      const countryPills = alert.countries
        .map(c => `<span style="background: #eff6ff; color: #2563eb; padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: 600; display: inline-block; margin: 2px 4px 2px 0;">${c}</span>`)
        .join("");

      return `
        <tr>
          <td style="padding: 16px; border-bottom: 1px solid #e2e8f0;">
            <div style="margin-bottom: 8px;">
              <span style="background: #f0fdf4; color: #16a34a; padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: 600;">${alert.product_category || "Unknown category"}</span>
            </div>
            <p style="margin: 0 0 12px; font-weight: 500;">${alert.product_text || "No product description"}</p>
            <div style="margin-bottom: 8px;">
              <span style="color: #64748b; font-size: 12px; font-weight: 500;">Hazards:</span>
              ${hazardPills}
            </div>
            <div style="margin-bottom: 12px;">
              <span style="color: #64748b; font-size: 12px; font-weight: 500;">Origin:</span>
              ${countryPills}
            </div>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 0;"><a href="${detailUrl}" style="color: #16a34a; font-size: 14px; font-weight: 500;">View details &rarr;</a></td>
                <td style="padding: 0; text-align: right;"><span style="color: #94a3b8; font-size: 12px;">${date}</span></td>
              </tr>
            </table>
          </td>
        </tr>
      `;
    })
    .join("");

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to FoodRisk Watch</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #1e293b; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="text-align: center; margin-bottom: 30px;">
    <h1 style="color: #16a34a; margin: 0;">FoodRisk Watch</h1>
    <p style="color: #64748b; margin: 5px 0 0;">Welcome to Your Food Safety Alerts</p>
  </div>

  <div style="background: #f0fdf4; border-radius: 12px; padding: 20px; margin-bottom: 20px; border: 1px solid #bbf7d0;">
    <h2 style="margin-top: 0; color: #166534;">You're all set!</h2>
    <p style="color: #166534; margin-bottom: 0;">
      Thank you for subscribing to FoodRisk Watch. You're now on the <strong>Monthly (Free)</strong> plan.
      You'll receive your digest on the <strong>1st of each month</strong>.
    </p>
  </div>

  <div style="background: #f8fafc; border-radius: 12px; padding: 20px; margin-bottom: 20px;">
    <h2 style="margin-top: 0; color: #1e293b;">Here's what you've been missing</h2>
    <p style="color: #64748b; margin-bottom: 0;">Below are the ${alerts.length} most recent food safety alerts from the last 30 days. This gives you an idea of what your monthly digest will look like.</p>
  </div>

  <table style="width: 100%; border-collapse: collapse; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
    <tbody>
      ${alertRows}
    </tbody>
  </table>

  <div style="background: #eff6ff; border-radius: 12px; padding: 20px; margin-top: 20px; border: 1px solid #bfdbfe;">
    <h3 style="margin-top: 0; color: #1e40af;">Want more frequent alerts?</h3>
    <p style="color: #1e40af; margin-bottom: 10px;">
      Upgrade to Weekly (£7/month) or Daily (£11/month) to stay on top of food safety issues as they happen.
    </p>
    <a href="${manageUrl}" style="background: #2563eb; color: white; padding: 10px 20px; border-radius: 6px; text-decoration: none; font-weight: 600; display: inline-block;">View upgrade options</a>
  </div>

  <div style="text-align: center; margin-top: 30px;">
    <a href="${manageUrl}" style="color: #16a34a; text-decoration: none; font-weight: 500;">Manage preferences</a>
    <span style="color: #cbd5e1; margin: 0 10px;">|</span>
    <a href="${unsubscribeUrl}" style="color: #64748b; text-decoration: none;">Unsubscribe</a>
  </div>

  <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 30px 0;">

  <p style="color: #94a3b8; font-size: 12px; text-align: center;">
    FoodRisk Watch - Keeping you informed about food safety in Europe<br>
    Data sourced from the EU RASFF (Rapid Alert System for Food and Feed)
  </p>
</body>
</html>
  `.trim();
}

export function welcomeDigestEmailText(
  alerts: Alert[],
  manageUrl: string,
  unsubscribeUrl: string,
  baseUrl: string
): string {
  const alertList = alerts
    .map((alert) => {
      const date = alert.alert_date
        ? new Date(alert.alert_date).toLocaleDateString("en-GB")
        : "Unknown date";
      const detailUrl = `${baseUrl}/alerts/${encodeURIComponent(alert.id)}`;
      const hazardsList = alert.hazards.join(", ");
      const countriesList = alert.countries.join(", ");
      return `
- ${alert.product_category || "Unknown category"} | ${date}
  ${alert.product_text || "No product description"}
  Hazards: ${hazardsList}
  Origin: ${countriesList}
  Details: ${detailUrl}
      `.trim();
    })
    .join("\n\n");

  return `
Welcome to FoodRisk Watch!

You're all set! Thank you for subscribing to FoodRisk Watch.
You're now on the Monthly (Free) plan and will receive your digest on the 1st of each month.

HERE'S WHAT YOU'VE BEEN MISSING
-------------------------------
Below are the ${alerts.length} most recent food safety alerts from the last 30 days:

${alertList}

---

WANT MORE FREQUENT ALERTS?
Upgrade to Weekly (£7/month) or Daily (£11/month) to stay on top of food safety issues.
View options: ${manageUrl}

---

Manage preferences: ${manageUrl}
Unsubscribe: ${unsubscribeUrl}

--
FoodRisk Watch - Keeping you informed about food safety in Europe
Data sourced from the EU RASFF (Rapid Alert System for Food and Feed)
  `.trim();
}
