import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

// Allowlist of valid source IDs — prevents path traversal via sourceType
const VALID_SOURCE_TYPES = new Set([
  "twitter",
  "instagram",
  "facebook",
  "whatsapp",
  "imessage",
  "apple-notes",
  "dayone",
  "obsidian",
  "notion",
  "files",
]);

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const sourceType = formData.get("sourceType") as string;
    const files = formData.getAll("files") as File[];

    if (!sourceType || !VALID_SOURCE_TYPES.has(sourceType)) {
      return NextResponse.json(
        { success: false, error: "Invalid or missing sourceType" },
        { status: 400 },
      );
    }

    const dataDir = path.join(process.cwd(), "..", "data", sourceType);
    await mkdir(dataDir, { recursive: true });

    const saved: string[] = [];
    for (const file of files) {
      // Sanitize filename to prevent path traversal attacks
      const safeName = path.basename(file.name);
      if (!safeName) continue;

      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      await writeFile(path.join(dataDir, safeName), buffer);
      saved.push(safeName);
    }

    return NextResponse.json({ success: true, count: saved.length, files: saved });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 },
    );
  }
}
