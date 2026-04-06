import { NextResponse } from "next/server";
import { exec } from "child_process";
import { promisify } from "util";
import path from "path";
import { existsSync } from "fs";

const execAsync = promisify(exec);

export async function POST() {
  const rootDir = path.join(process.cwd(), "..");
  const scriptPath = path.join(rootDir, "ingest.py");

  // If ingest.py doesn't exist yet, the agent needs to create it first.
  // This is expected — return a soft success with instructions.
  if (!existsSync(scriptPath)) {
    return NextResponse.json({
      success: false,
      message:
        "Files saved to data/. Ask your agent to run 'ingest my data' to process them into entries.",
    });
  }

  try {
    const { stdout, stderr } = await execAsync(`python3 "${scriptPath}"`, {
      cwd: rootDir,
      timeout: 120_000,
    });

    return NextResponse.json({
      success: true,
      output: stdout,
      warnings: stderr || undefined,
    });
  } catch (error) {
    console.error("Ingest error:", error);
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 },
    );
  }
}
