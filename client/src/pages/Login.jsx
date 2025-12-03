import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { loginApi, registerApi, getCurrentUser, clearAuth } from '../api/auth';

export default function Login() {
  const navigate = useNavigate();
  const existingUser = getCurrentUser();

  const [mode, setMode] = useState(existingUser ? 'account' : 'login');
  const [email, setEmail] = useState(existingUser?.email || '');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmitAuth = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      if (mode === 'login') {
        const user = await loginApi({ email, password });
        navigate(user.role === 'admin' ? '/admin' : '/');
      } else if (mode === 'register') {
        const user = await registerApi({ email, password });
        navigate(user.role === 'admin' ? '/admin' : '/');
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    clearAuth();
    navigate('/');
    setMode('login');
  };

  if (mode === 'account' && existingUser) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="w-full max-w-md space-y-4">
          <h1 className="text-2xl font-semibold text-slate-50">Your account</h1>
          <div className="rounded-2xl border border-slate-800 bg-slate-950 p-5 shadow-lg shadow-slate-950/40">
            <p className="text-sm text-slate-200">{existingUser.email}</p>
            <p className="mt-1 text-xs text-slate-400">
              Role:{' '}
              <span className="font-medium text-sky-300">
                {existingUser.role}
              </span>
            </p>
            <div className="mt-4 flex gap-2">
              <button
                type="button"
                onClick={() => navigate('/orders')}
                className="rounded-lg border border-slate-700 px-3 py-1.5 text-xs font-medium text-slate-200 hover:bg-slate-800"
              >
                View my orders
              </button>
              {existingUser.role === 'admin' && (
                <button
                  type="button"
                  onClick={() => navigate('/admin')}
                  className="rounded-lg border border-sky-500/60 px-3 py-1.5 text-xs font-medium text-sky-300 hover:bg-sky-950/40"
                >
                  Open admin
                </button>
              )}
              <button
                type="button"
                onClick={handleLogout}
                className="ml-auto rounded-lg bg-rose-500 px-3 py-1.5 text-xs font-semibold text-slate-950 hover:bg-rose-400"
              >
                Log out
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="w-full max-w-md space-y-5">
        <div>
          <h1 className="text-2xl font-semibold text-slate-50">
            {mode === 'login' ? 'Welcome back' : 'Create an account'}
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            {mode === 'login'
              ? 'Use your email and password to enter the flash sale.'
              : 'Sign up to participate in the flash sale.'}
          </p>
        </div>

        <form onSubmit={handleSubmitAuth} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-50 focus:border-sky-500 focus:outline-none"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-50 focus:border-sky-500 focus:outline-none"
              required
            />
          </div>

          {error && (
            <p className="text-xs text-rose-400 bg-rose-950/40 border border-rose-900 rounded-md px-2 py-1">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-sky-500 px-3 py-2 text-sm font-semibold text-slate-950 shadow-sm hover:bg-sky-400 disabled:bg-slate-700 disabled:text-slate-400"
          >
            {loading
              ? 'Please wait...'
              : mode === 'login'
                ? 'Sign in'
                : 'Create account'}
          </button>
        </form>

        <button
          type="button"
          onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
          className="text-xs text-slate-400 hover:text-sky-300"
        >
          {mode === 'login'
            ? 'New here? Create an account instead.'
            : 'Already have an account? Sign in.'}
        </button>
      </div>
    </div>
  );
}


