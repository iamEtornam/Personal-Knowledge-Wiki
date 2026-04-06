"use client";

import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/";

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const form = new FormData(e.currentTarget);
    const result = await signIn("credentials", {
      username: form.get("username"),
      password: form.get("password"),
      redirect: false,
    });

    setLoading(false);

    if (result?.error) {
      setError("Incorrect username or password.");
    } else {
      router.push(callbackUrl);
      router.refresh();
    }
  }

  return (
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
          autoComplete="current-password"
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
          style={{ color: "#b91c1c", background: "#fef2f2", border: "1px solid #fecaca" }}
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
        {loading ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}

export default function LoginPage() {
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
            Personal Wiki
          </h1>
          <p className="text-sm mt-1" style={{ color: "#6b7280" }}>
            Sign in to access your knowledge base
          </p>
        </div>

        <Suspense fallback={<div className="text-sm text-center" style={{ color: "#9ca3af" }}>Loading…</div>}>
          <LoginForm />
        </Suspense>

        <p className="text-center text-sm mt-5" style={{ color: "#9ca3af" }}>
          No account yet?{" "}
          <a href="/register" style={{ color: "#2563eb", textDecoration: "none" }}>
            Create one
          </a>
        </p>
      </div>
    </div>
  );
}
