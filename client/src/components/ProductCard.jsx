import Countdown from './Countdown';

export default function ProductCard({ product, onBuy, isAdmin = false }) {
  const percent = product.percent_sold ?? 0;
  const totalStock = product.total_stock ?? product.live_stock ?? 0;

  return (
    <div className="group flex flex-col rounded-3xl border border-slate-800/80 bg-gradient-to-b from-slate-900/90 to-slate-950/90 p-5 shadow-xl shadow-black/50 transition hover:-translate-y-0.5 hover:border-amber-400/70 hover:shadow-amber-900/40">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <h3 className="text-base font-semibold text-slate-50">
            {product.name}
          </h3>
          <p className="text-xs text-slate-400 line-clamp-2">
            {product.description}
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
            Starting at
          </p>
          <p className="text-xl font-semibold text-amber-300">
            ${Number(product.price).toFixed(2)}
          </p>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <div className="rounded-2xl bg-slate-900/80 px-3 py-3 border border-slate-800">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
            Sale ends in
          </p>
          <p className="mt-2 text-lg font-semibold">
            <Countdown to={product.sale_ends_at} />
          </p>
        </div>
        <div className="rounded-2xl bg-slate-900/80 px-3 py-3 border border-slate-800 text-right">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
            Stock remaining
          </p>
          <p className="mt-2 text-sm font-semibold text-emerald-400">
            {product.live_stock} / {totalStock}
          </p>
        </div>
      </div>

      <div className="mt-4">
        <div className="h-1.5 rounded-full bg-slate-800 overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-emerald-400 via-amber-400 to-pink-500"
            style={{ width: `${Math.min(100, percent)}%` }}
          />
        </div>
        <p className="mt-1 text-[11px] text-slate-400">
          {percent}% of initial stock reserved or sold
        </p>
      </div>

      <button
        type="button"
        onClick={() => {
          if (!isAdmin && product.live_stock > 0 && onBuy) onBuy(product);
        }}
        className="mt-4 inline-flex w-full items-center justify-center rounded-2xl bg-amber-400 px-3 py-2 text-sm font-semibold text-slate-950 shadow-sm shadow-amber-900/40 hover:bg-amber-300 disabled:bg-slate-700 disabled:text-slate-400 disabled:cursor-not-allowed"
        disabled={product.live_stock <= 0 || isAdmin}
      >
        {product.live_stock <= 0
          ? 'Sold Out'
          : isAdmin
            ? 'Admin View Only'
            : 'Buy Now'}
      </button>
    </div>
  );
}


