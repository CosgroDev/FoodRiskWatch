type Alert = {
  id: string;
  hazard: string | null;
  product_category: string | null;
  origin_country: string | null;
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

export function digestEmailHtml(
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

      return `
        <tr>
          <td style="padding: 16px; border-bottom: 1px solid #e2e8f0;">
            <div style="margin-bottom: 8px;">
              <span style="background: #fef2f2; color: #dc2626; padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: 600;">${alert.hazard || "Unknown hazard"}</span>
              <span style="background: #f0fdf4; color: #16a34a; padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: 600; margin-left: 4px;">${alert.product_category || "Unknown category"}</span>
            </div>
            <p style="margin: 0 0 8px; font-weight: 500;">${alert.product_text || "No product description"}</p>
            <p style="margin: 0; color: #64748b; font-size: 14px;">
              Origin: ${alert.origin_country || "Unknown"} | ${date}
              | <a href="${detailUrl}" style="color: #16a34a;">View details</a>
            </p>
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
  <title>Your Weekly FoodRisk Watch Digest</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #1e293b; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="text-align: center; margin-bottom: 30px;">
    <h1 style="color: #16a34a; margin: 0;">FoodRisk Watch</h1>
    <p style="color: #64748b; margin: 5px 0 0;">Your Weekly Food Safety Digest</p>
  </div>

  <div style="background: #f8fafc; border-radius: 12px; padding: 20px; margin-bottom: 20px;">
    <h2 style="margin-top: 0; color: #1e293b;">${alerts.length} alert${alerts.length === 1 ? "" : "s"} this week</h2>
    <p style="color: #64748b; margin-bottom: 0;">Based on your filter preferences, here are the food safety alerts that match your criteria.</p>
  </div>

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
  baseUrl: string
): string {
  const alertList = alerts
    .map((alert) => {
      const date = alert.alert_date
        ? new Date(alert.alert_date).toLocaleDateString("en-GB")
        : "Unknown date";
      const detailUrl = `${baseUrl}/alerts/${encodeURIComponent(alert.id)}`;
      return `
- ${alert.hazard || "Unknown hazard"} | ${alert.product_category || "Unknown category"}
  ${alert.product_text || "No product description"}
  Origin: ${alert.origin_country || "Unknown"} | ${date}
  Details: ${detailUrl}
      `.trim();
    })
    .join("\n\n");

  return `
FoodRisk Watch - Your Weekly Digest

${alerts.length} alert${alerts.length === 1 ? "" : "s"} this week

Based on your filter preferences, here are the food safety alerts that match your criteria:

${alertList}

---

Manage preferences: ${manageUrl}
Unsubscribe: ${unsubscribeUrl}

--
FoodRisk Watch - Keeping you informed about food safety in Europe
Data sourced from the EU RASFF (Rapid Alert System for Food and Feed)
  `.trim();
}
