import crypto from "crypto";

const mockRecord = {
  id: "demo-1",
  hazard: "Salmonella",
  productCategory: "Meat",
  product: "Chicken" ,
  originCountry: "Belgium",
  notifyingCountry: "France",
  publishedAt: new Date().toISOString(),
  url: "https://example.test/alert/demo",
};

export function extractSample() {
  const hazard = mockRecord.hazard;
  const common = {
    product_category: mockRecord.productCategory,
    product_text: mockRecord.product,
    origin_country: mockRecord.originCountry,
    notifying_country: mockRecord.notifyingCountry,
    alert_date: mockRecord.publishedAt,
    link: mockRecord.url,
  };

  return {
    raw: mockRecord,
    fact: {
      id: crypto.randomUUID(),
      hazard,
      ...common,
    },
  };
}
