// Runs on every page load for index.html — redirects to login if not authenticated
let currentUser = null;

async function initAuth() {
  const { ok, data } = await apiFetch('/api/auth/me');
  if (!ok) return; // apiFetch handles redirect on 401
  currentUser = data;
  if (currentUser.profileComplete === false) {
    window._profileIncomplete = true;
    // Show a banner at the top of the page
    const banner = document.createElement('div');
    banner.id = 'profile-incomplete-banner';
    banner.style.cssText = 'position:fixed;top:0;left:0;right:0;z-index:9999;background:#f59e0b;color:#000;padding:10px 16px;font-size:.85rem;display:flex;align-items:center;justify-content:space-between;gap:12px;box-shadow:0 2px 8px rgba(0,0,0,.2)';
    banner.innerHTML = `
      <span>⚠️ Your profile is incomplete — some features are unavailable.</span>
      <a href="/onboarding.html" style="background:#000;color:#fff;padding:5px 14px;border-radius:4px;text-decoration:none;font-weight:600;font-size:.8rem;white-space:nowrap">Complete Profile →</a>
    `;
    document.body.insertBefore(banner, document.body.firstChild);
  }
  const adminLink = document.getElementById('admin-link');
  if (adminLink && currentUser.role === 'admin') adminLink.style.display = 'inline-block';
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
  // Add admin link if admin
  if (currentUser.role === 'admin') {
    const footer = document.querySelector('.sidebar-footer');
    if (footer) {
      const adminLink = document.createElement('a');
      adminLink.href = '/admin.html';
      adminLink.textContent = '⚙️ Admin Panel';
      adminLink.style.cssText = 'display:block;margin-top:8px;color:rgba(255,255,255,.6);font-size:.75rem;text-decoration:none;text-align:center;padding:4px;border-radius:4px;border:1px solid rgba(255,255,255,.15)';
      footer.appendChild(adminLink);
    }
  }
  document.body.style.visibility = 'visible';
  return currentUser;
}

async function logout() {
  await apiFetch('/api/auth/logout', { method: 'POST' });
  window.location.href = '/login.html';
}

