"use client";

export default function Error({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <main className="flex min-h-screen items-center justify-center bg-slate-950 px-6"><div className="max-w-md rounded-2xl bg-white p-8"><h1 className="text-xl font-semibold text-slate-950">EduPulse 360 is temporarily unavailable</h1><p className="mt-3 text-sm leading-6 text-slate-600">Please retry. If this continues, check the configured Supabase environment and server logs.</p><button type="button" onClick={() => reset()} className="mt-6 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700">Try again</button></div></main>;
}
