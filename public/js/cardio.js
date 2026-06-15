const CARDIO_TABLE = [
  { day:"Monday",    session:"Fasted Walk", duration:"20–25 min", intensity:"Light (HR 95–115)", note:"Pre-workout or standalone" },
  { day:"Tuesday",   session:"REST",        duration:"—",         intensity:"—",                 note:"Lower body day — skip cardio" },
  { day:"Wednesday", session:"Fasted Walk", duration:"25–30 min", intensity:"Moderate (HR 110–125)", note:"Active recovery day" },
  { day:"Thursday",  session:"REST",        duration:"—",         intensity:"—",                 note:"Upper pull day — skip cardio" },
  { day:"Friday",    session:"Fasted Walk", duration:"20 min",    intensity:"Light (HR 95–110)", note:"Before full body session" },
  { day:"Saturday",  session:"Brisk Walk",  duration:"30–35 min", intensity:"Moderate (HR 115–130)", note:"Dedicated cardio day" },
  { day:"Sunday",    session:"Easy Walk",   duration:"20–30 min", intensity:"Very Light (HR 90–105)", note:"Recovery — enjoy outdoors" }
];

const CARDIO_PHASES = [
  { phase:"Phase 1 (Wk 1–4)", label:"Foundation Walking", detail:"20–30 min fasted walks. HR 95–130 BPM. 4 days/week. Build aerobic base." },
  { phase:"Phase 2 (Wk 5–8)", label:"Extended + Incline",   detail:"30–40 min walks with incline/stairs. Add 1 cycling session if back allows." },
  { phase:"Phase 3 (Month 3)", label:"Interval Walking",     detail:"3 min brisk + 1 min fast-paced. 30 min. Introduces anaerobic threshold." },
  { phase:"Phase 4 (Month 4+)", label:"LISS + Light Cycling", detail:"45 min LISS cycling or swimming. Zero spinal impact. Fat burning peak." }
];

const HR_ZONES = [
  { zone:"Zone 1 – Recovery", range:"95–110 BPM", purpose:"Active recovery, fat utilization" },
  { zone:"Zone 2 – Fat Burn",  range:"110–130 BPM", purpose:"Primary fat-burning zone — TARGET" },
  { zone:"Zone 3 – Aerobic",   range:"130–150 BPM", purpose:"Cardiovascular conditioning (future)" }
];

function buildCardio() {
  const tbody = document.getElementById("cardioTableBody");
  tbody.innerHTML = CARDIO_TABLE.map(r =>
    `<tr><td><strong>${r.day}</strong></td><td>${r.session}</td><td>${r.duration}</td><td>${r.intensity}</td></tr>`
  ).join("");

  const phasesEl = document.getElementById("cardioPhases");
  phasesEl.innerHTML = (function() {
    const curM = getUserMonthIndex();
    return CARDIO_PHASES.map(function(p, i) {
      const isCurrent = i === curM;
      const isPast = i < curM;
      return '<div style="padding:10px 12px;border-radius:8px;margin-bottom:8px;background:' + (isCurrent?'#f0fdf4':isPast?'#fafafa':'#f8f9fa') + ';border:1px solid ' + (isCurrent?'#bbf7d0':isPast?'#d1fae5':'var(--border)') + '">' +
        '<div style="font-size:.8rem;font-weight:700;color:' + (isCurrent?'#166534':isPast?'#6b7280':'var(--text-med)') + '">' +
        (isCurrent ? '✅ CURRENT ' : isPast ? '✔️ Done ' : '⏳ ') + p.phase + ': ' + p.label +
        '</div><div style="font-size:.75rem;color:var(--text-light);margin-top:3px">' + p.detail + '</div></div>';
    }).join("");
  })()

  const hrEl = document.getElementById("hrZones");
  hrEl.innerHTML = HR_ZONES.map(z =>
    `<div style="display:flex;justify-content:space-between;padding:8px 10px;border-radius:6px;background:#f8fafb;margin-bottom:6px;font-size:.8rem">
      <span style="font-weight:600;color:var(--primary)">${z.zone}</span>
      <span style="color:var(--accent-dark);font-weight:700">${z.range}</span>
    </div>
    <div style="font-size:.72rem;color:var(--text-light);margin:-2px 0 6px 10px">${z.purpose}</div>`
  ).join("");
}
