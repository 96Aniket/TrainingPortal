"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

import {
  ShieldCheck,
  Mail,
  ArrowRight,
  Loader2,
} from "lucide-react";

import { login } from "@/services/api/authApi";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  const handleLogin = async (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    setError("");

    if (!email.trim()) {
      setError("Email is required.");
      return;
    }

    try {
      setLoading(true);

      await login(email);

      router.replace("/dashboard");

    } catch (err: any) {
      console.error(err);

      const message =
        err?.response?.data?.detail ||
        "Login failed.";

      setError(
        Array.isArray(message)
          ? "Login failed."
          : message
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-slate-50 via-white to-indigo-50 px-6 py-10">

      {/* Background decoration */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-24 -top-24 h-72 w-72 rounded-full bg-indigo-200/30 blur-3xl" />
        <div className="absolute -bottom-24 -right-24 h-72 w-72 rounded-full bg-violet-200/30 blur-3xl" />
        <div className="absolute left-1/2 top-1/3 h-56 w-56 -translate-x-1/2 rounded-full bg-blue-100/20 blur-3xl" />
      </div>

      {/* Login Card */}
      <div className="relative z-10 w-full max-w-md">

        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl shadow-indigo-100/60">

          {/* Brand Header */}
          <div className="border-b border-slate-200 bg-gradient-to-r from-indigo-50 via-white to-blue-50 px-8 py-8">

            <div className="flex flex-col items-center text-center">

              {/* Logo */}
              <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-600 via-violet-600 to-blue-600 text-white shadow-lg shadow-indigo-200">
                <ShieldCheck
                  size={32}
                  strokeWidth={2.2}
                />
              </div>

              {/* Title */}
              <h1 className="bg-gradient-to-r from-indigo-700 via-violet-600 to-blue-600 bg-clip-text text-3xl font-extrabold tracking-tight text-transparent">
                Training Portal
              </h1>

              <p className="mt-2 text-sm font-medium text-slate-500">
                Management System
              </p>

            </div>

          </div>

          {/* Login Content */}
          <div className="p-8">

            <div className="mb-7">
              <h2 className="text-xl font-extrabold text-slate-900">
                Welcome back
              </h2>

              <p className="mt-1 text-sm font-medium text-slate-500">
                Sign in to manage training activities.
              </p>
            </div>

            {/* Error */}
            {error && (
              <div className="mb-6 flex items-start gap-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3.5 text-sm font-medium text-rose-700 shadow-sm">

                <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-rose-100">
                  <span className="text-xs font-extrabold">
                    !
                  </span>
                </div>

                <p>{error}</p>

              </div>
            )}

            {/* Form */}
            <form
              onSubmit={handleLogin}
              className="space-y-6"
            >

              {/* Email */}
              <div>

                <label
                  htmlFor="email"
                  className="mb-2 block text-sm font-bold text-slate-700"
                >
                  Email Address
                </label>

                <div className="relative">

                  <Mail
                    size={18}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-indigo-400"
                  />

                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(event) =>
                      setEmail(
                        event.target.value
                      )
                    }
                    placeholder="your.email@company.com"
                    required
                    autoComplete="email"
                    disabled={loading}
                    className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-11 pr-4 text-sm font-medium text-slate-700 shadow-sm outline-none transition-all placeholder:text-slate-400 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:opacity-70"
                  />

                </div>

              </div>

              {/* Sign In */}
              <button
                type="submit"
                disabled={loading}
                className="group flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 via-violet-600 to-blue-600 px-5 py-3.5 text-sm font-bold text-white shadow-lg shadow-indigo-200 transition-all hover:-translate-y-0.5 hover:shadow-xl hover:shadow-indigo-300 disabled:cursor-not-allowed disabled:opacity-60"
              >

                {loading ? (
                  <>
                    <Loader2
                      size={18}
                      className="animate-spin"
                    />

                    Signing in...
                  </>
                ) : (
                  <>
                    Sign In

                    <ArrowRight
                      size={18}
                      className="transition-transform duration-200 group-hover:translate-x-0.5"
                    />
                  </>
                )}

              </button>

            </form>

          </div>

          {/* Footer */}
          <div className="border-t border-slate-200 bg-slate-50/70 px-8 py-4 text-center">
            <p className="text-xs font-medium text-slate-400">
              Training Portal Management System
            </p>
          </div>

        </div>

      </div>

    </main>
  );
}