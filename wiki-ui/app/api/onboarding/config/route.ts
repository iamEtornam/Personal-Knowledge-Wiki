import { getWikiConfig, saveWikiConfig } from "@/lib/config";
import { NextResponse } from "next/server";

export async function GET() {
  const config = getWikiConfig();
  return NextResponse.json(config);
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { ownerName, llmEnabled, llmModel, llmOllamaUrl } = body;

    if (!ownerName || typeof ownerName !== "string" || !ownerName.trim()) {
      return NextResponse.json(
        { error: "ownerName is required" },
        { status: 400 },
      );
    }

    const update: Parameters<typeof saveWikiConfig>[0] = {
      ownerName: ownerName.trim(),
    };
    if (typeof llmEnabled === "boolean") update.llmEnabled = llmEnabled;
    if (typeof llmModel === "string" && llmModel.trim()) update.llmModel = llmModel.trim();
    if (typeof llmOllamaUrl === "string" && llmOllamaUrl.trim()) update.llmOllamaUrl = llmOllamaUrl.trim();

    const config = saveWikiConfig(update);
    return NextResponse.json(config);
  } catch {
    return NextResponse.json(
      { error: "Failed to save configuration" },
      { status: 500 },
    );
  }
}
