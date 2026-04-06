"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function RegisterPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const form = new FormData(e.currentTarget);
    const username = form.get("username") as string;
    const password = form.get("password") as string;
    const confirm = form.get("confirm") as string;

    if (password !== confirm) {
      setError("Passwords do not match.");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = (await res.json()) as { error?: string };

      if (!res.ok) {
        setError(data.error ?? "Registration failed.");
      } else {
        setSuccess(true);
        setTimeout(() => router.push("/login"), 2000);
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: "var(--wiki-surface)" }}
      >
        <div className="text-center" style={{ maxWidth: 360 }}>
          <div
            className="inline-flex items-center justify-center w-12 h-12 rounded-full mb-4"
            style={{ background: "#dcfce7" }}
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#16a34a"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <h2 className="text-lg font-semibold mb-1" style={{ color: "#111827" }}>
            Account created
          </h2>
          <p className="text-sm" style={{ color: "#6b7280" }}>
            Redirecting you to sign in…
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center"
      style={{ background: "var(--wiki-surface)" }}
    >
      <div
        className="w-full max-w-sm rounded-xl shadow-sm"
        style={{
          background: "#fff",
          border: "1px solid #e5e7eb",
          padding: "2.5rem 2rem",
        }}
      >
        <div className="mb-8 text-center">
          <div
            className="inline-flex items-center justify-center w-12 h-12 rounded-full mb-4"
            style={{ background: "#dbeafe" }}
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#2563eb"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
              <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
            </svg>
          </div>
          <h1
            className="text-2xl font-semibold"
            style={{ fontFamily: "var(--font-raleway), sans-serif", color: "#111827" }}
          >
            Create account
          </h1>
          <p className="text-sm mt-1" style={{ color: "#6b7280" }}>
            Set up access to your personal wiki
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="username"
              className="block text-sm font-medium mb-1"
              style={{ color: "#374151" }}
            >
              Username
            </label>
            <input
              id="username"
              name="username"
              type="text"
              autoComplete="username"
              required
              autoFocus
              placeholder="e.g. alex"
              className="w-full px-3 py-2 rounded-md border text-sm outline-none transition-all"
              style={{
                borderColor: "#d1d5db",
                background: "#fff",
                color: "#111827",
              }}
              onFocus={(e) => (e.currentTarget.style.borderColor = "#3b82f6")}
              onBlur={(e) => (e.currentTarget.style.borderColor = "#d1d5db")}
            />
            <p className="text-xs mt-1" style={{ color: "#9ca3af" }}>
              Letters, numbers, _ and - only. Min 3 characters.
            </p>
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium mb-1"
              style={{ color: "#374151" }}
            >
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="new-password"
              required
              className="w-full px-3 py-2 rounded-md border text-sm outline-none transition-all"
              style={{
                borderColor: "#d1d5db",
                background: "#fff",
                color: "#111827",
              }}
              onFocus={(e) => (e.currentTarget.style.borderColor = "#3b82f6")}
              onBlur={(e) => (e.currentTarget.style.borderColor = "#d1d5db")}
            />
            <p className="text-xs mt-1" style={{ color: "#9ca3af" }}>
              Min 8 characters.
            </p>
          </div>

          <div>
            <label
              htmlFor="confirm"
              className="block text-sm font-medium mb-1"
              style={{ color: "#374151" }}
            >
              Confirm password
            </label>
            <input
              id="confirm"
              name="confirm"
              type="password"
              autoComplete="new-password"
              required
              className="w-full px-3 py-2 rounded-md border text-sm outline-none transition-all"
              style={{
                borderColor: "#d1d5db",
                background: "#fff",
                color: "#111827",
              }}
              onFocus={(e) => (e.currentTarget.style.borderColor = "#3b82f6")}
              onBlur={(e) => (e.currentTarget.style.borderColor = "#d1d5db")}
            />
          </div>

          {error && (
            <p
              className="text-sm py-2 px-3 rounded-md"
              style={{
                color: "#b91c1c",
                background: "#fef2f2",
                border: "1px solid #fecaca",
              }}
            >
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 px-4 rounded-md text-sm font-medium transition-opacity"
            style={{
              background: loading ? "#93c5fd" : "#2563eb",
              color: "#fff",
              cursor: loading ? "not-allowed" : "pointer",
              border: "none",
            }}
          >
            {loading ? "Creating account…" : "Create account"}
          </button>

          <p className="text-center text-sm" style={{ color: "#9ca3af" }}>
            Already have an account?{" "}
            <a
              href="/login"
              style={{ color: "#2563eb", textDecoration: "none" }}
            >
              Sign in
            </a>
          </p>
        </form>
      </div>
    </div>
  );
}
