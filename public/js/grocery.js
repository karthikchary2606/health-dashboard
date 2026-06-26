// Grocery rendering — data sourced from window.planCache.getPlan()

let _groceryPlan = null;
let _currentGroceryMonth = 0; // 0-based; set by initGrocery from plan.meta.currentMonth

async function initGrocery() {
  const plan = await window.planCache.getPlan();
  if (!plan) return;

  _groceryPlan = plan.grocery;
  _currentGroceryMonth = plan.meta.currentMonth - 1; // server is 1-based, convert to 0-based
  buildGrocery();
}

function buildGrocery() {
  if (!_groceryPlan) return;

  const sel = document.getElementById("groceryMonthSelector");
  sel.innerHTML = _groceryPlan.map((g, i) => {
    const label = g.monthLabel || `Month ${i + 1}`;
    return `<button class="month-btn${_currentGroceryMonth===i?" active":""}" onclick="selectGroceryMonth(${i})">${label}</button>`;
  }).join("");
  renderGrocery(_currentGroceryMonth);
}

function selectGroceryMonth(m) {
  _currentGroceryMonth = m;
  document.querySelectorAll("#groceryMonthSelector .month-btn").forEach((b,i) => b.classList.toggle("active", i===m));
  renderGrocery(m);
}

function renderGrocery(month) {
  if (!_groceryPlan) return;
  const g = _groceryPlan[month];
  if (!g) return;

  document.getElementById("groceryBudgetBar").innerHTML = `<div class="phase-banner" style="margin-bottom:14px"><div><h4>🛒 ${g.monthLabel} Shopping List</h4><p>Estimated monthly spend · Local Telugu market rates</p></div><div style="text-align:right"><span class="phase-pill" style="font-size:.95rem">💰 Budget: ₹${g.budget.toLocaleString("en-IN")}</span></div></div>`;

  let html = "";
  g.categories.forEach(cat => {
    html += `<div class="grocery-category"><div class="grocery-cat-title">🛍️ ${cat.name}</div><table class="grocery-table"><thead><tr><th>Item</th><th>Qty</th></tr></thead><tbody>`;
    cat.items.forEach(item => {
      const [itemName, qty = ''] = item.split(' — ');
      html += `<tr><td>${itemName}</td><td>${qty}</td></tr>`;
    });
    html += `</tbody></table></div>`;
  });
  html += `<div class="week-note" style="margin-top:16px">🏪 <strong>Shopping tip:</strong> Buy dal, rice, and dry spices in bulk monthly. Shop vegetables twice a week — Tuesdays & Saturdays from local sabzi mandi.</div>`;
  document.getElementById("groceryContent").innerHTML = html;
}

document.addEventListener('DOMContentLoaded', initGrocery);
