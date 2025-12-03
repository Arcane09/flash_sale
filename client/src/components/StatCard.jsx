export default function StatCard({ label, value, sublabel }) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-gradient-to-b from-slate-900 to-slate-950 px-4 py-3 shadow-sm shadow-black/50">
      <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">
        {label}
      </p>
      <p className="mt-1 text-2xl font-semibold text-slate-50">{value}</p>
      {sublabel && (
        <p className="mt-0.5 text-[11px] text-slate-500">{sublabel}</p>
      )}
    </div>
  );
}


