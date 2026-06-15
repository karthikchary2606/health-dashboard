// Runs on every page load for index.html — redirects to login if not authenticated
let currentUser = null;

async function initAuth() {
  const res = await apiFetch('/api/auth/me');
  if (!res) return; // apiFetch handles redirect on 401
  if (!res.ok) { window.location.href = '/login.html'; return; }
  currentUser = await res.json();
  // Personalise sidebar
  const logoP = document.querySelector('.sidebar-logo p');
  if (logoP) {
    const age = currentUser.profile && currentUser.profile.age ? ` · ${currentUser.profile.age}yr` : '';
    const height = currentUser.profile && currentUser.profile.heightCm ? ` · ${currentUser.profile.heightCm}cm` : '';
    logoP.textContent = `${currentUser.name}${age}${height}`;
  }
  // Add logout button to sidebar footer
  const footer = document.querySelector('.sidebar-footer');
  if (footer) {
    footer.innerHTML = `
      <div style="margin-bottom:8px;font-size:.78rem;color:rgba(255,255,255,.5)">
        Signed in as ${currentUser.email}
      </div>
      <button onclick="logout()" style="background:rgba(255,255,255,.1);border:1px solid rgba(255,255,255,.2);color:#fff;padding:6px 12px;border-radius:6px;cursor:pointer;font-size:.78rem;width:100%">
        🚪 Sign Out
      </button>
    `;
  }
  return currentUser;
}

async function logout() {
  await apiFetch('/api/auth/logout', { method: 'POST' });
  window.location.href = '/login.html';
}

// Get phase from profile startDate (falls back to Phase 1, Week 1)
function getUserPhaseIndex() {
  if (!currentUser || !currentUser.profile || !currentUser.profile.startDate) return 0;
  const start = new Date(currentUser.profile.startDate);
  const now = new Date();
  const diffDays = Math.max(0, Math.floor((now - start) / (1000 * 60 * 60 * 24)));
  const weekNum = Math.floor(diffDays / 7);
  if (weekNum < 8) return 0;
  if (weekNum < 16) return 1;
  return 2;
}

function getUserMonthIndex() {
  if (!currentUser || !currentUser.profile || !currentUser.profile.startDate) return 0;
  const start = new Date(currentUser.profile.startDate);
  const now = new Date();
  const diffDays = Math.max(0, Math.floor((now - start) / (1000 * 60 * 60 * 24)));
  return Math.min(5, Math.floor(diffDays / 30));
}
