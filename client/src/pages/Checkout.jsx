import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchOrder, confirmOrder } from '../api/orders';
import Countdown from '../components/Countdown';

export default function Checkout() {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [error, setError] = useState(null);

  const {
    data: order,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['order', orderId],
    queryFn: () => fetchOrder(orderId),
    refetchInterval: 10000,
  });

  const confirmMutation = useMutation({
    mutationFn: () => confirmOrder(orderId),
    onSuccess: () => {
      queryClient.invalidateQueries(['order', orderId]);
      queryClient.invalidateQueries(['orders']);
    },
    onError: (err) => {
      setError(err.response?.data?.error || 'Failed to confirm order');
    },
  });

  const holdExpired =
    order && new Date(order.hold_expires_at).getTime() < Date.now();

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-50">Checkout</h1>
        <p className="mt-1 text-sm text-slate-400">
          Complete your purchase before the hold expires.
        </p>
      </div>

      {isLoading && (
        <p className="text-sm text-slate-400">Loading order details...</p>
      )}
      {isError && (
        <p className="text-sm text-rose-400">
          Unable to load this order. It may not exist.
        </p>
      )}

      {order && (
        <div className="rounded-2xl border border-slate-800 bg-slate-950 p-5 shadow-lg shadow-slate-950/40">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-base font-semibold text-slate-50">
                {order.product_name}
              </h2>
              <p className="mt-1 text-xs text-slate-400">
                Order #{order.id} • Placed{' '}
                {new Date(order.created_at).toLocaleTimeString()}
              </p>
            </div>
            <div className="text-right text-sm">
              <p className="font-semibold text-slate-50">
                Qty: <span className="text-sky-400">{order.quantity}</span>
              </p>
              <p className="mt-1 text-xs text-slate-400">
                Price:{' '}
                <span className="font-semibold text-emerald-400">
                  ${Number(order.price || 0).toFixed(2)}
                </span>
              </p>
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between rounded-xl bg-slate-900 px-4 py-3">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                Hold countdown
              </p>
              <p className="mt-0.5 text-sm font-semibold">
                <Countdown to={order.hold_expires_at} />
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                Status
              </p>
              <p className="mt-0.5 text-sm font-semibold text-sky-300">
                {order.status}
              </p>
            </div>
          </div>

          {error && (
            <p className="mt-3 text-xs text-rose-400 bg-rose-950/40 border border-rose-900 rounded-md px-2 py-1">
              {error}
            </p>
          )}

          <div className="mt-5 flex justify-between gap-3">
            <button
              type="button"
              onClick={() => navigate('/')}
              className="rounded-lg border border-slate-700 px-3 py-1.5 text-xs font-medium text-slate-200 hover:bg-slate-800"
            >
              Back to store
            </button>
            <button
              type="button"
              onClick={() => confirmMutation.mutate()}
              disabled={confirmMutation.isLoading || order.status === 'confirmed' || holdExpired}
              className="rounded-lg bg-emerald-500 px-4 py-1.5 text-xs font-semibold text-slate-950 shadow-sm hover:bg-emerald-400 disabled:bg-slate-700 disabled:text-slate-400"
            >
              {order.status === 'confirmed'
                ? 'Order Confirmed'
                : holdExpired
                  ? 'Hold Expired'
                  : confirmMutation.isLoading
                    ? 'Confirming...'
                    : 'Confirm Order'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}


