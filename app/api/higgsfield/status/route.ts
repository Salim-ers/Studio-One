import { NextResponse } from "next/server";
import { resolveHiggsfieldCredentials } from "@/lib/higgsfield-server";

/** Indique si Higgsfield est configuré, sans exposer les clés. */
export async function GET() {
  return NextResponse.json({
    configured: Boolean(resolveHiggsfieldCredentials()),
  });
}
