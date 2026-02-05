import { NextResponse } from "next/server";
import { renderDigestEmail, type AlertItem } from "../../../lib/email/digest-template";

export const dynamic = "force-dynamic";

// Sample alerts for preview
const sampleAlerts: AlertItem[] = [
  {
    hazard: "Salmonella",
    product_category: "Meat and meat products",
    product_text: "Frozen chicken breast fillets",
    origin_country: "Poland",
    notifying_country: "Germany",
    alert_date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    link: "https://example.com/alert/1",
  },
  {
    hazard: "Listeria monocytogenes",
    product_category: "Dairy products",
    product_text: "Soft cheese (Brie style)",
    origin_country: "France",
    notifying_country: "Belgium",
    alert_date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    link: "https://example.com/alert/2",
  },
  {
    hazard: "Aflatoxins",
    product_category: "Nuts and seeds",
    product_text: "Roasted peanuts in shell",
    origin_country: "Egypt",
    notifying_country: "Netherlands",
    alert_date: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
    link: "https://example.com/alert/3",
  },
  {
    hazard: "E. coli (STEC)",
    product_category: "Produce",
    product_text: "Fresh spinach leaves (pre-packed)",
    origin_country: "Spain",
    notifying_country: "United Kingdom",
    alert_date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    link: null,
  },
  {
    hazard: "Undeclared allergen (milk)",
    product_category: "Bakery products",
    product_text: "Chocolate chip cookies",
    origin_country: "Italy",
    notifying_country: "France",
    alert_date: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
    link: "https://example.com/alert/5",
  },
];

export async function GET() {
  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const html = renderDigestEmail({
    recipientEmail: "user@example.com",
    alerts: sampleAlerts,
    dateRange: {
      start: weekAgo.toISOString(),
      end: now.toISOString(),
    },
    manageUrl: "https://foodriskwatch.example/preferences?token=sample-token",
    unsubscribeUrl: "https://foodriskwatch.example/api/unsubscribe?token=sample-token",
  });

  return new NextResponse(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
    },
  });
}
