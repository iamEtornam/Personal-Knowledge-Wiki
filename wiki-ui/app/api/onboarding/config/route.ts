import { getWikiConfig, saveWikiConfig } from "@/lib/config";
import { NextResponse } from "next/server";

export async function GET() {
  const config = getWikiConfig();
  return NextResponse.json(config);
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { ownerName } = body;

    if (!ownerName || typeof ownerName !== "string" || !ownerName.trim()) {
      return NextResponse.json(
        { error: "ownerName is required" },
        { status: 400 },
      );
    }

    const config = saveWikiConfig({ ownerName: ownerName.trim() });
    return NextResponse.json(config);
  } catch {
    return NextResponse.json(
      { error: "Failed to save configuration" },
      { status: 500 },
    );
  }
}
