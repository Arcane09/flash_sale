import { Route, Routes, Link, Navigate, useLocation } from 'react-router-dom';
import Storefront from './pages/Storefront';
import Checkout from './pages/Checkout';
import OrderHistory from './pages/OrderHistory';
import AdminDashboard from './pages/AdminDashboard';
import Login from './pages/Login';
import { getCurrentUser } from './api/auth';

function App() {
  const user = getCurrentUser();
  const location = useLocation();

  const isActive = (path) => location.pathname === path;

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-50">
      <header className="border-b border-slate-800 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950/90 backdrop-blur">
        <div className="max-w-6xl mx-auto flex items-center justify-between px-4 py-4">
          <Link to="/" className="flex items-center gap-2">
            <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-amber-400/10 text-amber-400">
              ⚡
            </span>
            <span className="text-lg font-semibold tracking-tight">
              FlashSale
            </span>
          </Link>
          <nav className="flex items-center gap-3 text-sm">
            <Link
              to="/"
              className={`px-3 py-1.5 rounded-full transition ${
                isActive('/') ? 'bg-amber-400 text-slate-950 font-semibold' : 'text-slate-300 hover:text-white hover:bg-slate-800/70'
              }`}
            >
              Storefront
            </Link>
            {user?.role === 'admin' && (
              <Link
                to="/admin"
                className={`px-3 py-1.5 rounded-full transition ${
                  isActive('/admin')
                    ? 'bg-sky-400 text-slate-950 font-semibold'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/70'
                }`}
              >
                Admin
              </Link>
            )}
            {user && (
              <Link
                to="/orders"
                className={`hidden sm:inline-flex px-3 py-1.5 rounded-full transition ${
                  isActive('/orders')
                    ? 'bg-emerald-400 text-slate-950 font-semibold'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/70'
                }`}
              >
                My Orders
              </Link>
            )}
            <Link
              to="/login"
              className="ml-1 inline-flex items-center rounded-full border border-slate-700 px-3 py-1.5 text-xs font-medium text-slate-100 hover:bg-slate-800/80"
            >
              {user ? 'Account' : 'Login'}
            </Link>
          </nav>
        </div>
      </header>
      <main className="flex-1">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <Routes>
            <Route path="/" element={<Storefront />} />
            <Route path="/checkout/:orderId" element={<Checkout />} />
            <Route
              path="/orders"
              element={user ? <OrderHistory /> : <Navigate to="/login" />}
            />
            <Route
              path="/admin"
              element={
                user?.role === 'admin' ? (
                  <AdminDashboard />
                ) : (
                  <Navigate to="/login" />
                )
              }
            />
            <Route path="/login" element={<Login />} />
          </Routes>
        </div>
      </main>
    </div>
  );
}

export default App;
