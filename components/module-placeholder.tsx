export function ModulePlaceholder({ title, description }: { title: string; description: string }) {
  return <div className="mx-auto max-w-4xl"><p className="text-sm font-semibold text-indigo-600">Future module</p><h1 className="mt-2 text-3xl font-semibold tracking-tight">{title}</h1><p className="mt-3 max-w-2xl text-slate-500">{description}</p><div className="mt-8 rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-sm text-slate-500 shadow-sm">This route is intentionally prepared but not implemented in the technical-foundation phase.</div></div>;
}
