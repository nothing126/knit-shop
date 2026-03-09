const API = ""; // same-origin

function getCookie(name) {
    const esc = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const m = document.cookie.match(new RegExp("(^|;\\s*)" + esc + "=([^;]*)"));
    return m ? decodeURIComponent(m[2]) : "";
}
function setCookie(name, value, days = 7) {
    const maxAge = days * 24 * 60 * 60;
    document.cookie = `${name}=${encodeURIComponent(value)}; Path=/; Max-Age=${maxAge}; SameSite=Lax`;
}
function delCookie(name) {
    document.cookie = `${name}=; Path=/; Max-Age=0; SameSite=Lax`;
}

export function getToken() {
    return getCookie("admin_token") || "";
}
export function setToken(t) {
    setCookie("admin_token", t || "", 7);
}
export async function logout() {
    delCookie("admin_token");
    // чистим и на сервере (на всякий)
    try { await fetch(`${API}/api/auth/logout`, { method: "POST", credentials: "same-origin" }); } catch {}
    location.href = "/admin/login.html";
}

export async function api(path, options = {}) {
    // теперь токен обычно приходит cookie’й, но оставим Bearer как fallback
    const token = getToken();
    const headers = options.headers ? { ...options.headers } : {};
    if (token) headers.Authorization = `Bearer ${token}`;

    const res = await fetch(`${API}${path}`, { ...options, headers, credentials: "same-origin" });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || "Request failed");
    return data;
}

export function mustAuth() {
    if (!getToken()) location.href = "/admin/login.html";
}

export function qs(sel) { return document.querySelector(sel); }
export function qsa(sel) { return [...document.querySelectorAll(sel)]; }