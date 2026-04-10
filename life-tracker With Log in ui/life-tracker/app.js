/**
 * app.js — LifeTracker Main Application Logic
 * Handles UI interactions for the daily log page.
 */

// ─── STATE ────────────────────────────────────────────────────────────────────
let currentDate   = DataManager.todayStr();
let currentEntry  = null;
let selectedMood  = null;
let acIndex       = -1;      // autocomplete selection index
let acItems       = [];      // current autocomplete items
let selectedFood  = null;    // food selected from autocomplete
let editingFoodId = null;    // if we're editing a food entry

// ─── INIT ─────────────────────────────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", () => {
  applyTheme();
  initDatePicker();
  loadEntry(currentDate);
  bindEvents();
  initAutocomplete();
});

// ─── THEME ────────────────────────────────────────────────────────────────────
function applyTheme() {
  const s = DataManager.getSettings();
  document.body.classList.toggle("light", !s.darkMode);
  const toggle = document.getElementById("darkModeToggle");
  if (toggle) toggle.checked = s.darkMode;
}

function toggleDarkMode() {
  const s = DataManager.getSettings();
  s.darkMode = !s.darkMode;
  DataManager.saveSettings(s);
  document.body.classList.toggle("light", !s.darkMode);
}

// ─── DATE PICKER ──────────────────────────────────────────────────────────────
function initDatePicker() {
  const dp = document.getElementById("datePicker");
  if (!dp) return;
  dp.value = currentDate;
  dp.max   = DataManager.todayStr();
  dp.addEventListener("change", () => {
    currentDate = dp.value;
    loadEntry(currentDate);
  });
  document.getElementById("btnToday")?.addEventListener("click", () => {
    currentDate = DataManager.todayStr();
    dp.value    = currentDate;
    loadEntry(currentDate);
  });
}

// ─── LOAD ENTRY FOR DATE ──────────────────────────────────────────────────────
function loadEntry(date) {
  currentEntry = DataManager.getEntryByDate(date);
  if (!currentEntry) {
    currentEntry = DataManager.createEntry(date);
  }

  // Populate steps & weight
  const stepsEl  = document.getElementById("inSteps");
  const weightEl = document.getElementById("inWeight");
  if (stepsEl)  stepsEl.value  = currentEntry.steps  ?? "";
  if (weightEl) weightEl.value = currentEntry.weight ?? "";

  // Populate mood
  selectedMood = currentEntry.mood || null;
  renderMoodPicker();

  // Render food list
  renderFoodLog();

  // Update label
  const lbl = document.getElementById("currentDateLabel");
  if (lbl) lbl.textContent = DataManager.formatDate(date);
}

// ─── SAVE VITALS ──────────────────────────────────────────────────────────────
function saveVitals() {
  const steps  = parseFloat(document.getElementById("inSteps")?.value)  || null;
  const weight = parseFloat(document.getElementById("inWeight")?.value) || null;

  currentEntry.steps  = steps;
  currentEntry.weight = weight;
  currentEntry.mood   = selectedMood;
  currentEntry.date   = currentDate;

  DataManager.upsertEntry(currentEntry);
  showToast("✓ Daily vitals saved!", "success");
  renderFoodLog(); // refresh totals
}

// ─── MOOD PICKER ──────────────────────────────────────────────────────────────
const MOODS = [
  { key: "happy",    emoji: "😄", label: "Happy"    },
  { key: "focused",  emoji: "🎯", label: "Focused"  },
  { key: "neutral",  emoji: "😐", label: "Neutral"  },
  { key: "tired",    emoji: "😴", label: "Tired"    },
  { key: "stressed", emoji: "😤", label: "Stressed" },
  { key: "sad",      emoji: "😔", label: "Sad"      },
  { key: "energetic",emoji: "⚡", label: "Energetic"},
  { key: "anxious",  emoji: "😰", label: "Anxious"  },
];

function renderMoodPicker() {
  const wrap = document.getElementById("moodPicker");
  if (!wrap) return;
  wrap.innerHTML = "";
  MOODS.forEach(m => {
    const btn = document.createElement("button");
    btn.className = "mood-btn" + (selectedMood === m.key ? " selected" : "");
    btn.innerHTML = `<span>${m.emoji}</span>${m.label}`;
    btn.onclick = () => {
      selectedMood = selectedMood === m.key ? null : m.key;
      renderMoodPicker();
    };
    wrap.appendChild(btn);
  });
}

// ─── FOOD LOG ─────────────────────────────────────────────────────────────────
function renderFoodLog() {
  const tbody = document.getElementById("foodTbody");
  const totEl = document.getElementById("totalsCal");
  if (!tbody) return;

  const foods = currentEntry?.foods || [];
  const totals = DataManager.getDailyTotals(currentEntry);

  if (!foods.length) {
    tbody.innerHTML = `<tr><td colspan="8" style="text-align:center;padding:32px;color:var(--text-muted)">
      No food logged yet for this day — use the form below to add meals.
    </td></tr>`;
  } else {
    tbody.innerHTML = foods.map(f => `
      <tr data-id="${f.id}">
        <td>
          <span class="meal-badge" style="background:${mealColor(f.mealTime)}20;color:${mealColor(f.mealTime)}">
            ${mealEmoji(f.mealTime)} ${f.mealTime || "—"}
          </span>
        </td>
        <td><strong>${escHtml(f.name)}</strong></td>
        <td class="nutrient-col">${f.quantity} ${f.unit}</td>
        <td class="nutrient-col"><strong style="color:var(--warning)">${f.calories}</strong></td>
        <td class="nutrient-col" style="color:#60a5fa">${f.protein}g</td>
        <td class="nutrient-col" style="color:#4ade80">${f.carbs}g</td>
        <td class="nutrient-col" style="color:#fb923c">${f.fat}g</td>
        <td>
          <div class="flex gap-2">
            <button class="btn btn-sm btn-secondary btn-icon" onclick="editFood('${f.id}')" title="Edit">✏️</button>
            <button class="btn btn-sm btn-danger btn-icon" onclick="deleteFood('${f.id}')" title="Delete">🗑️</button>
          </div>
        </td>
      </tr>
    `).join("");
  }

  // Totals row
  if (totEl) {
    totEl.innerHTML = `
      <strong style="color:var(--warning)">${totals.calories.toFixed(0)}</strong> kcal &nbsp;|&nbsp;
      <span style="color:#60a5fa">${totals.protein.toFixed(1)}g protein</span> &nbsp;|&nbsp;
      <span style="color:#4ade80">${totals.carbs.toFixed(1)}g carbs</span> &nbsp;|&nbsp;
      <span style="color:#fb923c">${totals.fat.toFixed(1)}g fat</span>
    `;
  }

  // Macro bar
  renderMacroBar(totals);
}

function mealColor(meal) {
  const map = { Breakfast:"#fbbf24", Lunch:"#4ade80", Dinner:"#60a5fa", Snack:"#a78bfa", Other:"#8892a4" };
  return map[meal] || map.Other;
}

function mealEmoji(meal) {
  const map = { Breakfast:"🌅", Lunch:"☀️", Dinner:"🌙", Snack:"🍎", Other:"🍽️" };
  return map[meal] || map.Other;
}

function renderMacroBar(totals) {
  const wrap = document.getElementById("macroBarWrap");
  if (!wrap) return;
  const { calories, protein, carbs, fat } = totals;
  const total = protein + carbs + fat || 1;

  wrap.innerHTML = `
    <div class="macro-labels">
      <div class="macro-label"><span>${protein.toFixed(1)}g</span>Protein</div>
      <div class="macro-label" style="text-align:center"><span>${calories.toFixed(0)}</span>kcal total</div>
      <div class="macro-label" style="text-align:right"><span>${carbs.toFixed(1)}g</span>Carbs</div>
      <div class="macro-label" style="text-align:right"><span>${fat.toFixed(1)}g</span>Fat</div>
    </div>
    <div class="macro-bar">
      <div class="macro-seg" style="background:#60a5fa;width:${(protein/total*100).toFixed(1)}%"></div>
      <div class="macro-seg" style="background:#4ade80;width:${(carbs/total*100).toFixed(1)}%"></div>
      <div class="macro-seg" style="background:#fb923c;width:${(fat/total*100).toFixed(1)}%"></div>
    </div>
    <div class="flex justify-between mt-2" style="font-size:11px;color:var(--text-muted)">
      <span>🔵 Protein ${(protein/total*100).toFixed(0)}%</span>
      <span>🟢 Carbs ${(carbs/total*100).toFixed(0)}%</span>
      <span>🟠 Fat ${(fat/total*100).toFixed(0)}%</span>
    </div>
  `;
}

// ─── FOOD AUTOCOMPLETE ────────────────────────────────────────────────────────
function initAutocomplete() {
  const input = document.getElementById("foodSearch");
  const list  = document.getElementById("acList");
  if (!input || !list) return;

  input.addEventListener("input", () => {
    const q = input.value.trim().toLowerCase();
    if (!q) { closeAC(); return; }

    const allFoods = DataManager.getAllFoods();
    acItems = Object.keys(allFoods).filter(name =>
      name.toLowerCase().includes(q)
    ).slice(0, 15);

    if (!acItems.length) { closeAC(); return; }

    list.innerHTML = acItems.map((name, i) => {
      const f = allFoods[name];
      return `<div class="autocomplete-item" data-index="${i}" onclick="selectFood('${escAttr(name)}')">
        <span>${escHtml(name)}</span>
        <span class="food-macros">${f.cal} kcal · P:${f.protein}g · C:${f.carbs}g · F:${f.fat}g</span>
      </div>`;
    }).join("");

    list.classList.add("open");
    acIndex = -1;
  });

  input.addEventListener("keydown", (e) => {
    if (!list.classList.contains("open")) return;
    if (e.key === "ArrowDown") { acIndex = Math.min(acIndex + 1, acItems.length - 1); highlightAC(); e.preventDefault(); }
    if (e.key === "ArrowUp")   { acIndex = Math.max(acIndex - 1, 0); highlightAC(); e.preventDefault(); }
    if (e.key === "Enter" && acIndex >= 0) { selectFood(acItems[acIndex]); e.preventDefault(); }
    if (e.key === "Escape") closeAC();
  });

  document.addEventListener("click", (e) => {
    if (!e.target.closest(".autocomplete-wrap")) closeAC();
  });
}

function highlightAC() {
  document.querySelectorAll(".autocomplete-item").forEach((el, i) => {
    el.classList.toggle("highlighted", i === acIndex);
  });
}

function closeAC() {
  document.getElementById("acList")?.classList.remove("open");
  acItems = [];
  acIndex = -1;
}

function selectFood(name) {
  selectedFood = name;
  document.getElementById("foodSearch").value = name;
  closeAC();
  updateNutritionPreview();
}

function updateNutritionPreview() {
  const qty    = parseFloat(document.getElementById("foodQty")?.value) || 100;
  const unit   = document.getElementById("foodUnit")?.value || "g";
  const name   = selectedFood || document.getElementById("foodSearch")?.value;
  if (!name) return;

  const allFoods = DataManager.getAllFoods();
  if (!allFoods[name]) {
    document.getElementById("nutritionPreview").style.display = "none";
    return;
  }

  const n = DataManager.calcNutrition(name, qty, unit);
  const prev = document.getElementById("nutritionPreview");
  if (!prev) return;
  prev.style.display = "flex";
  prev.innerHTML = `
    <div class="hstat"><div class="hstat-val" style="color:var(--warning)">${n.calories}</div><div class="hstat-lbl">kcal</div></div>
    <div class="hstat"><div class="hstat-val" style="color:#60a5fa">${n.protein}g</div><div class="hstat-lbl">protein</div></div>
    <div class="hstat"><div class="hstat-val" style="color:#4ade80">${n.carbs}g</div><div class="hstat-lbl">carbs</div></div>
    <div class="hstat"><div class="hstat-val" style="color:#fb923c">${n.fat}g</div><div class="hstat-lbl">fat</div></div>
  `;
}

// ─── ADD / EDIT FOOD ──────────────────────────────────────────────────────────
function addFood() {
  const name  = selectedFood || document.getElementById("foodSearch")?.value?.trim();
  const qty   = parseFloat(document.getElementById("foodQty")?.value);
  const unit  = document.getElementById("foodUnit")?.value || "g";
  const meal  = document.getElementById("foodMeal")?.value || "Other";

  if (!name) return showToast("Please enter a food name", "error");
  if (!qty || qty <= 0) return showToast("Please enter a valid quantity", "error");

  // Check if custom food (not in DB) — if manual macros provided, save it
  const allFoods = DataManager.getAllFoods();
  let nutrition;

  if (!allFoods[name]) {
    // Check if manual macros are provided
    const manCal  = parseFloat(document.getElementById("manCal")?.value);
    const manProt = parseFloat(document.getElementById("manProt")?.value);
    const manCarb = parseFloat(document.getElementById("manCarb")?.value);
    const manFat  = parseFloat(document.getElementById("manFat")?.value);

    if (!isNaN(manCal)) {
      // Save as custom food per 100g
      const factor = 100 / (UNIT_TO_GRAMS[unit]?.(qty) || qty);
      DataManager.saveCustomFood(name, {
        cal:     Math.round(manCal  * factor),
        protein: Math.round(manProt * factor * 10) / 10 || 0,
        carbs:   Math.round(manCarb * factor * 10) / 10 || 0,
        fat:     Math.round(manFat  * factor * 10) / 10 || 0,
      });
      nutrition = { calories: manCal, protein: manProt||0, carbs: manCarb||0, fat: manFat||0 };
    } else {
      nutrition = { calories: 0, protein: 0, carbs: 0, fat: 0 };
    }
  } else {
    nutrition = DataManager.calcNutrition(name, qty, unit);
  }

  // Ensure entry exists in storage
  if (!DataManager.getEntryByDate(currentDate)) {
    DataManager.upsertEntry(currentEntry);
  }

  if (editingFoodId) {
    // Update existing food item
    const entries = DataManager.getEntries();
    const eIdx = entries.findIndex(e => e.date === currentDate);
    if (eIdx >= 0) {
      const fIdx = entries[eIdx].foods.findIndex(f => f.id === editingFoodId);
      if (fIdx >= 0) {
        entries[eIdx].foods[fIdx] = {
          ...entries[eIdx].foods[fIdx],
          name, quantity: qty, unit, mealTime: meal, ...nutrition,
        };
        DataManager.saveEntries(entries);
        currentEntry = entries[eIdx];
      }
    }
    editingFoodId = null;
    document.getElementById("addFoodBtn").textContent = "➕ Add Food";
  } else {
    const foodItem = { name, quantity: qty, unit, mealTime: meal, ...nutrition };
    DataManager.addFoodToEntry(currentDate, foodItem);
    currentEntry = DataManager.getEntryByDate(currentDate);
  }

  // Clear form
  clearFoodForm();
  renderFoodLog();
  showToast(`✓ ${name} added!`, "success");
}

function clearFoodForm() {
  document.getElementById("foodSearch").value = "";
  document.getElementById("foodQty").value    = "";
  document.getElementById("foodUnit").value   = "g";
  document.getElementById("foodMeal").value   = "Breakfast";
  if (document.getElementById("nutritionPreview"))
    document.getElementById("nutritionPreview").style.display = "none";
  clearManualMacros();
  selectedFood  = null;
  editingFoodId = null;
  document.getElementById("addFoodBtn").textContent = "➕ Add Food";
}

function clearManualMacros() {
  ["manCal","manProt","manCarb","manFat"].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = "";
  });
  const wrap = document.getElementById("manualMacrosWrap");
  if (wrap) wrap.style.display = "none";
}

function deleteFood(foodId) {
  DataManager.removeFoodFromEntry(currentDate, foodId);
  currentEntry = DataManager.getEntryByDate(currentDate) || currentEntry;
  renderFoodLog();
  showToast("Food removed", "info");
}

function editFood(foodId) {
  const food = currentEntry?.foods?.find(f => f.id === foodId);
  if (!food) return;

  editingFoodId = foodId;
  selectedFood  = food.name;
  document.getElementById("foodSearch").value = food.name;
  document.getElementById("foodQty").value    = food.quantity;
  document.getElementById("foodUnit").value   = food.unit;
  document.getElementById("foodMeal").value   = food.mealTime || "Other";
  document.getElementById("addFoodBtn").textContent = "💾 Update Food";
  updateNutritionPreview();

  // Scroll to form
  document.getElementById("foodSearch")?.scrollIntoView({ behavior: "smooth", block: "center" });
}

// ─── HISTORY VIEW ─────────────────────────────────────────────────────────────
function renderHistory() {
  const wrap = document.getElementById("historyList");
  if (!wrap) return;

  const entries = DataManager.getEntries().slice(0, 30);
  if (!entries.length) {
    wrap.innerHTML = `<div class="empty-state"><div class="empty-icon">📅</div>
      <div class="empty-title">No history yet</div>
      <div class="empty-sub">Start logging daily to see your history here</div></div>`;
    return;
  }

  wrap.innerHTML = entries.map(e => {
    const totals = DataManager.getDailyTotals(e);
    const mood   = MOODS.find(m => m.key === e.mood);
    return `<div class="history-item" onclick="goToDate('${e.date}')">
      <div>
        <div class="history-date">${DataManager.formatDate(e.date)} ${mood ? mood.emoji : ""}</div>
        <div class="history-sub">${e.foods?.length || 0} food entries logged</div>
      </div>
      <div class="history-stats">
        <div class="hstat"><div class="hstat-val">${e.steps ?? "–"}</div><div class="hstat-lbl">steps</div></div>
        <div class="hstat"><div class="hstat-val">${e.weight ?? "–"}</div><div class="hstat-lbl">kg</div></div>
        <div class="hstat"><div class="hstat-val" style="color:var(--warning)">${Math.round(totals.calories)}</div><div class="hstat-lbl">kcal</div></div>
        <div class="hstat"><div class="hstat-val">${totals.protein.toFixed(0)}g</div><div class="hstat-lbl">protein</div></div>
      </div>
    </div>`;
  }).join("");
}

function goToDate(date) {
  // Switch to log tab and load that date
  switchTab("log");
  currentDate = date;
  document.getElementById("datePicker").value = date;
  loadEntry(date);
  document.querySelector(".content")?.scrollTo({ top: 0, behavior: "smooth" });
}

// ─── TAB SWITCHING ────────────────────────────────────────────────────────────
function switchTab(tabId) {
  document.querySelectorAll(".tab-btn").forEach(b => b.classList.toggle("active", b.dataset.tab === tabId));
  document.querySelectorAll(".tab-panel").forEach(p => p.classList.toggle("active", p.id === tabId));

  if (tabId === "history") renderHistory();
  if (tabId === "settings") renderSettings();
  if (tabId === "custom-food") renderCustomFoods();
}

// ─── SETTINGS ─────────────────────────────────────────────────────────────────
function renderSettings() {
  const s = DataManager.getSettings();
  const nameEl = document.getElementById("settingName");
  const calEl  = document.getElementById("settingCal");
  const protEl = document.getElementById("settingProt");
  const stpEl  = document.getElementById("settingSteps");
  if (nameEl) nameEl.value = s.name;
  if (calEl)  calEl.value  = s.calorieGoal;
  if (protEl) protEl.value = s.proteinGoal;
  if (stpEl)  stpEl.value  = s.stepsGoal;
}

function saveSettings() {
  const s = DataManager.getSettings();
  s.name         = document.getElementById("settingName")?.value || s.name;
  s.calorieGoal  = parseFloat(document.getElementById("settingCal")?.value)  || s.calorieGoal;
  s.proteinGoal  = parseFloat(document.getElementById("settingProt")?.value) || s.proteinGoal;
  s.stepsGoal    = parseFloat(document.getElementById("settingSteps")?.value)|| s.stepsGoal;
  DataManager.saveSettings(s);
  showToast("✓ Settings saved!", "success");
}

// ─── CUSTOM FOODS ─────────────────────────────────────────────────────────────
function renderCustomFoods() {
  const wrap = document.getElementById("customFoodList");
  if (!wrap) return;
  const customs = DataManager.getCustomFoods();
  const keys = Object.keys(customs);
  if (!keys.length) {
    wrap.innerHTML = `<p style="color:var(--text-muted);font-size:14px;padding:16px 0">No custom foods saved yet.</p>`;
    return;
  }
  wrap.innerHTML = keys.map(name => {
    const f = customs[name];
    return `<div class="history-item">
      <div>
        <div class="history-date">${escHtml(name)}</div>
        <div class="history-sub">Per 100g: ${f.cal}kcal · P:${f.protein}g · C:${f.carbs}g · F:${f.fat}g</div>
      </div>
      <button class="btn btn-sm btn-danger" onclick="deleteCustomFood('${escAttr(name)}')">Delete</button>
    </div>`;
  }).join("");
}

function deleteCustomFood(name) {
  const customs = DataManager.getCustomFoods();
  delete customs[name];
  localStorage.setItem("lt_custom_foods", JSON.stringify(customs));
  renderCustomFoods();
  showToast("Custom food removed", "info");
}

// ─── EXPORT / IMPORT ──────────────────────────────────────────────────────────
function exportJSON() {
  const json = DataManager.exportJSON();
  const blob = new Blob([json], { type: "application/json" });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement("a");
  a.href     = url;
  a.download = `lifetracker-export-${DataManager.todayStr()}.json`;
  a.click();
  URL.revokeObjectURL(url);
  showToast("📦 Data exported!", "success");
}

function importJSON() {
  const input = document.createElement("input");
  input.type  = "file";
  input.accept= ".json";
  input.onchange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        DataManager.importJSON(ev.target.result);
        showToast("✓ Data imported!", "success");
        loadEntry(currentDate);
        renderHistory();
      } catch {
        showToast("Invalid file format", "error");
      }
    };
    reader.readAsText(file);
  };
  input.click();
}

function clearAllData() {
  if (confirm("⚠️ This will permanently delete ALL your data. Are you sure?")) {
    localStorage.clear();
    showToast("All data cleared", "info");
    loadEntry(currentDate);
  }
}

// ─── MANUAL MACROS TOGGLE ─────────────────────────────────────────────────────
function toggleManualMacros() {
  const wrap = document.getElementById("manualMacrosWrap");
  if (wrap) wrap.style.display = wrap.style.display === "none" ? "grid" : "none";
}

// ─── EVENT BINDINGS ───────────────────────────────────────────────────────────
function bindEvents() {
  // Dark mode toggle
  document.getElementById("darkModeToggle")?.addEventListener("change", toggleDarkMode);

  // Tab buttons
  document.querySelectorAll(".tab-btn").forEach(btn => {
    btn.addEventListener("click", () => switchTab(btn.dataset.tab));
  });

  // Save vitals button
  document.getElementById("saveVitalsBtn")?.addEventListener("click", saveVitals);

  // Add food button
  document.getElementById("addFoodBtn")?.addEventListener("click", addFood);

  // Clear food form
  document.getElementById("clearFoodBtn")?.addEventListener("click", clearFoodForm);

  // Quantity/unit change → update preview
  ["foodQty","foodUnit"].forEach(id => {
    document.getElementById(id)?.addEventListener("input", updateNutritionPreview);
  });

  // Save settings
  document.getElementById("saveSettingsBtn")?.addEventListener("click", saveSettings);

  // Export
  document.getElementById("exportJSONBtn")?.addEventListener("click", exportJSON);

  // Import
  document.getElementById("importJSONBtn")?.addEventListener("click", importJSON);

  // Clear data
  document.getElementById("clearDataBtn")?.addEventListener("click", clearAllData);

  // Manual macros toggle
  document.getElementById("toggleManualBtn")?.addEventListener("click", toggleManualMacros);

  // Hamburger menu (mobile)
  document.getElementById("hamburger")?.addEventListener("click", () => {
    document.querySelector(".sidebar")?.classList.toggle("open");
    document.getElementById("sidebarOverlay")?.classList.toggle("open");
  });

  document.getElementById("sidebarOverlay")?.addEventListener("click", () => {
    document.querySelector(".sidebar")?.classList.remove("open");
    document.getElementById("sidebarOverlay")?.classList.remove("open");
  });
}

// ─── TOAST SYSTEM ─────────────────────────────────────────────────────────────
function showToast(message, type = "info", duration = 3000) {
  let container = document.getElementById("toast-container");
  if (!container) {
    container = document.createElement("div");
    container.id = "toast-container";
    document.body.appendChild(container);
  }

  const icons = { success: "✅", error: "❌", info: "ℹ️" };
  const toast = document.createElement("div");
  toast.className = `toast ${type}`;
  toast.innerHTML = `<span>${icons[type] || "•"}</span><span>${escHtml(message)}</span>`;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = "0";
    setTimeout(() => toast.remove(), 300);
  }, duration);
}

// ─── UTILITIES ────────────────────────────────────────────────────────────────
function escHtml(str) {
  return String(str ?? "").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");
}

function escAttr(str) {
  return String(str ?? "").replace(/'/g,"\\'").replace(/"/g,"&quot;");
}
