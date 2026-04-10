# 🏃 LifeTracker — Personal Health Tracking App

A fully **offline** personal health and nutrition tracker.
No internet needed. No installation. No account. Just open and use.

---

## 📁 File Structure

```
life-tracker/
├── index.html       ← Daily Log page (main entry point)
├── dashboard.html   ← Analytics Dashboard with charts
├── style.css        ← All styles (dark/light theme)
├── data.js          ← Food database + localStorage data layer
├── charts.js        ← Offline canvas-based chart library
├── app.js           ← Daily log page logic
├── dashboard.js     ← Dashboard analytics logic
└── README.md        ← This file
```

---

## 🚀 How to Use (No Installation Required)

1. Copy the **entire `life-tracker` folder** to your D drive (e.g. `D:\life-tracker\`)
2. Open `D:\life-tracker\index.html` in your browser
   - **Chrome** or **Edge** recommended (best localStorage support)
   - Right-click → Open with → Chrome/Edge
3. That's it! Start logging.

> ⚠️ **Important**: Always open the HTML files directly from the same folder.
> Do NOT move individual files out of the folder.

---

## 🎯 Features

### Daily Log (index.html)
- ✅ Log **steps**, **body weight**, **mood**
- ✅ Add **food items** with meal time (Breakfast/Lunch/Dinner/Snack)
- ✅ **Autocomplete** food search from 60+ built-in foods
- ✅ Automatic **calorie + macro calculation** (protein, carbs, fat)
- ✅ **Manual entry** for foods not in the database (auto-saved to custom DB)
- ✅ Edit or delete any food entry
- ✅ **Live nutrition preview** before adding food
- ✅ Macro breakdown bar (visual split of P/C/F)
- ✅ **History view** — all past days, click to edit any day
- ✅ Custom foods manager

### Dashboard (dashboard.html)
- ✅ **Stat cards** — steps, weight, calories, protein, days logged, mood
- ✅ **Goal progress bars** for calories, steps, protein
- ✅ Today's full meal summary
- ✅ **Line charts** — steps and weight over time
- ✅ **Bar chart** — daily calories + protein
- ✅ **Donut chart** — average macro split (protein/carbs/fat)
- ✅ Period filter: 7 / 14 / 30 / 90 days
- ✅ Aggregated period summary stats

### General
- ✅ **Dark mode** (default) + light mode toggle
- ✅ **Fully responsive** — works on mobile and desktop
- ✅ **Export data** as JSON backup
- ✅ **Import data** from JSON backup
- ✅ Custom goals (calorie, protein, steps)
- ✅ Smooth animations and transitions
- ✅ Toast notifications for all actions
- ✅ **100% offline** — all charts built without Chart.js CDN

---

## 🥗 Built-in Food Database (60+ foods)

**Grains:** Rice, Roti, White/Brown Bread, Noodles, Oats, Cornflakes  
**Proteins:** Egg, Chicken Breast/Thigh, Beef, Fish, Hilsa, Tuna, Salmon, Shrimp, Dal, Chickpeas, Tofu  
**Dairy:** Milk, Yogurt, Cheese, Paneer, Butter  
**Vegetables:** Potato, Sweet Potato, Spinach, Broccoli, Carrot, Tomato, Onion, Cauliflower, Cabbage, Cucumber, Bell Pepper, Eggplant  
**Fruits:** Banana, Apple, Orange, Mango, Watermelon, Grapes, Papaya, Guava  
**Fats & Snacks:** Vegetable/Olive Oil, Peanut Butter, Almonds, Biscuits, Chips, Dark Chocolate, Honey, Sugar  

**Units supported:** g, kg, ml, litre, cup, bowl, plate, piece, slice, tablespoon, teaspoon, oz

---

## 💾 Data Storage

All data is stored in your **browser's localStorage** — it persists even after closing the browser.

- ⚠️ Data is browser-specific (Chrome data ≠ Edge data)
- ⚠️ Clearing browser data/cache will delete entries
- ✅ Use **Export JSON** regularly to back up your data
- ✅ Use **Import JSON** to restore from backup

---

## 🌙 Tips

- **Best browser:** Chrome or Edge (best localStorage support)
- **To use on another device:** Export JSON → copy file → Import JSON on new device
- **To reset:** Settings → Clear All Data (or clear browser localStorage)
- **Keyboard shortcut in food search:** Arrow keys to navigate, Enter to select, Esc to close dropdown

---

## 📐 Customise Your Goals (Settings tab)

- Daily calorie goal (default: 2000 kcal)
- Daily protein goal (default: 120g)
- Daily steps goal (default: 10,000)

---

*Built with ❤️ using HTML, CSS & Vanilla JavaScript — No frameworks, no CDN, no internet required.*
