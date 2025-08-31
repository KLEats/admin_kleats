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

// --- Utilities to inspect token expiry / validity ---
// parseJwtPayload: best-effort decode of JWT payload (returns object or null)
export function parseJwtPayload(token) {
  if (!token || typeof token !== 'string') return null;
  const parts = token.split('.');
  if (parts.length < 2) return null;
  try {
    const payload = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const json = decodeURIComponent(atob(payload).split('').map(function(c) {
      return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
    return JSON.parse(json);
  } catch (e) {
    return null;
  }
}

// getTokenExpiryFromJwt: returns expiry in milliseconds since epoch, or null
export function getTokenExpiryFromJwt(token) {
  const p = parseJwtPayload(token);
  if (!p) return null;
  const exp = p.exp ?? p.expiry;
  if (!exp) return null;
  // exp may be in seconds or milliseconds
  const maybeMs = (exp > 1e12) ? exp : (exp * 1000);
  if (typeof maybeMs === 'number' && !Number.isNaN(maybeMs)) return maybeMs;
  return null;
}

// isTokenExpired: returns true if expired, false if valid, or null if unknown (no exp claim)
export function isTokenExpired(token) {
  const t = token || getToken();
  if (!t) return true; // no token -> treat as expired/not valid
  const expiryMs = getTokenExpiryFromJwt(t);
  if (expiryMs === null) return null; // unknown
  return Date.now() > expiryMs;
}

// isTokenValid: returns true if token appears valid (not expired), false if expired or missing, null if unknown
export function isTokenValid(token) {
  const t = token || getToken();
  if (!t) return false;
  const expired = isTokenExpired(t);
  if (expired === null) return null;
  return expired === false;
}
