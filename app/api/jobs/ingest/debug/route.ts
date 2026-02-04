import { NextResponse } from "next/server";
import { extractSample } from "./sample";

export const dynamic = "force-dynamic";

export async function GET() {
  const sample = extractSample();
  console.log("Sample parsed record", sample);
  return NextResponse.json(sample);
}
