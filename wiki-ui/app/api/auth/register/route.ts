import { createUser } from "@/lib/users";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const body = (await req.json()) as { username?: string; password?: string };
    const { username, password } = body;

    if (!username || typeof username !== "string" || username.trim().length < 3) {
      return NextResponse.json(
        { error: "Username must be at least 3 characters." },
        { status: 400 },
      );
    }

    if (!password || typeof password !== "string" || password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters." },
        { status: 400 },
      );
    }

    const sanitizedUsername = username.trim().toLowerCase();

    if (!/^[a-z0-9_-]+$/.test(sanitizedUsername)) {
      return NextResponse.json(
        { error: "Username may only contain letters, numbers, _ and -." },
        { status: 400 },
      );
    }

    await createUser(sanitizedUsername, password);

    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Registration failed";
    if (message === "Username already taken") {
      return NextResponse.json({ error: message }, { status: 409 });
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
