import Link from "next/link";

export default function NotFound() {
  return <main className="flex min-h-screen items-center justify-center bg-slate-950 px-6"><div className="max-w-md rounded-2xl bg-white p-8"><p className="text-sm font-semibold text-indigo-600">EduPulse 360</p><h1 className="mt-3 text-2xl font-semibold">Page not found</h1><p className="mt-3 text-sm leading-6 text-slate-600">The requested route does not exist or is not part of the current foundation scope.</p><Link href="/" className="mt-6 inline-flex rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700">Return home</Link></div></main>;
}
