/**
 * data.js — Data layer for LifeTracker
 * Handles all localStorage operations and the built-in food database.
 */

// ─── FOOD DATABASE ────────────────────────────────────────────────────────────
// Values per 100g unless noted. {cal, protein(g), carbs(g), fat(g)}
const FOOD_DATABASE = {
  // Grains & Bread
  "Rice (cooked)":        { cal: 130, protein: 2.7,  carbs: 28.2, fat: 0.3  },
  "Rice (raw)":           { cal: 365, protein: 7.1,  carbs: 79.3, fat: 0.7  },
  "Roti / Chapati":       { cal: 300, protein: 8.0,  carbs: 60.0, fat: 3.7  },
  "White Bread":          { cal: 265, protein: 9.0,  carbs: 50.0, fat: 3.2  },
  "Brown Bread":          { cal: 247, protein: 13.0, carbs: 41.0, fat: 3.5  },
  "Noodles (cooked)":     { cal: 138, protein: 4.5,  carbs: 25.1, fat: 2.1  },
  "Oats":                 { cal: 389, protein: 17.0, carbs: 66.3, fat: 6.9  },
  "Cornflakes":           { cal: 357, protein: 7.5,  carbs: 84.0, fat: 0.4  },

  // Proteins
  "Egg (whole)":          { cal: 155, protein: 13.0, carbs: 1.1,  fat: 10.6 },
  "Egg White":            { cal: 52,  protein: 10.9, carbs: 0.7,  fat: 0.2  },
  "Chicken Breast":       { cal: 165, protein: 31.0, carbs: 0.0,  fat: 3.6  },
  "Chicken Thigh":        { cal: 209, protein: 26.0, carbs: 0.0,  fat: 10.9 },
  "Beef (lean)":          { cal: 250, protein: 26.0, carbs: 0.0,  fat: 15.0 },
  "Fish (generic)":       { cal: 130, protein: 26.0, carbs: 0.0,  fat: 3.0  },
  "Hilsa Fish":           { cal: 273, protein: 21.8, carbs: 0.0,  fat: 19.4 },
  "Tuna (canned)":        { cal: 116, protein: 25.5, carbs: 0.0,  fat: 1.0  },
  "Salmon":               { cal: 208, protein: 20.0, carbs: 0.0,  fat: 13.4 },
  "Shrimp":               { cal: 99,  protein: 24.0, carbs: 0.2,  fat: 0.3  },
  "Dal / Lentils":        { cal: 116, protein: 9.0,  carbs: 20.1, fat: 0.4  },
  "Chickpeas":            { cal: 164, protein: 8.9,  carbs: 27.4, fat: 2.6  },
  "Tofu":                 { cal: 76,  protein: 8.0,  carbs: 1.9,  fat: 4.8  },

  // Dairy
  "Milk (whole)":         { cal: 61,  protein: 3.2,  carbs: 4.8,  fat: 3.3  },
  "Milk (skim)":          { cal: 34,  protein: 3.4,  carbs: 5.0,  fat: 0.1  },
  "Yogurt (plain)":       { cal: 59,  protein: 3.5,  carbs: 3.6,  fat: 3.3  },
  "Cheddar Cheese":       { cal: 403, protein: 25.0, carbs: 1.3,  fat: 33.1 },
  "Paneer":               { cal: 265, protein: 18.3, carbs: 1.2,  fat: 20.8 },
  "Butter":               { cal: 717, protein: 0.9,  carbs: 0.1,  fat: 81.1 },

  // Vegetables
  "Potato (boiled)":      { cal: 77,  protein: 2.0,  carbs: 17.0, fat: 0.1  },
  "Sweet Potato":         { cal: 86,  protein: 1.6,  carbs: 20.1, fat: 0.1  },
  "Spinach":              { cal: 23,  protein: 2.9,  carbs: 3.6,  fat: 0.4  },
  "Broccoli":             { cal: 34,  protein: 2.8,  carbs: 7.0,  fat: 0.4  },
  "Carrot":               { cal: 41,  protein: 0.9,  carbs: 10.0, fat: 0.2  },
  "Tomato":               { cal: 18,  protein: 0.9,  carbs: 3.9,  fat: 0.2  },
  "Onion":                { cal: 40,  protein: 1.1,  carbs: 9.3,  fat: 0.1  },
  "Cauliflower":          { cal: 25,  protein: 1.9,  carbs: 5.0,  fat: 0.3  },
  "Cabbage":              { cal: 25,  protein: 1.3,  carbs: 5.8,  fat: 0.1  },
  "Cucumber":             { cal: 15,  protein: 0.7,  carbs: 3.6,  fat: 0.1  },
  "Bell Pepper":          { cal: 31,  protein: 1.0,  carbs: 6.0,  fat: 0.3  },
  "Eggplant":             { cal: 25,  protein: 1.0,  carbs: 5.9,  fat: 0.2  },

  // Fruits
  "Banana":               { cal: 89,  protein: 1.1,  carbs: 22.8, fat: 0.3  },
  "Apple":                { cal: 52,  protein: 0.3,  carbs: 13.8, fat: 0.2  },
  "Orange":               { cal: 47,  protein: 0.9,  carbs: 11.8, fat: 0.1  },
  "Mango":                { cal: 60,  protein: 0.8,  carbs: 15.0, fat: 0.4  },
  "Watermelon":           { cal: 30,  protein: 0.6,  carbs: 7.6,  fat: 0.2  },
  "Grapes":               { cal: 69,  protein: 0.7,  carbs: 18.1, fat: 0.2  },
  "Papaya":               { cal: 43,  protein: 0.5,  carbs: 10.8, fat: 0.3  },
  "Guava":                { cal: 68,  protein: 2.6,  carbs: 14.3, fat: 1.0  },

  // Fats & Oils
  "Vegetable Oil":        { cal: 884, protein: 0.0,  carbs: 0.0,  fat: 100.0},
  "Olive Oil":            { cal: 884, protein: 0.0,  carbs: 0.0,  fat: 100.0},
  "Peanut Butter":        { cal: 588, protein: 25.1, carbs: 19.7, fat: 50.4 },
  "Almonds":              { cal: 579, protein: 21.2, carbs: 21.6, fat: 49.9 },

  // Snacks & Others
  "Biscuit / Cookie":     { cal: 450, protein: 5.9,  carbs: 68.5, fat: 18.0 },
  "Potato Chips":         { cal: 536, protein: 7.0,  carbs: 52.9, fat: 34.6 },
  "Dark Chocolate":       { cal: 546, protein: 5.0,  carbs: 60.0, fat: 31.3 },
  "Honey":                { cal: 304, protein: 0.3,  carbs: 82.4, fat: 0.0  },
  "Sugar":                { cal: 387, protein: 0.0,  carbs: 100.0,fat: 0.0  },
};

// ─── UNIT CONVERSIONS ─────────────────────────────────────────────────────────
// Convert any unit to grams for nutrition calculation
const UNIT_TO_GRAMS = {
  "g":    (v) => v,
  "kg":   (v) => v * 1000,
  "ml":   (v) => v,       // approximate: 1ml ≈ 1g for water-based
  "l":    (v) => v * 1000,
  "oz":   (v) => v * 28.35,
  "lb":   (v) => v * 453.6,
  "cup":  (v) => v * 240,
  "tbsp": (v) => v * 15,
  "tsp":  (v) => v * 5,
  "slice":(v) => v * 30,   // ~30g per slice (bread)
  "piece":(v) => v * 100,  // default 100g per piece
  "bowl": (v) => v * 250,  // ~250g per bowl
  "plate":(v) => v * 350,  // ~350g per plate
};

// ─── STORAGE KEYS ─────────────────────────────────────────────────────────────
const STORAGE_KEYS = {
  ENTRIES:       "lt_entries",
  CUSTOM_FOODS:  "lt_custom_foods",
  SETTINGS:      "lt_settings",
};

// ─── DATA MANAGER ─────────────────────────────────────────────────────────────
const DataManager = {

  /** Load all daily entries */
  getEntries() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEYS.ENTRIES)) || [];
    } catch { return []; }
  },

  /** Save all entries */
  saveEntries(entries) {
    localStorage.setItem(STORAGE_KEYS.ENTRIES, JSON.stringify(entries));
  },

  /** Get entry for a specific date (YYYY-MM-DD). Returns null if not found. */
  getEntryByDate(date) {
    return this.getEntries().find(e => e.date === date) || null;
  },

  /** Get or create an entry for today */
  getOrCreateToday() {
    const today = this.todayStr();
    let entry = this.getEntryByDate(today);
    if (!entry) {
      entry = this.createEntry(today);
      const entries = this.getEntries();
      entries.push(entry);
      this.saveEntries(entries);
    }
    return entry;
  },

  /** Create a blank daily entry */
  createEntry(date) {
    return {
      id:     Date.now().toString(),
      date,
      steps:  null,
      weight: null,
      mood:   null,
      foods:  [],
    };
  },

  /** Upsert an entry (insert or update by date) */
  upsertEntry(updatedEntry) {
    const entries = this.getEntries();
    const idx = entries.findIndex(e => e.date === updatedEntry.date);
    if (idx >= 0) {
      entries[idx] = updatedEntry;
    } else {
      entries.push(updatedEntry);
    }
    // Sort by date descending
    entries.sort((a, b) => b.date.localeCompare(a.date));
    this.saveEntries(entries);
    return updatedEntry;
  },

  /** Delete an entry by date */
  deleteEntry(date) {
    const entries = this.getEntries().filter(e => e.date !== date);
    this.saveEntries(entries);
  },

  /** Add a food item to a date's entry */
  addFoodToEntry(date, foodItem) {
    const entries = this.getEntries();
    const idx = entries.findIndex(e => e.date === date);
    if (idx >= 0) {
      foodItem.id = Date.now().toString() + Math.random().toString(36).slice(2);
      entries[idx].foods.push(foodItem);
      this.saveEntries(entries);
    }
  },

  /** Remove a food item from a date's entry by food id */
  removeFoodFromEntry(date, foodId) {
    const entries = this.getEntries();
    const idx = entries.findIndex(e => e.date === date);
    if (idx >= 0) {
      entries[idx].foods = entries[idx].foods.filter(f => f.id !== foodId);
      this.saveEntries(entries);
    }
  },

  // ── Custom Foods ──────────────────────────────────────────────────────────

  getCustomFoods() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEYS.CUSTOM_FOODS)) || {};
    } catch { return {}; }
  },

  saveCustomFood(name, macros) {
    const customs = this.getCustomFoods();
    customs[name] = macros;
    localStorage.setItem(STORAGE_KEYS.CUSTOM_FOODS, JSON.stringify(customs));
  },

  /** Combined food database (built-in + custom) */
  getAllFoods() {
    return { ...FOOD_DATABASE, ...this.getCustomFoods() };
  },

  // ── Settings ──────────────────────────────────────────────────────────────

  getSettings() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEYS.SETTINGS)) || {
        darkMode: true,
        calorieGoal: 2000,
        proteinGoal: 120,
        stepsGoal: 10000,
        weightUnit: "kg",
        name: "User",
      };
    } catch {
      return { darkMode: true, calorieGoal: 2000, proteinGoal: 120, stepsGoal: 10000, weightUnit: "kg", name: "User" };
    }
  },

  saveSettings(settings) {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
  },

  // ── Utilities ─────────────────────────────────────────────────────────────

  /** Today as YYYY-MM-DD */
  todayStr() {
    return new Date().toISOString().split("T")[0];
  },

  /** Format YYYY-MM-DD to readable string */
  formatDate(dateStr) {
    const d = new Date(dateStr + "T00:00:00");
    return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" });
  },

  /**
   * Calculate nutrition for a food item.
   * @param {string} foodName - name in food database
   * @param {number} quantity - amount
   * @param {string} unit - unit string (g, cup, piece, etc.)
   * @returns {{ calories, protein, carbs, fat }} per the quantity given
   */
  calcNutrition(foodName, quantity, unit) {
    const allFoods = this.getAllFoods();
    const base = allFoods[foodName];
    if (!base) return { calories: 0, protein: 0, carbs: 0, fat: 0 };

    const toGrams = UNIT_TO_GRAMS[unit] || UNIT_TO_GRAMS["g"];
    const grams = toGrams(quantity);
    const factor = grams / 100;

    return {
      calories: Math.round(base.cal     * factor * 10) / 10,
      protein:  Math.round(base.protein * factor * 10) / 10,
      carbs:    Math.round(base.carbs   * factor * 10) / 10,
      fat:      Math.round(base.fat     * factor * 10) / 10,
    };
  },

  /** Summarise a daily entry's nutrition totals */
  getDailyTotals(entry) {
    if (!entry || !entry.foods) return { calories: 0, protein: 0, carbs: 0, fat: 0 };
    return entry.foods.reduce((acc, f) => {
      acc.calories += (f.calories || 0);
      acc.protein  += (f.protein  || 0);
      acc.carbs    += (f.carbs    || 0);
      acc.fat      += (f.fat      || 0);
      return acc;
    }, { calories: 0, protein: 0, carbs: 0, fat: 0 });
  },

  /** Get entries for the last N days */
  getLastNDays(n) {
    const entries = this.getEntries();
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - n);
    return entries.filter(e => new Date(e.date + "T00:00:00") >= cutoff);
  },

  /** Export all data as JSON string */
  exportJSON() {
    return JSON.stringify({
      entries:     this.getEntries(),
      customFoods: this.getCustomFoods(),
      settings:    this.getSettings(),
      exportedAt:  new Date().toISOString(),
    }, null, 2);
  },

  /** Import data from JSON string */
  importJSON(jsonStr) {
    const data = JSON.parse(jsonStr);
    if (data.entries)     this.saveEntries(data.entries);
    if (data.customFoods) localStorage.setItem(STORAGE_KEYS.CUSTOM_FOODS, JSON.stringify(data.customFoods));
    if (data.settings)    this.saveSettings(data.settings);
  },
};
