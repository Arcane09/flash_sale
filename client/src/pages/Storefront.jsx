import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { fetchLiveProducts } from '../api/products';
import { createHold } from '../api/orders';
import ProductCard from '../components/ProductCard';
import BuyModal from '../components/BuyModal';
import { getCurrentUser } from '../api/auth';

export default function Storefront() {
  const navigate = useNavigate();
  const [selectedProduct, setSelectedProduct] = useState(null);
  const user = getCurrentUser();
  const isAdmin = user?.role === 'admin';

  const {
    data: products,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ['live-products'],
    queryFn: fetchLiveProducts,
    refetchInterval: 7000,
  });

  const handleConfirmHold = async ({ quantity }) => {
    const result = await createHold({
      productId: selectedProduct.id,
      quantity,
    });
    setSelectedProduct(null);
    navigate(`/checkout/${result.orderId}`);
  };

  return (
    <div className="space-y-8">
      <section className="text-center space-y-2">
        <p className="inline-flex items-center gap-2 rounded-full bg-amber-400/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-amber-300">
          <span>⚡</span>
          <span>Live Flash Sales</span>
        </p>
        <h1 className="text-3xl md:text-4xl font-semibold text-slate-50 mt-3">
          Limited stock, lightning deals
        </h1>
        <p className="mt-2 text-sm text-slate-400 max-w-2xl mx-auto">
          Reserve your item for 2 minutes while you check out. Inventory and
          countdown timers update in near real-time so you never oversell.
        </p>
        <button
          type="button"
          onClick={() => refetch()}
          className="mt-4 inline-flex items-center rounded-full border border-slate-700 bg-slate-900/60 px-4 py-1.5 text-xs font-medium text-slate-100 hover:bg-slate-800/80"
        >
          Refresh
        </button>
      </section>

      {isLoading && (
        <p className="text-sm text-slate-400">Loading live products...</p>
      )}
      {isError && (
        <p className="text-sm text-rose-400">
          Failed to load products. Please try again.
        </p>
      )}

      {products && products.length === 0 && (
        <p className="text-sm text-slate-400">
          No flash sales are live right now. Check back soon.
        </p>
      )}

      {products && products.length > 0 && (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {products.map((p) => (
            <ProductCard
              key={p.id}
              product={p}
              onBuy={setSelectedProduct}
              isAdmin={isAdmin}
            />
          ))}
        </div>
      )}

      {!isAdmin && (
        <BuyModal
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
          onConfirm={handleConfirmHold}
        />
      )}
    </div>
  );
}


