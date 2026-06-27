// Grocery rendering — live data from /api/grocery/week

async function initGrocery() {
  await renderGrocery();
}

async function renderGrocery() {
  const container = document.getElementById('groceryContent');
  const totalEl   = document.getElementById('groceryNote');
  const { ok, data } = await apiFetch('/api/grocery/week');
  if (!ok || !data) {
    container.innerHTML = '<p style="color:var(--danger)">Failed to load grocery list.</p>';
    return;
  }

  let totalPrice = 0;
  let html = '';

  data.forEach(cat => {
    const visibleItems = cat.items.filter(i => !i.removed);
    if (!visibleItems.length) return;

    html += `<div class="grocery-category">
      <div class="grocery-cat-title">🛍️ ${cat.category}</div>
      <table class="grocery-table">
        <thead><tr><th>Item</th><th>Qty</th><th>Est. Price (₹)</th><th></th><th>✓</th></tr></thead>
        <tbody>`;

    visibleItems.forEach(item => {
      totalPrice += item.estimatedPriceINR || 0;
      const checked = item.purchased ? 'checked' : '';
      const rowStyle = item.purchased ? 'style="opacity:0.5;text-decoration:line-through"' : '';
      html += `<tr ${rowStyle}>
        <td>${item.name}</td>
        <td>${item.quantity || '—'}</td>
        <td>₹${(item.estimatedPriceINR || 0).toLocaleString('en-IN')}</td>
        <td><button onclick="removeGroceryItem('${item.name.replace(/'/g, "\\'")}')" style="background:none;border:none;cursor:pointer;color:var(--danger,#e53e3e);font-size:1rem" title="Remove">✕</button></td>
        <td><input type="checkbox" ${checked} onchange="toggleGroceryItem('${item.name.replace(/'/g, "\\'")}', this)"></td>
      </tr>`;
    });

    html += `</tbody></table></div>`;
  });

  container.innerHTML = html || '<p>No items in grocery list.</p>';
  if (totalEl) {
    totalEl.innerHTML = `<div style="text-align:right;font-weight:700;font-size:1rem;padding:10px 0">
      🧾 Total Estimated: ₹${totalPrice.toLocaleString('en-IN')}
    </div>`;
  }
}

async function toggleGroceryItem(name, checkbox) {
  const purchased = checkbox.checked;
  const { ok } = await apiFetch('/api/grocery/week/item', {
    method: 'PATCH',
    body: { name, purchased }
  });
  if (!ok) {
    checkbox.checked = !checkbox.checked; // revert on failure
  } else {
    const row = checkbox.closest('tr');
    if (row) {
      row.style.opacity = purchased ? '0.5' : '';
      row.style.textDecoration = purchased ? 'line-through' : '';
    }
  }
}

async function removeGroceryItem(name) {
  const { ok } = await apiFetch('/api/grocery/week/item', {
    method: 'PATCH',
    body: { name, removed: true }
  });
  if (ok) await renderGrocery();
}

async function addCustomGroceryItem() {
  const nameEl = document.getElementById('customItemInput');
  const qtyEl  = document.getElementById('customItemQty');
  const catEl  = document.getElementById('customItemCategory');
  if (!nameEl) return;

  const name     = nameEl.value.trim();
  const quantity = qtyEl ? qtyEl.value.trim() : '';
  const category = catEl ? catEl.value.trim() : 'Other';

  if (!name) { nameEl.focus(); return; }

  const { ok } = await apiFetch('/api/grocery/week/custom', {
    method: 'POST',
    body: { name, quantity, category }
  });

  if (ok) {
    nameEl.value = '';
    if (qtyEl) qtyEl.value = '';
    await renderGrocery();
  }
}

document.addEventListener('DOMContentLoaded', () => {
  initGrocery();
  const addBtn = document.getElementById('customItemAddBtn');
  if (addBtn) addBtn.addEventListener('click', addCustomGroceryItem);
});

