/**
 * auth.js — LifeTracker Authentication
 * Offline login system using Web Crypto API (SHA-256 hashing).
 * No backend needed — credentials stored securely in localStorage.
 */

const Auth = {

  KEYS: {
    USERS:        "lt_users",
    SESSION:      "lt_session",
    CURRENT_USER: "lt_current_user",
  },

  // ── Hash password using SHA-256 (Web Crypto API) ──────────────
  async hashPassword(password) {
    const encoder = new TextEncoder();
    const data    = encoder.encode(password + "lt_salt_2024"); // salted
    const hashBuf = await crypto.subtle.digest("SHA-256", data);
    const hashArr = Array.from(new Uint8Array(hashBuf));
    return hashArr.map(b => b.toString(16).padStart(2, "0")).join("");
  },

  // ── Get all users ──────────────────────────────────────────────
  getUsers() {
    try { return JSON.parse(localStorage.getItem(this.KEYS.USERS)) || {}; }
    catch { return {}; }
  },

  saveUsers(users) {
    localStorage.setItem(this.KEYS.USERS, JSON.stringify(users));
  },

  // ── Register new user ──────────────────────────────────────────
  async register(username, password, displayName) {
    const users = this.getUsers();
    const key   = username.trim().toLowerCase();

    if (!key || key.length < 3)
      return { ok: false, msg: "Username must be at least 3 characters." };
    if (!/^[a-z0-9_]+$/.test(key))
      return { ok: false, msg: "Username can only contain letters, numbers, underscore." };
    if (users[key])
      return { ok: false, msg: "Username already exists. Please choose another." };
    if (!password || password.length < 4)
      return { ok: false, msg: "Password must be at least 4 characters." };

    const hashed = await this.hashPassword(password);
    users[key] = {
      username:    key,
      displayName: displayName?.trim() || key,
      passwordHash: hashed,
      createdAt:   new Date().toISOString(),
      avatar:      this.generateAvatar(displayName || key),
    };
    this.saveUsers(users);
    return { ok: true };
  },

  // ── Login ──────────────────────────────────────────────────────
  async login(username, password) {
    const users  = this.getUsers();
    const key    = username.trim().toLowerCase();
    const user   = users[key];

    if (!user) return { ok: false, msg: "User not found." };

    const hashed = await this.hashPassword(password);
    if (hashed !== user.passwordHash)
      return { ok: false, msg: "Incorrect password." };

    // Create session
    const session = {
      username:    key,
      displayName: user.displayName,
      avatar:      user.avatar,
      loginAt:     new Date().toISOString(),
      token:       crypto.randomUUID(),
    };
    localStorage.setItem(this.KEYS.SESSION,      JSON.stringify(session));
    localStorage.setItem(this.KEYS.CURRENT_USER, key);
    return { ok: true, session };
  },

  // ── Logout ─────────────────────────────────────────────────────
  logout() {
    localStorage.removeItem(this.KEYS.SESSION);
    localStorage.removeItem(this.KEYS.CURRENT_USER);
    window.location.href = "login.html";
  },

  // ── Check if logged in ─────────────────────────────────────────
  isLoggedIn() {
    try {
      const s = JSON.parse(localStorage.getItem(this.KEYS.SESSION));
      return !!(s && s.token && s.username);
    } catch { return false; }
  },

  // ── Get current session ────────────────────────────────────────
  getSession() {
    try { return JSON.parse(localStorage.getItem(this.KEYS.SESSION)); }
    catch { return null; }
  },

  // ── Guard: redirect to login if not authenticated ─────────────
  requireAuth() {
    if (!this.isLoggedIn()) {
      window.location.href = "login.html";
      return false;
    }
    return true;
  },

  // ── Change password ────────────────────────────────────────────
  async changePassword(username, oldPassword, newPassword) {
    const users = this.getUsers();
    const key   = username.trim().toLowerCase();
    const user  = users[key];
    if (!user) return { ok: false, msg: "User not found." };

    const oldHash = await this.hashPassword(oldPassword);
    if (oldHash !== user.passwordHash)
      return { ok: false, msg: "Current password is incorrect." };
    if (newPassword.length < 4)
      return { ok: false, msg: "New password must be at least 4 characters." };

    users[key].passwordHash = await this.hashPassword(newPassword);
    this.saveUsers(users);
    return { ok: true };
  },

  // ── Delete account ─────────────────────────────────────────────
  deleteAccount(username) {
    const users = this.getUsers();
    delete users[username.toLowerCase()];
    this.saveUsers(users);
    this.logout();
  },

  // ── Generate avatar initials + color ──────────────────────────
  generateAvatar(name) {
    const initials = name.trim().split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);
    const colors   = ["#2dd4bf","#60a5fa","#4ade80","#fb923c","#a78bfa","#f472b6","#fbbf24"];
    const color    = colors[name.charCodeAt(0) % colors.length];
    return { initials, color };
  },
};
