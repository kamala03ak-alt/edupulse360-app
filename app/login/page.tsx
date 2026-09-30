import { Suspense } from "react";

import { LoginForm } from "@/app/login/login-form";

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-6 py-12">
      <div className="grid w-full max-w-5xl overflow-hidden rounded-3xl bg-white shadow-2xl lg:grid-cols-[1.05fr_0.95fr]">
        <section className="hidden bg-indigo-600 p-12 text-white lg:block">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-indigo-200">EduPulse 360</p>
          <h1 className="mt-24 max-w-md text-4xl font-semibold leading-tight">Turn operational signals into the next right action.</h1>
          <p className="mt-6 max-w-md text-indigo-100">A secure foundation for CRM, training, finance, and action-first operations.</p>
        </section>
        <section className="p-8 sm:p-12">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-indigo-600">Welcome back</p>
          <h2 className="mt-3 text-3xl font-semibold text-slate-950">Sign in to your workspace</h2>
          <p className="mt-3 text-sm leading-6 text-slate-500">Use a Supabase Auth account provisioned by your administrator.</p>
          <div className="mt-8"><Suspense fallback={<div className="h-48 animate-pulse rounded-xl bg-slate-100" />}><LoginForm /></Suspense></div>
        </section>
      </div>
    </main>
  );
}
