/**
 * apiFetch — wraps fetch with auth cookie and unified response shape.
 *
 * Returns: { ok: boolean, status: number, data: any }
 *
 * Handles:
 *   401 → redirect to /login.html
 *   403 with redirect field → redirect to that path (e.g. /onboarding.html)
 *   network error → show offline toast, return { ok: false, status: 0, data: null }
 */
async function apiFetch(url, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };

  // Auto-stringify plain object bodies
  const body = options.body && typeof options.body === 'object'
    ? JSON.stringify(options.body)
    : options.body;

  let response;
  try {
    response = await fetch(url, {
      ...options,
      body,
      headers,
      credentials: 'include'  // send cookies (health_token)
    });
  } catch {
    showToast('You appear to be offline. Please check your connection.');
    return { ok: false, status: 0, data: null };
  }

  if (response.status === 401) {
    window.location.href = '/login.html';
    return { ok: false, status: 401, data: null };
  }

  let data = null;
  try { data = await response.json(); } catch { /* empty body */ }

  if (response.status === 403 && data && data.redirect) {
    window.location.href = data.redirect;
    return { ok: false, status: 403, data };
  }

  return { ok: response.ok, status: response.status, data };
}

function showToast(message) {
  const existing = document.getElementById('api-toast');
  if (existing) existing.remove();
  const toast = document.createElement('div');
  toast.id = 'api-toast';
  toast.style.cssText = 'position:fixed;bottom:20px;left:50%;transform:translateX(-50%);background:#333;color:#fff;padding:10px 20px;border-radius:6px;z-index:9999;font-size:14px;';
  toast.textContent = message;
  (document.body || document.documentElement).appendChild(toast);
  setTimeout(() => toast.remove(), 4000);
}
