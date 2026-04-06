import { NextResponse } from "next/server";

interface OllamaTagsResponse {
  models: Array<{ name: string; size: number }>;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const baseUrl = (searchParams.get("url") ?? "http://localhost:11434").replace(/\/$/, "");

  try {
    const res = await fetch(`${baseUrl}/api/tags`, {
      signal: AbortSignal.timeout(5000),
    });

    if (!res.ok) {
      return NextResponse.json(
        { connected: false, error: `Ollama returned HTTP ${res.status}` },
        { status: 200 },
      );
    }

    const data = (await res.json()) as OllamaTagsResponse;
    const models = (data.models ?? []).map((m) => m.name).sort();

    return NextResponse.json({ connected: true, models });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Could not reach Ollama";
    return NextResponse.json({ connected: false, error: message });
  }
}
