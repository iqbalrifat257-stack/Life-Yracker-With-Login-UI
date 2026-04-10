/**
 * charts.js — Lightweight Canvas Chart Library for LifeTracker
 * Fully offline. No external dependencies.
 * Supports: Line, Bar, Pie/Donut charts with animations.
 */

const Charts = {

  // ─── THEME ──────────────────────────────────────────────────────────────────
  colors: {
    teal:    "#2dd4bf",
    blue:    "#60a5fa",
    green:   "#4ade80",
    orange:  "#fb923c",
    purple:  "#a78bfa",
    pink:    "#f472b6",
    red:     "#f87171",
    yellow:  "#fbbf24",
    grid:    "rgba(255,255,255,0.06)",
    text:    "rgba(255,255,255,0.55)",
    textBright: "rgba(255,255,255,0.85)",
    bg:      "#1a1f2e",
  },

  palette: ["#2dd4bf","#60a5fa","#4ade80","#fb923c","#a78bfa","#f472b6","#fbbf24","#f87171"],

  // ─── HELPERS ────────────────────────────────────────────────────────────────

  /** Set canvas to device-pixel-ratio size for sharpness */
  setup(canvas) {
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width  = rect.width  * dpr;
    canvas.height = rect.height * dpr;
    const ctx = canvas.getContext("2d");
    ctx.scale(dpr, dpr);
    return { ctx, w: rect.width, h: rect.height };
  },

  /** Easing function */
  easeOut(t) { return 1 - Math.pow(1 - t, 3); },

  /** Format number nicely */
  fmt(n, decimals = 0) {
    if (n === null || n === undefined || isNaN(n)) return "–";
    return Number(n).toFixed(decimals);
  },

  /** Draw rounded rectangle */
  roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  },

  // ─── LINE CHART ─────────────────────────────────────────────────────────────
  /**
   * @param {HTMLCanvasElement} canvas
   * @param {{ labels: string[], datasets: [{label, data, color}] }} config
   */
  drawLine(canvas, config) {
    if (!canvas) return;
    const { ctx, w, h } = this.setup(canvas);
    const { labels = [], datasets = [] } = config;
    if (!labels.length) return this.drawEmpty(ctx, w, h);

    const pad = { top: 20, right: 20, bottom: 50, left: 52 };
    const chartW = w - pad.left - pad.right;
    const chartH = h - pad.top - pad.bottom;

    // Find value range
    const allVals = datasets.flatMap(d => d.data.filter(v => v !== null && v !== undefined));
    if (!allVals.length) return this.drawEmpty(ctx, w, h);
    const minV = Math.min(...allVals);
    const maxV = Math.max(...allVals);
    const range = (maxV - minV) || 1;
    const yMin = minV - range * 0.1;
    const yMax = maxV + range * 0.1;

    const toX = (i) => pad.left + (i / (labels.length - 1 || 1)) * chartW;
    const toY = (v) => pad.top + (1 - (v - yMin) / (yMax - yMin)) * chartH;

    // Grid lines
    ctx.strokeStyle = this.colors.grid;
    ctx.lineWidth = 1;
    const gridLines = 5;
    for (let i = 0; i <= gridLines; i++) {
      const y = pad.top + (i / gridLines) * chartH;
      ctx.beginPath(); ctx.moveTo(pad.left, y); ctx.lineTo(pad.left + chartW, y); ctx.stroke();
      const val = yMax - (i / gridLines) * (yMax - yMin);
      ctx.fillStyle = this.colors.text;
      ctx.font = "11px 'Segoe UI', system-ui";
      ctx.textAlign = "right";
      ctx.fillText(this.fmt(val, maxV < 10 ? 1 : 0), pad.left - 6, y + 4);
    }

    // X labels
    ctx.fillStyle = this.colors.text;
    ctx.font = "11px 'Segoe UI', system-ui";
    ctx.textAlign = "center";
    const step = Math.ceil(labels.length / 8);
    labels.forEach((lbl, i) => {
      if (i % step === 0 || i === labels.length - 1) {
        ctx.fillText(lbl, toX(i), h - 10);
      }
    });

    // Datasets
    datasets.forEach((ds, di) => {
      const color = ds.color || this.palette[di % this.palette.length];
      const data  = ds.data;

      // Gradient fill
      const grad = ctx.createLinearGradient(0, pad.top, 0, pad.top + chartH);
      grad.addColorStop(0, color + "40");
      grad.addColorStop(1, color + "00");

      // Build path
      ctx.beginPath();
      let started = false;
      data.forEach((v, i) => {
        if (v === null || v === undefined) return;
        const x = toX(i), y = toY(v);
        if (!started) { ctx.moveTo(x, y); started = true; }
        else ctx.lineTo(x, y);
      });
      // Fill area
      if (started) {
        const lastIdx = data.map((v, i) => v !== null ? i : -1).filter(i => i >= 0).pop();
        ctx.lineTo(toX(lastIdx), pad.top + chartH);
        const firstIdx = data.findIndex(v => v !== null);
        ctx.lineTo(toX(firstIdx), pad.top + chartH);
        ctx.closePath();
        ctx.fillStyle = grad;
        ctx.fill();
      }

      // Line
      ctx.beginPath();
      started = false;
      data.forEach((v, i) => {
        if (v === null || v === undefined) return;
        const x = toX(i), y = toY(v);
        if (!started) { ctx.moveTo(x, y); started = true; }
        else ctx.lineTo(x, y);
      });
      ctx.strokeStyle = color;
      ctx.lineWidth = 2.5;
      ctx.lineJoin = "round";
      ctx.stroke();

      // Dots
      data.forEach((v, i) => {
        if (v === null || v === undefined) return;
        const x = toX(i), y = toY(v);
        ctx.beginPath();
        ctx.arc(x, y, 4, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.fill();
        ctx.strokeStyle = "#1a1f2e";
        ctx.lineWidth = 2;
        ctx.stroke();
      });
    });

    // Legend
    if (datasets.length > 1) {
      let lx = pad.left;
      datasets.forEach((ds, di) => {
        const color = ds.color || this.palette[di % this.palette.length];
        ctx.fillStyle = color;
        ctx.fillRect(lx, pad.top - 14, 12, 4);
        ctx.fillStyle = this.colors.textBright;
        ctx.font = "11px 'Segoe UI', system-ui";
        ctx.textAlign = "left";
        ctx.fillText(ds.label || "", lx + 16, pad.top - 8);
        lx += ctx.measureText(ds.label || "").width + 32;
      });
    }
  },

  // ─── BAR CHART ──────────────────────────────────────────────────────────────
  drawBar(canvas, config) {
    if (!canvas) return;
    const { ctx, w, h } = this.setup(canvas);
    const { labels = [], datasets = [] } = config;
    if (!labels.length) return this.drawEmpty(ctx, w, h);

    const data = datasets[0]?.data || [];
    const color = datasets[0]?.color || this.colors.teal;
    const secondaryData = datasets[1]?.data;
    const secondaryColor = datasets[1]?.color || this.colors.blue;

    const pad = { top: 20, right: 20, bottom: 50, left: 52 };
    const chartW = w - pad.left - pad.right;
    const chartH = h - pad.top - pad.bottom;

    const allVals = [...data, ...(secondaryData || [])].filter(v => v !== null && v !== undefined);
    const maxV = Math.max(...allVals, 1);
    const yMax = maxV * 1.1;

    const n = labels.length;
    const groupW = chartW / n;
    const barCount = secondaryData ? 2 : 1;
    const gap = 4;
    const barW = (groupW - gap * (barCount + 1)) / barCount;

    // Grid
    ctx.strokeStyle = this.colors.grid;
    ctx.lineWidth = 1;
    for (let i = 0; i <= 5; i++) {
      const y = pad.top + (i / 5) * chartH;
      ctx.beginPath(); ctx.moveTo(pad.left, y); ctx.lineTo(pad.left + chartW, y); ctx.stroke();
      const val = yMax * (1 - i / 5);
      ctx.fillStyle = this.colors.text;
      ctx.font = "11px 'Segoe UI', system-ui";
      ctx.textAlign = "right";
      ctx.fillText(this.fmt(val, maxV < 20 ? 1 : 0), pad.left - 6, y + 4);
    }

    // Bars
    labels.forEach((lbl, i) => {
      const centerX = pad.left + i * groupW + groupW / 2;
      const startX  = centerX - (barCount * barW + (barCount - 1) * gap) / 2;

      const drawBar = (val, bx, bColor) => {
        if (val === null || val === undefined || val === 0) return;
        const bh = (val / yMax) * chartH;
        const by = pad.top + chartH - bh;
        const grad = ctx.createLinearGradient(0, by, 0, by + bh);
        grad.addColorStop(0, bColor + "ff");
        grad.addColorStop(1, bColor + "88");
        ctx.fillStyle = grad;
        this.roundRect(ctx, bx, by, barW, bh, 4);
        ctx.fill();
      };

      drawBar(data[i], startX, color);
      if (secondaryData) drawBar(secondaryData[i], startX + barW + gap, secondaryColor);

      ctx.fillStyle = this.colors.text;
      ctx.font = "10px 'Segoe UI', system-ui";
      ctx.textAlign = "center";
      ctx.fillText(lbl, centerX, h - 10);
    });

    // Legend
    if (datasets.length > 1) {
      let lx = pad.left;
      datasets.forEach((ds, di) => {
        const c = ds.color || this.palette[di];
        ctx.fillStyle = c;
        this.roundRect(ctx, lx, pad.top - 16, 12, 8, 2); ctx.fill();
        ctx.fillStyle = this.colors.textBright;
        ctx.font = "11px 'Segoe UI', system-ui";
        ctx.textAlign = "left";
        ctx.fillText(ds.label || "", lx + 16, pad.top - 8);
        lx += ctx.measureText(ds.label || "").width + 36;
      });
    }
  },

  // ─── DONUT / PIE CHART ──────────────────────────────────────────────────────
  drawDonut(canvas, config) {
    if (!canvas) return;
    const { ctx, w, h } = this.setup(canvas);
    const { labels = [], data = [], colors: customColors } = config;
    if (!data.length || data.every(v => !v)) return this.drawEmpty(ctx, w, h);

    const cx = w / 2, cy = h / 2;
    const outerR = Math.min(cx, cy) * 0.75;
    const innerR = outerR * 0.58;
    const total = data.reduce((a, b) => a + (b || 0), 0);
    const palette = customColors || this.palette;

    let angle = -Math.PI / 2;
    const segments = data.map((val, i) => {
      const sweep = ((val || 0) / total) * Math.PI * 2;
      const seg = { val, start: angle, sweep, color: palette[i % palette.length], label: labels[i] };
      angle += sweep;
      return seg;
    });

    // Draw segments
    segments.forEach(seg => {
      if (!seg.sweep) return;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, outerR, seg.start, seg.start + seg.sweep);
      ctx.closePath();
      ctx.fillStyle = seg.color;
      ctx.fill();
    });

    // Donut hole
    ctx.beginPath();
    ctx.arc(cx, cy, innerR, 0, Math.PI * 2);
    ctx.fillStyle = "#1a1f2e";
    ctx.fill();

    // Center text
    ctx.fillStyle = this.colors.textBright;
    ctx.font = `bold 22px 'Segoe UI', system-ui`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(Math.round(total), cx, cy - 8);
    ctx.font = `12px 'Segoe UI', system-ui`;
    ctx.fillStyle = this.colors.text;
    ctx.fillText("total", cx, cy + 14);
    ctx.textBaseline = "alphabetic";

    // Legend on right or bottom
    const legendX = w - 110;
    const legendStartY = h / 2 - (segments.length * 18) / 2;
    segments.forEach((seg, i) => {
      const pct = total ? ((seg.val / total) * 100).toFixed(1) : "0.0";
      const ly = legendStartY + i * 22;
      ctx.fillStyle = seg.color;
      ctx.beginPath(); ctx.arc(legendX + 6, ly, 5, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = this.colors.textBright;
      ctx.font = "12px 'Segoe UI', system-ui";
      ctx.textAlign = "left";
      ctx.fillText(`${seg.label}`, legendX + 16, ly + 4);
      ctx.fillStyle = this.colors.text;
      ctx.textAlign = "right";
      ctx.fillText(`${pct}%`, w - 4, ly + 4);
    });
  },

  // ─── EMPTY STATE ────────────────────────────────────────────────────────────
  drawEmpty(ctx, w, h) {
    ctx.fillStyle = "rgba(255,255,255,0.08)";
    ctx.font = "14px 'Segoe UI', system-ui";
    ctx.textAlign = "center";
    ctx.fillText("No data yet — start logging!", w / 2, h / 2 - 8);
    ctx.font = "12px 'Segoe UI', system-ui";
    ctx.fillText("Go to the Log tab to add entries", w / 2, h / 2 + 14);
  },
};
