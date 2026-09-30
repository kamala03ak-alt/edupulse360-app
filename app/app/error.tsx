"use client";

export default function Error({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <div className="mx-auto max-w-xl rounded-2xl border border-rose-200 bg-rose-50 p-6"><h2 className="text-lg font-semibold text-rose-900">Something went wrong</h2><p className="mt-2 text-sm text-rose-700">We could not load this workspace view. Your session and data remain protected.</p><button type="button" onClick={() => reset()} className="mt-5 rounded-lg bg-rose-700 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-800">Try again</button></div>;
}
