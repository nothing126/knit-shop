const API = ""; // same-origin

export async function logout() {
    try { await fetch(`${API}/api/auth/logout`, { method: "POST", credentials: "same-origin" }); } catch {}
    location.href = "/admin/login.html";
}

export async function api(path, options = {}) {
    const headers = options.headers ? { ...options.headers } : {};

    const res = await fetch(`${API}${path}`, { ...options, headers, credentials: "same-origin" });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || "Request failed");
    return data;
}

export async function mustAuth() {
    try {
        await api("/api/auth/me");
    } catch {
        location.href = "/admin/login.html";
        throw new Error("Unauthorized");
    }
}

export function qs(sel) { return document.querySelector(sel); }
export function qsa(sel) { return [...document.querySelectorAll(sel)]; }
export function escapeHtml(s) {
    return String(s ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#39;");
}
