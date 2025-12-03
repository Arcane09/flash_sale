import { useState } from 'react';
import { toast } from 'react-toastify';

export default function BuyModal({ product, onClose, onConfirm }) {
  const [quantity, setQuantity] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  if (!product) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await onConfirm({ quantity });
    } catch (err) {
      const status = err.response?.status;
      if (status === 401) {
        toast.error('Please login to start a hold or complete a purchase.');
        onClose();
      } else {
        setError(err.response?.data?.error || 'Failed to create hold');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-3xl border border-slate-800 bg-gradient-to-b from-slate-900 to-slate-950 p-6 shadow-2xl shadow-black/80">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-amber-300">
              Buy {product.name}
            </p>
            <h2 className="mt-1 text-lg font-semibold text-slate-50">
              Reserve this item for <span className="text-amber-300">2 minutes</span>
            </h2>
            <p className="mt-1 text-xs text-slate-400">
              Complete your details to place a temporary hold. If you don&apos;t
              confirm in time, the stock automatically returns to the pool.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-slate-700 px-2 text-xs text-slate-400 hover:bg-slate-800"
          >
            ✕
          </button>
        </div>

        <form
          onSubmit={handleSubmit}
          className="mt-5 grid gap-5 md:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]"
        >
          <div className="space-y-4">
            <div>
              <label className="block text-[11px] font-medium uppercase tracking-wide text-slate-300 mb-1">
                Quantity
              </label>
              <input
                type="number"
                min={1}
                max={product.live_stock}
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value))}
                className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-50 focus:border-amber-400 focus:outline-none"
              />
              <p className="mt-1 text-[11px] text-slate-500">
                Max available: {product.live_stock}
              </p>
            </div>

            {error && (
              <p className="text-xs text-rose-400 bg-rose-950/40 border border-rose-900 rounded-md px-2 py-1">
                {error}
              </p>
            )}

            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 rounded-xl border border-slate-700 px-3 py-2 text-xs font-medium text-slate-200 hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 rounded-xl bg-amber-400 px-3 py-2 text-xs font-semibold text-slate-950 shadow-sm hover:bg-amber-300 disabled:bg-slate-700 disabled:text-slate-400"
              >
                {submitting ? 'Reserving...' : 'Reserve for 2 Minutes'}
              </button>
            </div>
          </div>

          <div className="space-y-3 rounded-2xl border border-slate-800 bg-slate-900/70 px-4 py-3 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-slate-400 text-xs">Price per item</span>
              <span className="font-semibold text-slate-50">
                ${Number(product.price).toFixed(2)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400 text-xs">Quantity</span>
              <span className="font-semibold text-slate-50">{quantity}</span>
            </div>
            <div className="border-t border-slate-800 pt-3 flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-300">
                Total
              </span>
              <span className="text-base font-semibold text-amber-300">
                ${(Number(product.price) * quantity).toFixed(2)}
              </span>
            </div>
            <p className="pt-1 text-[11px] text-slate-500">
              Your hold will expire automatically after 2 minutes if you
              haven&apos;t confirmed the order.
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}


