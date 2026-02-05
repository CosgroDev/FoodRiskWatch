export type AlertItem = {
  hazard: string;
  hazard_category?: string | null;
  product_category: string | null;
  product_text: string | null;
  origin_country: string | null;
  notifying_country: string | null;
  alert_date: string | null;
  link: string | null;
  risk_level?: string | null;
};

// Get badge color based on hazard category
function getHazardBadgeStyle(category: string | null | undefined): { bg: string; color: string } {
  const cat = (category || "").toLowerCase();
  // Red - Highest concern
  if (cat.includes("pathogen") || cat === "serious") {
    return { bg: "#fef2f2", color: "#dc2626" };
  }
  // Orange - Biological/toxin concerns
  if (cat.includes("mycotoxin") || cat.includes("toxin") || cat.includes("allergen")) {
    return { bg: "#fff7ed", color: "#ea580c" };
  }
  // Yellow - Chemical concerns
  if (cat.includes("pesticide") || cat.includes("heavy metal") || cat.includes("pollutant") || cat.includes("contaminant")) {
    return { bg: "#fefce8", color: "#ca8a04" };
  }
  // Purple - Fraud/adulteration
  if (cat.includes("fraud") || cat.includes("novel")) {
    return { bg: "#faf5ff", color: "#9333ea" };
  }
  // Blue - Quality/labelling issues
  if (cat.includes("label") || cat.includes("packaging") || cat.includes("quality")) {
    return { bg: "#eff6ff", color: "#2563eb" };
  }
  // Default gray
  return { bg: "#f1f5f9", color: "#475569" };
}

// Get risk level badge
function getRiskBadge(riskLevel: string | null | undefined): string {
  if (!riskLevel) return "";
  const level = riskLevel.toLowerCase();
  let style = { bg: "#f1f5f9", color: "#475569", label: "Unknown" };

  if (level === "serious") {
    style = { bg: "#fef2f2", color: "#dc2626", label: "Serious" };
  } else if (level.includes("potential")) {
    style = { bg: "#fff7ed", color: "#ea580c", label: "Potential Risk" };
  } else if (level === "not-serious") {
    style = { bg: "#eff6ff", color: "#2563eb", label: "Not Serious" };
  } else if (level === "no-risk") {
    style = { bg: "#f0fdf4", color: "#16a34a", label: "No Risk" };
  } else if (level === "undecided") {
    style = { bg: "#f1f5f9", color: "#475569", label: "Under Review" };
  } else {
    return "";
  }

  return `<span style="display: inline-block; background: ${style.bg}; color: ${style.color}; font-size: 10px; font-weight: 600; padding: 2px 8px; border-radius: 10px; margin-left: 6px;">${style.label}</span>`;
}

export type DigestEmailData = {
  recipientEmail: string;
  alerts: AlertItem[];
  dateRange: { start: string; end: string };
  manageUrl: string;
  unsubscribeUrl: string;
};

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "Unknown date";
  try {
    return new Date(dateStr).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return dateStr;
  }
}

function escapeHtml(str: string | null | undefined): string {
  if (!str) return "";
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function renderDigestEmail(data: DigestEmailData): string {
  const { alerts, dateRange, manageUrl, unsubscribeUrl } = data;

  const alertRows = alerts
    .map((alert) => {
      const badgeStyle = getHazardBadgeStyle(alert.hazard_category);
      const riskBadge = getRiskBadge(alert.risk_level);
      const categoryLabel = alert.hazard_category ? ` (${escapeHtml(alert.hazard_category)})` : "";

      return `
      <tr>
        <td style="padding: 16px; border-bottom: 1px solid #e2e8f0;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td>
                <span style="display: inline-block; background: ${badgeStyle.bg}; color: ${badgeStyle.color}; font-size: 12px; font-weight: 600; padding: 4px 10px; border-radius: 12px; margin-bottom: 8px;">
                  ${escapeHtml(alert.hazard)}${categoryLabel}
                </span>${riskBadge}
              </td>
            </tr>
            <tr>
              <td style="padding-top: 8px;">
                <p style="margin: 0 0 6px 0; font-size: 15px; font-weight: 600; color: #1e293b;">
                  ${escapeHtml(alert.product_text) || "Product not specified"}
                </p>
                <p style="margin: 0; font-size: 13px; color: #64748b;">
                  ${escapeHtml(alert.product_category) || "Category unknown"}
                  ${alert.origin_country ? ` &bull; Origin: ${escapeHtml(alert.origin_country)}` : ""}
                  ${alert.notifying_country ? ` &bull; Notified by: ${escapeHtml(alert.notifying_country)}` : ""}
                </p>
                <p style="margin: 8px 0 0 0; font-size: 12px; color: #94a3b8;">
                  ${formatDate(alert.alert_date)}
                  ${alert.link ? ` &bull; <a href="${escapeHtml(alert.link)}" style="color: #0d9488; text-decoration: none;">View details &rarr;</a>` : ""}
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>`;
    })
    .join("");

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>FoodRisk Watch - Weekly Digest</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #f1f5f9;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width: 600px; width: 100%;">

          <!-- Header -->
          <tr>
            <td align="center" style="padding-bottom: 32px;">
              <table role="presentation" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="text-align: center;">
                    <p style="margin: 0; font-size: 28px; font-weight: 800; color: #0d9488; letter-spacing: -0.5px;">FoodRisk</p>
                    <p style="margin: 0; font-size: 18px; font-weight: 700; color: #64748b; letter-spacing: 4px;">WATCH</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Main Card -->
          <tr>
            <td>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 16px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1);">

                <!-- Title Section -->
                <tr>
                  <td style="padding: 32px 32px 24px 32px;">
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td>
                          <span style="display: inline-block; background: #f0fdfa; color: #0d9488; font-size: 12px; font-weight: 600; padding: 6px 12px; border-radius: 20px; border: 1px solid #99f6e4;">
                            Weekly Digest
                          </span>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding-top: 16px;">
                          <h1 style="margin: 0; font-size: 24px; font-weight: 700; color: #0f172a;">
                            Your Food Safety Alerts
                          </h1>
                          <p style="margin: 8px 0 0 0; font-size: 14px; color: #64748b;">
                            ${formatDate(dateRange.start)} - ${formatDate(dateRange.end)} &bull; ${alerts.length} alert${alerts.length !== 1 ? "s" : ""} matching your filters
                          </p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- Alerts List -->
                <tr>
                  <td style="padding: 0 32px;">
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border: 1px solid #e2e8f0; border-radius: 12px;">
                      ${alerts.length > 0 ? alertRows : `
                      <tr>
                        <td style="padding: 32px; text-align: center;">
                          <p style="margin: 0; font-size: 15px; color: #64748b;">
                            No alerts matched your filters this week.
                          </p>
                          <p style="margin: 8px 0 0 0; font-size: 13px; color: #94a3b8;">
                            Consider adjusting your preferences to receive more alerts.
                          </p>
                        </td>
                      </tr>`}
                    </table>
                  </td>
                </tr>

                <!-- CTA Section -->
                <tr>
                  <td style="padding: 32px;">
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td align="center">
                          <a href="${escapeHtml(manageUrl)}" style="display: inline-block; background: linear-gradient(135deg, #14b8a6 0%, #0d9488 100%); color: #ffffff; font-size: 14px; font-weight: 600; text-decoration: none; padding: 14px 28px; border-radius: 12px; box-shadow: 0 4px 14px rgba(13, 148, 136, 0.3);">
                            Manage Your Preferences
                          </a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 32px 20px; text-align: center;">
              <p style="margin: 0 0 8px 0; font-size: 13px; color: #64748b;">
                Powered by public RASFF data. We are not affiliated with RASFF.
              </p>
              <p style="margin: 0; font-size: 12px; color: #94a3b8;">
                <a href="${escapeHtml(manageUrl)}" style="color: #0d9488; text-decoration: none;">Preferences</a>
                &nbsp;&bull;&nbsp;
                <a href="${escapeHtml(unsubscribeUrl)}" style="color: #94a3b8; text-decoration: none;">Unsubscribe</a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`.trim();
}
