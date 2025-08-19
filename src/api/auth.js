// Simple auth API helper
// Uses NEXT_PUBLIC_API_BASE_URL from .env (Vite exposes as import.meta.env.NEXT_PUBLIC_API_BASE_URL)

export async function loginRequest({ CanteenId, Password }) {
  // Vite exposes only variables prefixed with VITE_. If you used NEXT_PUBLIC_ rename it to VITE_ in .env
  const base = import.meta.env.NEXT_PUBLIC_API_BASE_URL || import.meta.env.VITE_API_BASE_URL || '';
  if (!base) {
    console.warn('Base URL missing: define NEXT_PUBLIC_API_BASE_URL or VITE_API_BASE_URL in .env');
  }
  const url = base.replace(/\/$/, '') + '/api/Canteen/auth/login';
  let data;
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ CanteenId, Password })
    });
    const text = await res.text();
    try { data = text ? JSON.parse(text) : {}; } catch (e) { throw new Error('Invalid JSON response: ' + text); }
    if (!res.ok || data.code !== 1) {
      throw new Error(data?.message || `Login failed (status ${res.status})`);
    }
    return data; // { code, message, token }
  } catch (err) {
    console.error('Login request failed', err);
    throw err;
  }
}

export function storeToken(token) {
  localStorage.setItem('authToken', token);
}

export function getToken() {
  return localStorage.getItem('authToken');
}

export function clearToken() {
  localStorage.removeItem('authToken');
}
