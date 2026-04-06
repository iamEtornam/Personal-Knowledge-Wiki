import { getWikiConfig } from "@/lib/config";
import { execFile } from "child_process";
import { existsSync } from "fs";
import { NextResponse } from "next/server";
import path from "path";
import { promisify } from "util";

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

  const config = getWikiConfig();
  const args: string[] = [scriptPath];

  if (config.llmEnabled) {
    args.push("--llm");
    if (config.llmModel) args.push("--model", config.llmModel);
    if (config.llmOllamaUrl) args.push("--ollama-url", config.llmOllamaUrl);
  }

  // Allow more time when the LLM is cleaning each file.
  const timeout = config.llmEnabled ? 600_000 : 120_000;

  try {
    const { stdout, stderr } = await execFileAsync("python3", args, {
      cwd: rootDir,
      timeout,
    });

    return NextResponse.json({
      success: true,
      output: stdout,
      warnings: stderr || undefined,
      llmEnabled: config.llmEnabled,
    });
  } catch (error) {
    console.error("Ingest error:", error);
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 },
    );
  }
}
