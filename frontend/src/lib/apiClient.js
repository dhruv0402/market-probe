const BACKEND_PORT = import.meta.env.VITE_BACKEND_PORT || '8080';

export const API = import.meta.env.VITE_API_URL || (
  typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1'
    ? `${window.location.origin}/api`
    : `http://${typeof window !== 'undefined' ? window.location.hostname : '127.0.0.1'}:${BACKEND_PORT}/api`
);

export async function api(path, opts = {}) {
  const token = localStorage.getItem('mp_token');
  const res = await fetch(`${API}${path}`, {
    ...opts,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(opts.headers || {}),
    },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.detail || `Request failed (${res.status})`);
  return data;
}

export const fmt = (n) => (n == null ? '—' : Number(n).toLocaleString('en-IN', { maximumFractionDigits: 2 }));
export const inr = (n) => (n == null ? '—' : '₹' + fmt(n));
