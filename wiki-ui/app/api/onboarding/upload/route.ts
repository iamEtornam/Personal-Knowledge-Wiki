import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const sourceType = formData.get("sourceType") as string;
    const files = formData.getAll("files") as File[];

    if (!sourceType) {
      return NextResponse.json(
        { success: false, error: "sourceType is required" },
        { status: 400 },
      );
    }

    // Save files to data/<sourceType>/ in the project root
    const dataDir = path.join(process.cwd(), "..", "data", sourceType);
    await mkdir(dataDir, { recursive: true });

    const saved: string[] = [];
    for (const file of files) {
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      const dest = path.join(dataDir, file.name);
      await writeFile(dest, buffer);
      saved.push(file.name);
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
