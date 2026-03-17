const API = "";

function getCookie(name) {
  const esc = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const m = document.cookie.match(new RegExp("(^|;\\s*)" + esc + "=([^;]*)"));
  return m ? decodeURIComponent(m[2]) : "";
}
function setCookie(name, value, days = 180) {
  const maxAge = days * 24 * 60 * 60;
  document.cookie = `${name}=${encodeURIComponent(value)}; Path=/; Max-Age=${maxAge}; SameSite=Lax`;
}

const DEFAULT_LANG = "ro";
const LANG_COOKIE = "knit_lang_v1";

function langFromPath() {
  const m = location.pathname.match(/^\/(ro|ru|en)(\/|$)/);
  return m ? m[1] : "";
}
function getLang() {
  const urlLang = langFromPath();
  if (urlLang) {
    if (getCookie(LANG_COOKIE) !== urlLang) setCookie(LANG_COOKIE, urlLang);
    return urlLang;
  }
  const c = getCookie(LANG_COOKIE);
  if (c && ["ro", "ru", "en"].includes(c)) return c;
  setCookie(LANG_COOKIE, DEFAULT_LANG);
  return DEFAULT_LANG;
}
function baseLangPrefix() {
  const lang = langFromPath() || getLang();
  return `/${lang}`;
}
function setLang(lang) {
  const v = ["ro", "ru", "en"].includes(lang) ? lang : DEFAULT_LANG;

  if (langFromPath()) {
    const newPath = location.pathname.replace(/^\/(ro|ru|en)(?=\/|$)/, `/${v}`);
    setCookie(LANG_COOKIE, v);
    location.href = newPath + location.search + location.hash;
    return;
  }

  const p = String(location.pathname || "/").toLowerCase();
  const map = {
    "/": `/${v}/`,
    "/index.html": `/${v}/`,
    "/shop.html": `/${v}/shop`,
    "/about.html": `/${v}/about`,
    "/contact.html": `/${v}/contact`,
    "/product.html": `/${v}/product`,
    "/week-picks.html": `/${v}/week-picks`,
  };
  const next = map[p] || `/${v}/`;
  setCookie(LANG_COOKIE, v);
  location.href = next + location.search + location.hash;
}

function pageT(key, fallback = "") {
  const box = document.getElementById("i18n");
  if (!box) return fallback || key;
  const v = box.getAttribute("data-" + key);
  return v && v.trim() ? v : fallback || key;
}

const CART_COOKIE = "knit_cart_v3";

function readCart() {
  try {
    const raw = getCookie(CART_COOKIE);
    if (!raw) return {};
    const obj = JSON.parse(raw);
    return obj && typeof obj === "object" ? obj : {};
  } catch {
    return {};
  }
}
function writeCart(cart) {
  setCookie(CART_COOKIE, JSON.stringify(cart || {}));
  updateCartBadge();
}
function addToCart(productId, qty = 1) {
  const cart = readCart();
  const key = String(productId);
  cart[key] = (Number(cart[key]) || 0) + Number(qty || 1);
  if (cart[key] <= 0) delete cart[key];
  writeCart(cart);
  renderCartDrawer().catch(() => {});
  showToast(pageT("add_to_cart", "Added to cart"));
}
function cartCount(cart = readCart()) {
  return Object.values(cart).reduce((a, b) => a + (Number(b) || 0), 0);
}
function updateCartBadge() {
  const el = document.getElementById("cartBadge");
  if (!el) return;
  const n = cartCount();
  el.textContent = n > 99 ? "99+" : String(n);
  el.style.display = n > 0 ? "inline-flex" : "none";
}

async function apiGet(url) {
  const r = await fetch(API + url, { credentials: "same-origin" });
  if (!r.ok) throw new Error(`GET ${url} -> ${r.status}`);
  return r.json();
}
function money(x) {
  const v = Number(x || 0);
  return v.toFixed(0);
}
function langUrl(pathWithLeadingSlash) {
  return baseLangPrefix() + pathWithLeadingSlash;
}
function escHtml(s) {
  return String(s || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

let SHOP = { categories: [], products: [] };
let PRODUCTS_CACHE = null;

async function getProductsCache() {
  if (Array.isArray(SHOP.products) && SHOP.products.length) return SHOP.products;
  if (!PRODUCTS_CACHE) PRODUCTS_CACHE = await apiGet("/api/public/products");
  return Array.isArray(PRODUCTS_CACHE) ? PRODUCTS_CACHE : [];
}

function getShopStateFromUI() {
  const q = (document.getElementById("q")?.value || "").trim();
  const categoryId = document.getElementById("category")?.value || "";
  const inStock = document.getElementById("inStock")?.checked ? "1" : "";
  const sort = document.getElementById("sort")?.value || "new";
  return { q, categoryId, inStock, sort };
}

function applySort(list, sort) {
  const arr = [...list];
  if (sort === "price_asc") {
    arr.sort((a, b) => Number(a.price || 0) - Number(b.price || 0));
  } else if (sort === "price_desc") {
    arr.sort((a, b) => Number(b.price || 0) - Number(a.price || 0));
  } else {
    arr.sort((a, b) =>
      String(b.updatedAt || b.createdAt || "").localeCompare(
        String(a.updatedAt || a.createdAt || ""),
      ),
    );
  }
  return arr;
}

function filterProducts() {
  const { q, categoryId, inStock, sort } = getShopStateFromUI();
  let list = [...(SHOP.products || [])];

  if (q) {
    const qq = q.toLowerCase();
    list = list.filter(
      (p) =>
        String(p.title || "")
          .toLowerCase()
          .includes(qq) ||
        String(p.description || "")
          .toLowerCase()
          .includes(qq),
    );
  }
  if (categoryId) {
    list = list.filter((p) => String(p.categoryId || "") === String(categoryId));
  }
  if (inStock === "1") {
    list = list.filter((p) => Number(p.inStock) === 1);
  }

  return applySort(list, sort);
}

function renderCategoriesSelect() {
  const sel = document.getElementById("category");
  if (!sel) return;

  sel.innerHTML = "";
  const optAll = document.createElement("option");
  optAll.value = "";
  optAll.textContent = pageT("all_categories", "All categories");
  sel.appendChild(optAll);

  for (const c of SHOP.categories || []) {
    const opt = document.createElement("option");
    opt.value = c.id;
    opt.textContent = c.name;
    sel.appendChild(opt);
  }
}

function productCardHtml(p) {
  const inStock = Number(p.inStock) === 1;
  const d = String(p.description || "").trim();
  const desc = d.length > 90 ? d.slice(0, 90) + "…" : d;
  return `
    <article class="product">
      <div class="thumb">
        ${p.imageUrl ? `<img src="${escHtml(p.imageUrl)}" alt="${escHtml(p.title || "")}" loading="lazy" />` : ""}
        <div class="tag">${escHtml(p.categoryName || "Handmade")}</div>
      </div>
      <div class="body">
        <h3>${escHtml(p.title || "")}</h3>
        ${desc ? `<div class="muted">${escHtml(desc)}</div>` : ""}
        <div class="price"><span>MDL</span><b>${money(p.price)}</b></div>
        <div class="mini-actions">
          <a class="btn small" href="${langUrl(`/product?id=${encodeURIComponent(p.id)}`)}">${pageT("details", "Details")}</a>
          <button class="btn small primary" type="button" data-add="${p.id}" ${inStock ? "" : "disabled"}>${inStock ? pageT("add_to_cart", "Add to cart") : pageT("out_stock", "Out of stock")}</button>
        </div>
      </div>
    </article>
  `;
}

function bindAddButtons(scope) {
  scope.querySelectorAll("[data-add]").forEach((btn) => {
    btn.addEventListener("click", () => addToCart(btn.getAttribute("data-add"), 1));
  });
}

function renderShop() {
  const grid = document.getElementById("grid");
  const empty = document.getElementById("empty");
  if (!grid) return;

  const list = filterProducts();
  grid.innerHTML = "";

  if (!list.length) {
    if (empty) {
      empty.style.display = "block";
      empty.textContent = pageT("empty_text", empty.textContent || "");
    }
    return;
  }
  if (empty) empty.style.display = "none";

  grid.innerHTML = list.map(productCardHtml).join("");
  bindAddButtons(grid);
}

function hookShopUI() {
  const q = document.getElementById("q");
  const category = document.getElementById("category");
  const inStock = document.getElementById("inStock");
  const sort = document.getElementById("sort");
  const reset = document.getElementById("resetFilters");

  const rerender = () => renderShop();
  if (q) q.addEventListener("input", rerender);
  if (category) category.addEventListener("change", rerender);
  if (inStock) inStock.addEventListener("change", rerender);
  if (sort) sort.addEventListener("change", rerender);

  if (reset) {
    reset.addEventListener("click", () => {
      if (q) q.value = "";
      if (category) category.value = "";
      if (inStock) inStock.checked = false;
      if (sort) sort.value = "new";
      renderShop();
    });
  }
}

async function initShop() {
  const hasCategoryFilter = Boolean(document.getElementById("category"));
  const [cats, prods] = await Promise.all([
    hasCategoryFilter ? apiGet("/api/public/categories") : Promise.resolve([]),
    apiGet("/api/public/products"),
  ]);

  SHOP.categories = Array.isArray(cats) ? cats : [];
  SHOP.products = Array.isArray(prods) ? prods : [];

  if (hasCategoryFilter) renderCategoriesSelect();
  hookShopUI();
  renderShop();
}

function openDrawer() {
  document.body.classList.add("drawer-open");
}
function closeDrawer() {
  document.body.classList.remove("drawer-open");
}

async function renderCartDrawer() {
  const listEl = document.getElementById("cartList");
  const emptyEl = document.getElementById("cartEmpty");
  const totalEl = document.getElementById("cartTotal");
  if (!listEl || !emptyEl || !totalEl) return;

  const cart = readCart();
  const ids = Object.keys(cart);
  if (!ids.length) {
    listEl.innerHTML = "";
    emptyEl.style.display = "block";
    totalEl.textContent = `${money(0)} MDL`;
    return;
  }

  emptyEl.style.display = "none";
  const products = await getProductsCache().catch(() => []);
  const map = new Map((products || []).map((p) => [String(p.id), p]));

  let total = 0;
  listEl.innerHTML = ids
    .map((id) => {
      const qty = Number(cart[id] || 0);
      const p = map.get(String(id));
      const price = Number(p?.price || 0);
      total += price * qty;
      return `
      <div class="cart-item" data-id="${escHtml(id)}">
        ${p?.imageUrl ? `<img src="${escHtml(p.imageUrl)}" alt="${escHtml(p.title || "")}" />` : `<div class="ph"></div>`}
        <div>
          <h5>${escHtml(p?.title || `#${id}`)}</h5>
          <div class="meta">${money(price)} MDL</div>
          <div class="qty" style="margin-top:8px">
            <button type="button" data-dec="${escHtml(id)}">-</button>
            <span>${qty}</span>
            <button type="button" data-inc="${escHtml(id)}">+</button>
          </div>
        </div>
        <button class="btn small" type="button" data-del="${escHtml(id)}">×</button>
      </div>
    `;
    })
    .join("");

  totalEl.textContent = `${money(total)} MDL`;

  listEl.querySelectorAll("[data-inc]").forEach((btn) => {
    btn.addEventListener("click", () => {
      addToCart(btn.getAttribute("data-inc"), 1);
    });
  });
  listEl.querySelectorAll("[data-dec]").forEach((btn) => {
    btn.addEventListener("click", () => {
      addToCart(btn.getAttribute("data-dec"), -1);
    });
  });
  listEl.querySelectorAll("[data-del]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = String(btn.getAttribute("data-del"));
      const cartNow = readCart();
      delete cartNow[id];
      writeCart(cartNow);
      renderCartDrawer().catch(() => {});
    });
  });
}

function initCartUI() {
  const cartBtn = document.getElementById("cartBtn");
  const closeBtn = document.getElementById("cartClose");
  const back = document.getElementById("drawerBackdrop");
  const checkout = document.getElementById("checkoutBtn");

  if (cartBtn) {
    cartBtn.addEventListener("click", () => {
      renderCartDrawer().catch(() => {});
      openDrawer();
    });
  }
  if (closeBtn) closeBtn.addEventListener("click", closeDrawer);
  if (back) back.addEventListener("click", closeDrawer);
  if (checkout) {
    checkout.addEventListener("click", () => {
      showToast(pageT("checkout", "Checkout"));
    });
  }
}

function showToast(text) {
  const el = document.getElementById("toast");
  if (!el) return;
  el.textContent = text;
  el.classList.add("show");
  setTimeout(() => el.classList.remove("show"), 1400);
}

async function initProductPage() {
  const root = document.getElementById("productRoot");
  if (!root) return;

  const id = new URL(location.href).searchParams.get("id");
  if (!id) return;

  const p = await apiGet(`/api/public/products/${encodeURIComponent(id)}`);
  document.getElementById("pTag").textContent = p.categoryName || "Handmade";
  document.getElementById("pName").textContent = p.title || "—";
  document.getElementById("pPrice").textContent = `${money(p.price)} MDL`;
  document.getElementById("pDesc").textContent = p.description || "";
  document.getElementById("pCat").textContent = p.categoryName || "—";
  document.getElementById("pCare").textContent = p.care || "30°C";
  document.getElementById("pChosen").textContent = Number(p.isWeekPick)
    ? pageT("week_title", "Week pick")
    : pageT("sort_new", "New");

  const main = root.querySelector(".gallery .main");
  if (main && p.imageUrl) {
    main.style.backgroundImage = `url('${p.imageUrl}')`;
  }

  const add = document.getElementById("pAdd");
  const buyNow = document.getElementById("pBuyNow");
  if (add) add.addEventListener("click", () => addToCart(p.id, 1));
  if (buyNow) {
    buyNow.addEventListener("click", () => {
      addToCart(p.id, 1);
      renderCartDrawer().catch(() => {});
      openDrawer();
    });
  }

  const rec = document.getElementById("recommendGrid");
  if (rec) {
    const all = await getProductsCache().catch(() => []);
    const list = all
      .filter((x) => String(x.id) !== String(p.id))
      .filter((x) => !p.categoryId || String(x.categoryId) === String(p.categoryId))
      .slice(0, 3);
    rec.innerHTML = list.map(productCardHtml).join("");
    bindAddButtons(rec);
  }
}

async function initWeekPicksPage() {
  const grid = document.getElementById("weekPicksGrid");
  if (!grid) return;

  const title = document.getElementById("weekTitle");
  const sub = document.getElementById("weekSubtitle");

  const [pick, products] = await Promise.all([
    apiGet("/api/public/week-picks/active").catch(() => null),
    getProductsCache().catch(() => []),
  ]);

  let items = products || [];
  if (pick && Array.isArray(pick.productIds) && pick.productIds.length) {
    const set = new Set(pick.productIds.map(String));
    items = items.filter((p) => set.has(String(p.id)));
    if (title && pick.title) title.textContent = pick.title;
    if (sub && pick.subtitle) sub.textContent = pick.subtitle;
  }

  grid.innerHTML = items.slice(0, 9).map(productCardHtml).join("");
  bindAddButtons(grid);
}

async function initHomeWeekPicks() {
  const grid = document.getElementById("homeGrid");
  if (!grid) return;

  const [pick, products] = await Promise.all([
    apiGet("/api/public/week-picks/active").catch(() => null),
    getProductsCache().catch(() => []),
  ]);

  let items = products || [];
  if (pick && Array.isArray(pick.productIds) && pick.productIds.length) {
    const set = new Set(pick.productIds.map(String));
    items = items.filter((p) => set.has(String(p.id)));
    const sub = document.getElementById("weekSubtitle");
    const title = document.getElementById("weekTitle");
    if (sub && pick.subtitle) {
      sub.style.display = "block";
      sub.textContent = pick.subtitle;
    }
    if (title && pick.title) title.textContent = pick.title;
  }

  grid.innerHTML = items.slice(0, 6).map(productCardHtml).join("");
  bindAddButtons(grid);
}

function initLangSelect() {
  const sel = document.getElementById("langSelect");
  if (!sel) return;
  sel.value = getLang();
  sel.addEventListener("change", () => setLang(sel.value));
}

function initMobileMenu() {
  const box = document.getElementById("mobileLinks");
  const btn = document.getElementById("burgerBtn");
  if (!box || !btn) return;

  if (!box.id) box.id = "mobileLinks";
  btn.setAttribute("aria-controls", box.id);
  btn.setAttribute("aria-expanded", "false");

  const setOpen = (open) => {
    box.classList.toggle("is-open", open);
    btn.setAttribute("aria-expanded", open ? "true" : "false");
  };
  const isOpen = () => box.classList.contains("is-open");

  setOpen(false);
  btn.addEventListener("click", (e) => {
    e.stopPropagation();
    setOpen(!isOpen());
  });
  document.addEventListener("click", (e) => {
    if (!isOpen()) return;
    if (box.contains(e.target) || btn.contains(e.target)) return;
    setOpen(false);
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") setOpen(false);
  });
  window.addEventListener("resize", () => {
    if (window.innerWidth > 860) setOpen(false);
  });
  box.querySelectorAll("a").forEach((a) => {
    a.addEventListener("click", () => setOpen(false));
  });
}

function initReveal() {
  const els = [...document.querySelectorAll(".reveal")];
  if (!els.length) return;
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          e.target.classList.add("on");
          io.unobserve(e.target);
        }
      });
    },
    { threshold: 0.12 },
  );
  els.forEach((el) => io.observe(el));
}

function initYear() {
  document.querySelectorAll("[data-year]").forEach((el) => {
    el.textContent = String(new Date().getFullYear());
  });
}

function initContactForm() {
  const form = document.getElementById("contactForm");
  if (!form) return;
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    showToast(pageT("send", "Sent"));
    form.reset();
  });
}

window.KNIT = {
  t: pageT,
  formatMoney: money,
  addToCart,
  openCart: () => {
    renderCartDrawer().catch(() => {});
    openDrawer();
  },
};

document.addEventListener("DOMContentLoaded", () => {
  initLangSelect();
  initMobileMenu();
  initYear();
  initReveal();
  initCartUI();
  initContactForm();
  updateCartBadge();
  renderCartDrawer().catch(() => {});

  if (document.getElementById("shopPage") || document.getElementById("grid")) {
    initShop().catch((e) => console.error(e));
  }
  initProductPage().catch((e) => console.error(e));
  initHomeWeekPicks().catch((e) => console.error(e));
  initWeekPicksPage().catch((e) => console.error(e));
});
