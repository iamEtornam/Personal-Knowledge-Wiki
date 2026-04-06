import { existsSync } from "fs";
import { rm, unlink } from "fs/promises";
import { NextResponse } from "next/server";
import path from "path";

const ROOT_DIR = path.join(process.cwd(), "..");

const DIRECTORIES_TO_CLEAR = [
  path.join(ROOT_DIR, "wiki"),
  path.join(ROOT_DIR, "raw", "entries"),
  path.join(ROOT_DIR, "data"),
];

const FILES_TO_DELETE = [path.join(ROOT_DIR, "wiki-config.json")];

export async function POST() {
  const removed: string[] = [];
  const errors: string[] = [];

  for (const dir of DIRECTORIES_TO_CLEAR) {
    if (!existsSync(dir)) continue;
    try {
      await rm(dir, { recursive: true, force: true });
      removed.push(path.relative(ROOT_DIR, dir));
    } catch (err) {
      errors.push(`${path.relative(ROOT_DIR, dir)}: ${String(err)}`);
    }
  }

  for (const file of FILES_TO_DELETE) {
    if (!existsSync(file)) continue;
    try {
      await unlink(file);
      removed.push(path.relative(ROOT_DIR, file));
    } catch (err) {
      errors.push(`${path.relative(ROOT_DIR, file)}: ${String(err)}`);
    }
  }

  if (errors.length > 0) {
    return NextResponse.json(
      { success: false, removed, errors },
      { status: 500 },
    );
  }

  return NextResponse.json({ success: true, removed });
}
