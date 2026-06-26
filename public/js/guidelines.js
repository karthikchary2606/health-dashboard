// Guidelines rendering — seed/supplement data sourced from window.planCache.getPlan()
// Note: seeds and supplement timing are profile-level health constants served via
// plan.guidelines (not yet in weight-loss template; kept as fallback statics below).

const SEEDS = [
  { name:"Pumpkin Seeds",    stock:250, daily:8,  note:"Highest magnesium — thyroid support" },
  { name:"Sunflower Seeds",  stock:250, daily:5,  note:"Vitamin E + selenium" },
  { name:"Flax Seeds",       stock:250, daily:5,  note:"Grind before eating for omega-3" },
  { name:"White Sesame",     stock:250, daily:4,  note:"Calcium + zinc" },
  { name:"Watermelon Seeds", stock:250, daily:4,  note:"Magnesium + iron" },
  { name:"Almonds",          stock:250, daily:2,  note:"Vitamin E + healthy fat" },
  { name:"Walnuts",          stock:250, daily:1,  note:"Best omega-3 nut for brain health" },
  { name:"Pistachios",       stock:250, daily:1,  note:"L-arginine for circulation" }
];

const SUPP_TIMING = [
  { time:"06:30 AM", item:"Thyronorm 12.5mg", note:"Strict empty stomach. 45-min wait before ANY food." },
  { time:"07:30 AM", item:"ACV (1 tsp in warm water)", note:"Boosts metabolism + liver detox + digestion." },
  { time:"04:30 PM", item:"Seed Mix + Green Tea", note:"Anti-inflammatory snack window." },
  { time:"08:30 PM", item:"Chamomile Tea", note:"Cortisol reset. Better sleep = better thyroid function." }
];

async function initGuidelines() {
  const plan = await window.planCache.getPlan();
  if (!plan) return;
  buildGuidelines();
}

function buildGuidelines() {
  const seedEl = document.getElementById("seedTracker");
  let totalDaily = 0, totalStock = 0;
  seedEl.innerHTML = SEEDS.map(s => {
    totalDaily += s.daily;
    totalStock += s.stock;
    const days = Math.floor(s.stock / s.daily);
    return `<div class="seed-bar-wrap">
      <div class="seed-label"><span>${s.name} (${s.daily}g/day)</span><span style="color:var(--text-light)">~${days}d stock · ${s.note}</span></div>
      <div class="seed-bar"><div class="seed-fill" style="width:${(s.daily/30)*100}%"></div></div>
    </div>`;
  }).join("") + `<div style="margin-top:10px;font-size:.8rem;font-weight:700;color:var(--primary)">Total: ${totalDaily}g/day ✅ (within 30g cap)</div>`;

  const suppEl = document.getElementById("suppTiming");
  suppEl.innerHTML = SUPP_TIMING.map(s =>
    `<div style="display:flex;gap:12px;padding:9px 0;border-bottom:1px solid var(--border);align-items:flex-start">
      <span style="min-width:72px;font-size:.78rem;font-weight:700;color:var(--primary)">${s.time}</span>
      <div><div style="font-size:.85rem;font-weight:600;color:var(--text)">${s.item}</div><div style="font-size:.75rem;color:var(--text-light)">${s.note}</div></div>
    </div>`
  ).join("");
}

document.addEventListener('DOMContentLoaded', initGuidelines);
