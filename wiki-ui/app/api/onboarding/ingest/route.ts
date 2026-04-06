import { NextResponse } from "next/server";
import { execFile } from "child_process";
import { promisify } from "util";
import path from "path";
import { existsSync } from "fs";

// execFile is safer than exec — arguments are passed as an array, not a shell
// string, so there is no risk of command injection via the script path.
const execFileAsync = promisify(execFile);

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
    const { stdout, stderr } = await execFileAsync("python3", [scriptPath], {
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
