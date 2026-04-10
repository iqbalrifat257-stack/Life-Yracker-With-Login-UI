/**
 * dashboard.js — LifeTracker Analytics Dashboard
 * Renders stats, charts, and summaries from stored data.
 */

let activePeriod = 7; // default: last 7 days

// ─── INIT ─────────────────────────────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", () => {
  applyThemeD();
  initPeriodButtons();
  renderDashboard();
  bindDashEvents();
});

function applyThemeD() {
  const s = DataManager.getSettings();
  document.body.classList.toggle("light", !s.darkMode);
  const t = document.getElementById("darkModeToggleD");
  if (t) t.checked = s.darkMode;
}

// ─── PERIOD FILTER ─────────────────────────────────────────────────────────────
function initPeriodButtons() {
  document.querySelectorAll(".period-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".period-btn").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      activePeriod = parseInt(btn.dataset.days);
      renderDashboard();
    });
  });
}

// ─── MAIN RENDER ──────────────────────────────────────────────────────────────
function renderDashboard() {
  const entries = DataManager.getLastNDays(activePeriod);
  const settings = DataManager.getSettings();

  renderStatCards(entries, settings);
  renderCharts(entries);
  renderTodaySummary();
  renderWeeklySummary(entries);
}

// ─── STAT CARDS ───────────────────────────────────────────────────────────────
function renderStatCards(entries, settings) {
  const totals = entries.map(e => ({ ...e, ...DataManager.getDailyTotals(e) }));

  // Steps
  const stepsVals = totals.filter(e => e.steps).map(e => e.steps);
  const totalSteps = stepsVals.reduce((a,b) => a+b, 0);
  const avgSteps   = stepsVals.length ? Math.round(totalSteps / stepsVals.length) : 0;
  const todayEntry = DataManager.getEntryByDate(DataManager.todayStr());
  const todaySteps = todayEntry?.steps || 0;

  setCard("cardSteps", {
    value: todaySteps.toLocaleString(),
    sub:   `Avg: ${avgSteps.toLocaleString()} / day`,
    pct:   Math.min((todaySteps / settings.stepsGoal) * 100, 100),
  });

  // Weight
  const weightVals = totals.filter(e => e.weight).map(e => e.weight);
  const latestW    = weightVals[0] || null;
  const avgW       = weightVals.length ? (weightVals.reduce((a,b) => a+b,0)/weightVals.length).toFixed(1) : "—";
  setCard("cardWeight", {
    value: latestW ?? "—",
    sub:   `Avg: ${avgW} kg over period`,
    pct:   null,
  });

  // Calories
  const calVals  = totals.map(e => e.calories);
  const avgCal   = calVals.length ? Math.round(calVals.reduce((a,b)=>a+b,0)/calVals.length) : 0;
  const todayCal = DataManager.getDailyTotals(todayEntry).calories;
  setCard("cardCal", {
    value: Math.round(todayCal).toLocaleString(),
    sub:   `Avg: ${avgCal.toLocaleString()} kcal / day`,
    pct:   Math.min((todayCal / settings.calorieGoal) * 100, 100),
  });

  // Protein
  const protVals  = totals.map(e => e.protein);
  const avgProt   = protVals.length ? (protVals.reduce((a,b)=>a+b,0)/protVals.length).toFixed(1) : 0;
  const todayProt = DataManager.getDailyTotals(todayEntry).protein;
  setCard("cardProtein", {
    value: todayProt.toFixed(1) + "g",
    sub:   `Avg: ${avgProt}g / day`,
    pct:   Math.min((todayProt / settings.proteinGoal) * 100, 100),
  });

  // Total entries
  setCard("cardDaysLogged", {
    value: entries.length,
    sub:   `Days logged in last ${activePeriod}d`,
    pct:   null,
  });

  // Mood distribution
  const moodCounts = {};
  entries.forEach(e => { if (e.mood) moodCounts[e.mood] = (moodCounts[e.mood]||0)+1; });
  const topMood = Object.entries(moodCounts).sort((a,b)=>b[1]-a[1])[0];
  const moodEmojis = { happy:"😄", focused:"🎯", neutral:"😐", tired:"😴", stressed:"😤", sad:"😔", energetic:"⚡", anxious:"😰" };
  setCard("cardMood", {
    value: topMood ? (moodEmojis[topMood[0]] || "–") : "–",
    sub:   topMood ? `Most common: ${topMood[0]} (${topMood[1]}x)` : "No moods logged",
    pct:   null,
  });
}

function setCard(id, { value, sub, pct }) {
  const card = document.getElementById(id);
  if (!card) return;
  const valEl = card.querySelector(".stat-value");
  const subEl = card.querySelector(".stat-sub");
  const bar   = card.querySelector(".stat-progress-bar");
  if (valEl) valEl.textContent = value ?? "—";
  if (subEl) subEl.textContent = sub || "";
  if (bar && pct !== null && pct !== undefined) {
    bar.style.width = `${pct.toFixed(1)}%`;
    bar.parentElement.style.display = "";
  } else if (bar) {
    bar.parentElement.style.display = "none";
  }
}

// ─── CHARTS ───────────────────────────────────────────────────────────────────
function renderCharts(entries) {
  if (!entries.length) return;

  // Sort chronologically for charts
  const sorted = [...entries].sort((a,b) => a.date.localeCompare(b.date));

  const labels   = sorted.map(e => fmtShortDate(e.date));
  const steps    = sorted.map(e => e.steps || null);
  const weights  = sorted.map(e => e.weight || null);
  const calories = sorted.map(e => {
    const t = DataManager.getDailyTotals(e);
    return Math.round(t.calories) || 0;
  });
  const protein  = sorted.map(e => {
    const t = DataManager.getDailyTotals(e);
    return Math.round(t.protein) || 0;
  });

  // Steps line chart
  Charts.drawLine(document.getElementById("chartSteps"), {
    labels,
    datasets: [{ label: "Steps", data: steps, color: Charts.colors.teal }],
  });

  // Weight line chart
  Charts.drawLine(document.getElementById("chartWeight"), {
    labels,
    datasets: [{ label: "Weight (kg)", data: weights, color: Charts.colors.blue }],
  });

  // Calories bar chart
  Charts.drawBar(document.getElementById("chartCalories"), {
    labels,
    datasets: [
      { label: "Calories (kcal)", data: calories, color: Charts.colors.orange },
      { label: "Protein (g×10)", data: protein.map(v=>v*10), color: Charts.colors.blue },
    ],
  });

  // Nutrition donut (average for period)
  const avgTotals = sorted.reduce((acc, e) => {
    const t = DataManager.getDailyTotals(e);
    acc.protein += t.protein;
    acc.carbs   += t.carbs;
    acc.fat     += t.fat;
    return acc;
  }, { protein: 0, carbs: 0, fat: 0 });

  const n = sorted.length || 1;
  Charts.drawDonut(document.getElementById("chartNutrition"), {
    labels: ["Protein", "Carbs", "Fat"],
    data:   [
      Math.round(avgTotals.protein / n),
      Math.round(avgTotals.carbs   / n),
      Math.round(avgTotals.fat     / n),
    ],
    colors: [Charts.colors.blue, Charts.colors.green, Charts.colors.orange],
  });

  // Steps vs Calorie scatter substitute — another bar
  Charts.drawBar(document.getElementById("chartProtein"), {
    labels,
    datasets: [{ label: "Protein (g)", data: protein, color: Charts.colors.blue }],
  });
}

// ─── TODAY SUMMARY ────────────────────────────────────────────────────────────
function renderTodaySummary() {
  const today   = DataManager.todayStr();
  const entry   = DataManager.getEntryByDate(today);
  const totals  = DataManager.getDailyTotals(entry);
  const settings= DataManager.getSettings();
  const wrap    = document.getElementById("todaySummary");
  if (!wrap) return;

  const moodEmojis = { happy:"😄", focused:"🎯", neutral:"😐", tired:"😴", stressed:"😤", sad:"😔", energetic:"⚡", anxious:"😰" };
  const calPct  = Math.min(Math.round((totals.calories / settings.calorieGoal)  * 100), 100);
  const stpPct  = Math.min(Math.round(((entry?.steps||0) / settings.stepsGoal) * 100), 100);
  const protPct = Math.min(Math.round((totals.protein / settings.proteinGoal)   * 100), 100);

  wrap.innerHTML = `
    <div class="card fade-in">
      <div class="card-header">
        <div class="card-title">📅 Today — ${DataManager.formatDate(today)}</div>
        ${entry?.mood ? `<span class="badge">${moodEmojis[entry.mood]||""} ${entry.mood}</span>` : ""}
      </div>
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:16px;margin-bottom:20px">
        ${goalBar("Calories", Math.round(totals.calories), settings.calorieGoal, "kcal", calPct, "var(--warning)")}
        ${goalBar("Steps",    entry?.steps||0, settings.stepsGoal,   "steps", stpPct, "var(--accent)")}
        ${goalBar("Protein",  totals.protein.toFixed(1), settings.proteinGoal, "g", protPct, "var(--accent2)")}
      </div>
      ${entry?.foods?.length ? `
        <div style="font-size:13px;color:var(--text-secondary);margin-bottom:8px;font-weight:600">
          Today's meals (${entry.foods.length} items):
        </div>
        <div style="display:flex;flex-wrap:wrap;gap:6px">
          ${entry.foods.map(f => `
            <span style="background:var(--bg-hover);border:1px solid var(--border);padding:4px 10px;border-radius:99px;font-size:12px">
              ${mealEmoji(f.mealTime)} ${escHtml(f.name)} — ${f.calories}kcal
            </span>
          `).join("")}
        </div>
      ` : `<p style="color:var(--text-muted);font-size:14px">No meals logged today. <a href="index.html">Log your first meal →</a></p>`}
    </div>
  `;
}

function goalBar(label, value, goal, unit, pct, color) {
  return `
    <div style="background:var(--bg-hover);border-radius:var(--radius-sm);padding:14px;border:1px solid var(--border)">
      <div style="font-size:11px;color:var(--text-muted);text-transform:uppercase;letter-spacing:0.5px;margin-bottom:6px">${label}</div>
      <div style="font-size:22px;font-weight:800;color:${color};letter-spacing:-0.5px">${value}<span style="font-size:12px;font-weight:500;color:var(--text-muted);margin-left:3px">${unit}</span></div>
      <div style="font-size:11px;color:var(--text-secondary);margin:4px 0">Goal: ${goal} ${unit} · ${pct}%</div>
      <div class="stat-progress" style="display:block">
        <div class="stat-progress-bar" style="width:${pct}%;background:${color}"></div>
      </div>
    </div>
  `;
}

// ─── WEEKLY SUMMARY ───────────────────────────────────────────────────────────
function renderWeeklySummary(entries) {
  const wrap = document.getElementById("weeklySummary");
  if (!wrap || !entries.length) return;

  const sorted = [...entries].sort((a,b) => b.date.localeCompare(a.date));

  // Averages
  const withSteps  = sorted.filter(e => e.steps);
  const withWeight = sorted.filter(e => e.weight);
  const avgSteps   = withSteps.length  ? Math.round(withSteps.reduce((a,e)=>a+e.steps,0)/withSteps.length) : 0;
  const avgWeight  = withWeight.length ? (withWeight.reduce((a,e)=>a+e.weight,0)/withWeight.length).toFixed(1) : "—";

  const calTotals  = sorted.map(e => DataManager.getDailyTotals(e).calories);
  const avgCal     = calTotals.length ? Math.round(calTotals.reduce((a,b)=>a+b,0)/calTotals.length) : 0;
  const totCal     = Math.round(calTotals.reduce((a,b)=>a+b,0));

  const protTotals = sorted.map(e => DataManager.getDailyTotals(e).protein);
  const avgProt    = protTotals.length ? (protTotals.reduce((a,b)=>a+b,0)/protTotals.length).toFixed(1) : 0;

  // Best day
  const bestStepDay = withSteps.reduce((best, e) => e.steps > (best?.steps||0) ? e : best, null);
  const bestCalDay  = sorted.reduce((best, e) => {
    const c = DataManager.getDailyTotals(e).calories;
    return c > DataManager.getDailyTotals(best||{}).calories ? e : (best || e);
  }, null);

  wrap.innerHTML = `
    <div class="card fade-in">
      <div class="card-header">
        <div class="card-title">📊 ${activePeriod}-Day Summary</div>
        <span class="text-muted text-sm">${sorted.length} days logged</span>
      </div>
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:14px">
        ${summaryTile("Avg Steps/day", avgSteps.toLocaleString(), "👟", "var(--accent)")}
        ${summaryTile("Avg Weight",    avgWeight + " kg",          "⚖️", "var(--accent2)")}
        ${summaryTile("Avg Calories",  avgCal + " kcal",           "🔥", "var(--warning)")}
        ${summaryTile("Total Calories",totCal.toLocaleString(),    "📊", "var(--purple)")}
        ${summaryTile("Avg Protein",   avgProt + "g",              "💪", "var(--accent2)")}
        ${summaryTile("Days Logged",   sorted.length,              "📅", "var(--accent)")}
      </div>
      ${bestStepDay ? `<div style="margin-top:16px;font-size:13px;color:var(--text-secondary)">
        🏆 Best step day: <strong style="color:var(--text-primary)">${DataManager.formatDate(bestStepDay.date)}</strong>
        — ${bestStepDay.steps.toLocaleString()} steps
      </div>` : ""}
    </div>
  `;
}

function summaryTile(label, value, emoji, color) {
  return `
    <div style="background:var(--bg-hover);border-radius:var(--radius-sm);padding:14px;border:1px solid var(--border);text-align:center">
      <div style="font-size:22px;margin-bottom:6px">${emoji}</div>
      <div style="font-size:18px;font-weight:800;color:${color}">${value}</div>
      <div style="font-size:11px;color:var(--text-muted);text-transform:uppercase;letter-spacing:0.4px;margin-top:3px">${label}</div>
    </div>
  `;
}

// ─── EXPORT ───────────────────────────────────────────────────────────────────
function exportJSONDash() {
  const json = DataManager.exportJSON();
  const blob = new Blob([json], { type: "application/json" });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement("a");
  a.href     = url;
  a.download = `lifetracker-export-${DataManager.todayStr()}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

// ─── EVENTS ───────────────────────────────────────────────────────────────────
function bindDashEvents() {
  document.getElementById("darkModeToggleD")?.addEventListener("change", () => {
    const s = DataManager.getSettings();
    s.darkMode = !s.darkMode;
    DataManager.saveSettings(s);
    document.body.classList.toggle("light", !s.darkMode);
  });

  document.getElementById("exportBtnD")?.addEventListener("click", exportJSONDash);

  document.getElementById("hamburgerD")?.addEventListener("click", () => {
    document.querySelector(".sidebar")?.classList.toggle("open");
    document.getElementById("sidebarOverlayD")?.classList.toggle("open");
  });

  document.getElementById("sidebarOverlayD")?.addEventListener("click", () => {
    document.querySelector(".sidebar")?.classList.remove("open");
    document.getElementById("sidebarOverlayD")?.classList.remove("open");
  });
}

// ─── HELPERS ──────────────────────────────────────────────────────────────────
function fmtShortDate(dateStr) {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function mealEmoji(meal) {
  return { Breakfast:"🌅", Lunch:"☀️", Dinner:"🌙", Snack:"🍎", Other:"🍽️" }[meal] || "🍽️";
}

function escHtml(str) {
  return String(str ?? "").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");
}
