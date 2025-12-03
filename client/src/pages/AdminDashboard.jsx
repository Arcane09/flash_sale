import { useQuery } from '@tanstack/react-query';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { fetchAdminMetrics, fetchAdminProducts } from '../api/products';
import StatCard from '../components/StatCard';

export default function AdminDashboard() {
  const {
    data: metrics,
    isLoading: metricsLoading,
    isError: metricsError,
  } = useQuery({
    queryKey: ['admin-metrics'],
    queryFn: fetchAdminMetrics,
    refetchInterval: 5000,
  });

  const {
    data: products,
    isLoading: productsLoading,
    isError: productsError,
  } = useQuery({
    queryKey: ['admin-products'],
    queryFn: fetchAdminProducts,
    refetchInterval: 5000,
  });

  const loading = metricsLoading || productsLoading;

  const chartData =
    products?.map((p) => ({
      name: p.name,
      pending: p.pending_qty,
      confirmed: p.confirmed_qty,
      expired: p.expired_qty,
    })) || [];

  return (
    <div className="space-y-8">
      <section className="text-center space-y-2">
        <p className="inline-flex items-center gap-2 rounded-full bg-sky-400/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-sky-300">
          <span>📊</span>
          <span>Admin Dashboard</span>
        </p>
        <h1 className="text-3xl md:text-4xl font-semibold text-slate-50 mt-2">
          Real-time inventory control
        </h1>
        <p className="mt-2 text-sm text-slate-400 max-w-2xl mx-auto">
          Monitor live stock, holds, confirmations and oversell protection.
          Metrics refresh every 5 seconds so you can see the flash sale unfold.
        </p>
      </section>

      {loading && (
        <p className="text-sm text-slate-400">Streaming live metrics...</p>
      )}
      {(metricsError || productsError) && (
        <p className="text-sm text-rose-400">
          Unable to load some admin data. Check your credentials and backend.
        </p>
      )}

      {metrics && (
        <div className="grid gap-4 md:grid-cols-4">
          <StatCard
            label="Total products"
            value={metrics.total_products}
            sublabel={`Total stock: ${metrics.total_stock}`}
          />
          <StatCard
            label="Pending holds"
            value={metrics.pending_holds.count}
            sublabel={`Units held: ${metrics.pending_holds.quantity}`}
          />
          <StatCard
            label="Confirmed orders"
            value={metrics.confirmed_orders.count}
            sublabel={`Units sold: ${metrics.confirmed_orders.quantity}`}
          />
          <StatCard
            label="Expired orders"
            value={metrics.expired_orders.count}
            sublabel={`Units released: ${metrics.expired_orders.quantity}`}
          />
        </div>
      )}

      {metrics && (
        <div className="grid gap-4 md:grid-cols-3">
          <StatCard
            label="Oversell attempts blocked"
            value={metrics.oversell_attempts_blocked}
          />
          <StatCard
            label="Inventory events"
            value={metrics.inventory_events_summary.reduce(
              (sum, e) => sum + e.count,
              0
            )}
            sublabel="Total audit trail entries"
          />
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-800 bg-gradient-to-b from-slate-900 to-slate-950 p-4">
          <h2 className="text-sm font-semibold text-slate-50">
            Holds vs confirmed vs expired
          </h2>
          <p className="mb-2 mt-1 text-xs text-slate-400">
            Per product, updated every 5 seconds.
          </p>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#9ca3af' }} />
                <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#020617',
                    borderColor: '#1f2937',
                    fontSize: 12,
                  }}
                />
                <Legend />
                <Bar dataKey="pending" stackId="a" fill="#38bdf8" />
                <Bar dataKey="confirmed" stackId="a" fill="#22c55e" />
                <Bar dataKey="expired" stackId="a" fill="#f97316" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-gradient-to-b from-slate-900 to-slate-950 p-4">
          <h2 className="text-sm font-semibold text-slate-50">
            Live inventory table
          </h2>
          <p className="mb-2 mt-1 text-xs text-slate-400">
            Including pending, confirmed, and expired quantities.
          </p>
          <div className="max-h-64 overflow-auto border border-slate-800/80 rounded-xl">
            <table className="min-w-full text-xs">
              <thead className="bg-slate-900">
                <tr className="text-[11px] uppercase tracking-wide text-slate-400">
                  <th className="px-3 py-2 text-left">Product</th>
                  <th className="px-3 py-2 text-right">Stock</th>
                  <th className="px-3 py-2 text-right">Pending</th>
                  <th className="px-3 py-2 text-right">Confirmed</th>
                  <th className="px-3 py-2 text-right">Expired</th>
                </tr>
              </thead>
              <tbody>
                {products?.map((p) => (
                  <tr
                    key={p.id}
                    className="border-t border-slate-800/80 hover:bg-slate-900/60"
                  >
                    <td className="px-3 py-1.5 text-slate-200">{p.name}</td>
                    <td className="px-3 py-1.5 text-right text-slate-200">
                      {p.total_stock}
                    </td>
                    <td className="px-3 py-1.5 text-right text-sky-300">
                      {p.pending_qty}
                    </td>
                    <td className="px-3 py-1.5 text-right text-emerald-300">
                      {p.confirmed_qty}
                    </td>
                    <td className="px-3 py-1.5 text-right text-amber-300">
                      {p.expired_qty}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}


