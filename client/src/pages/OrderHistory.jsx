import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { fetchOrders, confirmOrder } from '../api/orders';

export default function OrderHistory() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: orders, isLoading, isError } = useQuery({
    queryKey: ['orders'],
    queryFn: fetchOrders,
    refetchInterval: 15000,
  });

  const confirmMutation = useMutation({
    mutationFn: (orderId) => confirmOrder(orderId),
    onSuccess: () => {
      toast.success('Order confirmed successfully.');
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
    onError: (err) => {
      const message = err.response?.data?.error || 'Failed to confirm order';
      toast.error(message);
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
  });

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold text-slate-50">Order history</h1>
        <p className="mt-1 text-sm text-slate-400">
          Pending holds, confirmed orders, and expired reservations.
        </p>
      </div>

      {isLoading && (
        <p className="text-sm text-slate-400">Loading your orders...</p>
      )}
      {isError && (
        <p className="text-sm text-rose-400">
          Unable to load your orders right now.
        </p>
      )}

      {orders && orders.length === 0 && (
        <p className="text-sm text-slate-400">
          You haven&apos;t placed any orders yet.
        </p>
      )}

      {orders && orders.length > 0 && (() => {
        const sortedOrders = [...orders].sort((a, b) => a.id - b.id);
        return (
        <div className="overflow-hidden rounded-xl border border-slate-800 bg-slate-950">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-900">
              <tr className="text-xs uppercase tracking-wide text-slate-400">
                <th className="px-4 py-2 text-left">Order</th>
                <th className="px-4 py-2 text-left">Product</th>
                <th className="px-4 py-2 text-left">Qty</th>
                <th className="px-4 py-2 text-left">Status</th>
                <th className="px-4 py-2 text-left">Hold expires</th>
              </tr>
            </thead>
            <tbody>
              {sortedOrders.map((o) => {
                const isPending = o.status === 'pending';
                return (
                  <tr
                    key={o.id}
                    onClick={() => {
                      if (isPending) navigate(`/checkout/${o.id}`);
                    }}
                    className={`border-t border-slate-800/80 ${
                      isPending
                        ? 'hover:bg-slate-900/80 cursor-pointer'
                        : 'hover:bg-slate-900/40'
                    }`}
                  >
                    <td className="px-4 py-2 text-slate-300">#{100 + o.id}</td>
                    <td className="px-4 py-2 text-slate-200">
                      {o.product_name}
                    </td>
                    <td className="px-4 py-2 text-slate-200">{o.quantity}</td>
                    <td
                      className="px-4 py-2"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="flex items-center gap-2">
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ${
                            o.status === 'confirmed'
                              ? 'bg-emerald-500/20 text-emerald-300'
                              : o.status === 'expired'
                                ? 'bg-rose-500/20 text-rose-300'
                                : 'bg-amber-500/20 text-amber-300'
                          }`}
                        >
                          {o.status}
                        </span>
                        {isPending && (
                          <button
                            type="button"
                            onClick={() => confirmMutation.mutate(o.id)}
                            disabled={confirmMutation.isPending}
                            className="rounded-full border border-emerald-400/70 px-2 py-0.5 text-[10px] font-medium text-emerald-300 hover:bg-emerald-500/15 disabled:opacity-60"
                          >
                            Confirm
                          </button>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-2 text-xs text-slate-400">
                      {new Date(o.hold_expires_at).toLocaleTimeString()}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        );
      })()}
    </div>
  );
}


