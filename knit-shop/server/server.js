import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import fs from "fs";
import jwt from "jsonwebtoken";
import multer from "multer";
import { fileURLToPath } from "url";
import { db, initDb } from "./db.js";

dotenv.config();
initDb();

const app = express();

// ✅ CORS + cookies
app.use(
  cors({
    origin: true,
    credentials: true,
  }),
);

app.use(express.json());

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const uploadsDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

app.use("/uploads", express.static(uploadsDir));

// =========================
// 🍪 Cookie helpers
// =========================
function parseCookies(req) {
  const header = req.headers.cookie || "";
  const out = {};
  header.split(";").forEach((p) => {
    const i = p.indexOf("=");
    if (i < 0) return;
    const k = p.slice(0, i).trim();
    const v = p.slice(i + 1).trim();
    if (!k) return;
    out[k] = decodeURIComponent(v || "");
  });
  return out;
}

function setCookie(
  res,
  name,
  value,
  { maxAgeDays = 365, cookiePath = "/", sameSite = "Lax" } = {},
) {
  const maxAge = maxAgeDays * 24 * 60 * 60;
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  res.setHeader(
    "Set-Cookie",
    `${name}=${encodeURIComponent(String(value ?? ""))}; Max-Age=${maxAge}; Path=${cookiePath}; SameSite=${sameSite}${secure}`,
  );
}
function clearCookie(res, name, { cookiePath = "/" } = {}) {
  res.setHeader(
    "Set-Cookie",
    `${name}=; Max-Age=0; Path=${cookiePath}; SameSite=Lax`,
  );
}

// =========================
// 🌍 SEO language routing + SSR i18n
// =========================
const DEFAULT_LANG = "ro";
const LANG_COOKIE = "knit_lang_v1";
const LANGS = new Set(["ro", "ru", "en"]);

const I18N = {
  ro: {
    nav_catalog: "Catalog",
    nav_about: "Despre brand",
    nav_contact: "Contacte",
    nav_home: "Acasă",
    nav_back: "← Înapoi",
    brand_subtitle: "tricotaje handmade • colecții mici",

    shop_kicker: "Colecție",
    shop_title: "Catalog",
    shop_desc: "Filtre, căutare și sortare — găsești rapid ce ai nevoie.",
    search_placeholder: "Caută: pulover, căciulă, premium…",
    all_categories: "Toate categoriile",
    in_stock_only: "Doar în stoc",
    sort_new: "Noi",
    sort_price_asc: "Preț ↑",
    sort_price_desc: "Preț ↓",
    reset: "Reset",

    cart: "Coș",
    empty_kicker: "Gol",
    empty_text: "Adaugă ceva drăguț ✨",
    total: "Total",
    checkout: "Finalizează (demo)",
    details: "Detalii",
    add_to_cart: "Adaugă în coș",
    out_stock: "Indisponibil",
    footer_demo: "demo",
    go_to_catalog: "Mergi la catalog",

    hero_kicker: "Colecție nouă • nuanțe calde",
    hero_h1_html: "Tricotaje<br/>care arată scump",
    hero_p: "Piese tricotate cu texturi moi, culori curate și croiuri ușor de purtat zilnic.",
    open_catalog: "Deschide catalogul",
    about_btn: "Despre brand",
    why_us: "De ce noi",
    why_us_p: "Materiale plăcute la atingere, loturi mici și atenție la detalii.",
    delivery: "Livrare",
    delivery_p: "Livrare rapidă în toată țara. Ambalaj sigur și estetic.",
    handmade: "Handmade",
    bestsellers: "Bestsellers",
    week_title: "Alegerea săptămânii",
    see_all: "Vezi tot →",
    care: "Îngrijire",
    care_title: "Ca să țină mult",
    care_p: "Spălare delicată la 30°C, fără stoarcere puternică, uscare pe plan drept.",
    care_chip_1: "30°C",
    care_chip_2: "fără stoarcere",
    care_chip_3: "uscare pe plan drept",
    gift_pack: "Ambalaj cadou",
    gift_title: "Un “wow” drăguț",
    gift_p: "Putem pregăti produsul într-un set de cadou gata de oferit.",
    want_gift: "Vreau set cadou",

    product_page: "pagina produsului",
    size: "Mărime",
    color: "Culoare",
    buy_now: "Cumpără acum",
    category: "Categorie",
    care_short: "Îngrijire",
    recs: "Recomandări",
    pairs: "Se potrivește perfect",
    ask_question: "Pune o întrebare",

    about_kicker: "Despre brand",
    about_h1: "Căldura este design",
    about_p: "Cream tricotaje comode și elegante, care arată premium în fiecare zi.",
    values: "Valori",
    values_p: "Calitate stabilă, producție mică și confort real în purtare.",
    approach: "Abordare",
    approach_p: "Selectăm fire potrivite sezonului și păstrăm croiul curat, fără exces.",
    view_catalog: "Vezi catalogul →",
    story_title: "Poveste",
    story_p1: "Warm Knit a pornit din dorința de a face lucruri simple, frumoase și purtabile.",
    story_p2: "Fiecare model este testat pe confort, rezistență și aspect final.",
    write_us: "Scrie-ne",

    contact_kicker: "Contact",
    contact_h1: "Scrie-ne",
    contact_p: "Răspundem rapid la întrebări despre mărimi, culori, livrare și comenzi.",
    name: "Nume",
    name_ph: "Numele tău",
    email: "Email",
    msg: "Mesaj",
    msg_ph: "Spune-ne ce cauți…",
    send: "Trimite",
    socials: "Social / info",
    we_are_close: "Suntem aproape",
    q_gift: "ambalaj cadou",
    q_custom: "mărimi personalizate",
    q_small: "loturi mici",
  },
  ru: {
    nav_catalog: "Каталог",
    nav_about: "О бренде",
    nav_contact: "Контакты",
    nav_home: "Главная",
    nav_back: "← Назад",
    brand_subtitle: "вязаный хендмейд • небольшие коллекции",

    shop_kicker: "Коллекция",
    shop_title: "Каталог",
    shop_desc: "Фильтры, поиск и сортировка — находите нужное быстро.",
    search_placeholder: "Поиск: свитер, шапка, premium…",
    all_categories: "Все категории",
    in_stock_only: "Только в наличии",
    sort_new: "Новые",
    sort_price_asc: "Цена ↑",
    sort_price_desc: "Цена ↓",
    reset: "Сброс",

    cart: "Корзина",
    empty_kicker: "Пусто",
    empty_text: "Добавь что-нибудь милое ✨",
    total: "Итого",
    checkout: "Оформить (демо)",
    details: "Подробнее",
    add_to_cart: "В корзину",
    out_stock: "Нет в наличии",
    footer_demo: "demo",
    go_to_catalog: "Перейти в каталог",

    hero_kicker: "Новая коллекция • тёплые оттенки",
    hero_h1_html: "Трикотаж,<br/>который выглядит дорого",
    hero_p: "Мягкие фактуры, чистые цвета и комфортный крой на каждый день.",
    open_catalog: "Открыть каталог",
    about_btn: "О бренде",
    why_us: "Почему мы",
    why_us_p: "Приятные материалы, маленькие партии и внимание к деталям.",
    delivery: "Доставка",
    delivery_p: "Быстрая доставка по стране. Аккуратная и надежная упаковка.",
    handmade: "Handmade",
    bestsellers: "Бестселлеры",
    week_title: "Выбор недели",
    see_all: "Смотреть всё →",
    care: "Уход",
    care_title: "Чтобы служило долго",
    care_p: "Деликатная стирка 30°C, без сильного отжима, сушить горизонтально.",
    care_chip_1: "30°C",
    care_chip_2: "без сильного отжима",
    care_chip_3: "сушить горизонтально",
    gift_pack: "Подарочная упаковка",
    gift_title: "Милый “wow” эффект",
    gift_p: "Подготовим товар как готовый подарочный набор.",
    want_gift: "Хочу подарочный набор",

    product_page: "страница товара",
    size: "Размер",
    color: "Цвет",
    buy_now: "Купить сейчас",
    category: "Категория",
    care_short: "Уход",
    recs: "Рекомендации",
    pairs: "Идеально сочетается",
    ask_question: "Задать вопрос",

    about_kicker: "О бренде",
    about_h1: "Тепло — это дизайн",
    about_p: "Мы делаем трикотаж, который выглядит аккуратно и ощущается по-настоящему комфортно.",
    values: "Ценности",
    values_p: "Стабильное качество, небольшие партии и честный комфорт в носке.",
    approach: "Подход",
    approach_p: "Подбираем пряжу по сезону и сохраняем чистый силуэт без лишнего.",
    view_catalog: "Смотреть каталог →",
    story_title: "История",
    story_p1: "Warm Knit начался с идеи делать простые, красивые и удобные вещи.",
    story_p2: "Каждую модель проверяем на комфорт, долговечность и внешний вид.",
    write_us: "Написать нам",

    contact_kicker: "Контакты",
    contact_h1: "Напишите нам",
    contact_p: "Быстро отвечаем по размерам, цветам, доставке и заказам.",
    name: "Имя",
    name_ph: "Ваше имя",
    email: "Email",
    msg: "Сообщение",
    msg_ph: "Расскажите, что вам нужно…",
    send: "Отправить",
    socials: "Соцсети / инфо",
    we_are_close: "Мы рядом",
    q_gift: "подарочная упаковка",
    q_custom: "индивидуальные размеры",
    q_small: "малые партии",
  },
  en: {
    nav_catalog: "Catalog",
    nav_about: "About",
    nav_contact: "Contact",
    nav_home: "Home",
    nav_back: "← Back",
    brand_subtitle: "handmade knitwear • small batches",

    shop_kicker: "Collection",
    shop_title: "Catalog",
    shop_desc: "Filters, search, and sorting help you find items quickly.",
    search_placeholder: "Search: sweater, hat, premium…",
    all_categories: "All categories",
    in_stock_only: "In stock only",
    sort_new: "New",
    sort_price_asc: "Price ↑",
    sort_price_desc: "Price ↓",
    reset: "Reset",

    cart: "Cart",
    empty_kicker: "Empty",
    empty_text: "Add something cute ✨",
    total: "Total",
    checkout: "Checkout (demo)",
    details: "Details",
    add_to_cart: "Add to cart",
    out_stock: "Out of stock",
    footer_demo: "demo",
    go_to_catalog: "Go to catalog",

    hero_kicker: "New collection • warm tones",
    hero_h1_html: "Knitwear<br/>that looks premium",
    hero_p: "Soft textures, clean colors, and easy silhouettes for everyday wear.",
    open_catalog: "Open catalog",
    about_btn: "About brand",
    why_us: "Why us",
    why_us_p: "Pleasant materials, small batches, and attention to detail.",
    delivery: "Delivery",
    delivery_p: "Fast nationwide delivery. Safe and beautiful packaging.",
    handmade: "Handmade",
    bestsellers: "Bestsellers",
    week_title: "Week picks",
    see_all: "See all →",
    care: "Care",
    care_title: "Made to last",
    care_p: "Gentle wash at 30°C, avoid strong spinning, dry flat.",
    care_chip_1: "30°C",
    care_chip_2: "no heavy spinning",
    care_chip_3: "dry flat",
    gift_pack: "Gift wrap",
    gift_title: "A lovely wow-effect",
    gift_p: "We can prepare your order as a ready-to-gift set.",
    want_gift: "I want a gift set",

    product_page: "product page",
    size: "Size",
    color: "Color",
    buy_now: "Buy now",
    category: "Category",
    care_short: "Care",
    recs: "Recommendations",
    pairs: "Pairs perfectly",
    ask_question: "Ask a question",

    about_kicker: "About brand",
    about_h1: "Warmth is design",
    about_p: "We create knitwear that feels comfortable and looks premium every day.",
    values: "Values",
    values_p: "Stable quality, small production runs, and real wearing comfort.",
    approach: "Approach",
    approach_p: "We choose yarns for each season and keep silhouettes clean and timeless.",
    view_catalog: "View catalog →",
    story_title: "Story",
    story_p1: "Warm Knit started with a simple idea: make pieces that are beautiful and wearable.",
    story_p2: "Every model is tested for comfort, durability, and final look.",
    write_us: "Write to us",

    contact_kicker: "Contact",
    contact_h1: "Write to us",
    contact_p: "We quickly answer questions about sizes, colors, delivery, and orders.",
    name: "Name",
    name_ph: "Your name",
    email: "Email",
    msg: "Message",
    msg_ph: "Tell us what you are looking for…",
    send: "Send",
    socials: "Social / info",
    we_are_close: "We are here",
    q_gift: "gift wrap",
    q_custom: "custom sizing",
    q_small: "small batches",
  },
};

function normalizeLang(x) {
  const v = String(x || "").toLowerCase();
  return LANGS.has(v) ? v : DEFAULT_LANG;
}
function detectLang(req) {
  const cookies = parseCookies(req);
  return normalizeLang(cookies[LANG_COOKIE] || DEFAULT_LANG);
}
function t(lang, key) {
  return (
    (I18N[lang] && I18N[lang][key]) ||
    (I18N[DEFAULT_LANG] && I18N[DEFAULT_LANG][key]) ||
    key
  );
}
function escapeHtml(s) {
  return String(s)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function rewriteLinksToLangUrls(html, lang) {
  const map = {
    "index.html": `/${lang}/`,
    "shop.html": `/${lang}/shop`,
    "about.html": `/${lang}/about`,
    "contact.html": `/${lang}/contact`,
    "product.html": `/${lang}/product`,
    "week-picks.html": `/${lang}/week-picks`,
  };
  html = html.replace(
    /href="(index\.html|shop\.html|about\.html|contact\.html|product\.html|week-picks\.html)"/g,
    (m, file) => `href="${map[file] || `/${lang}/`}"`,
  );
  html = html.replace(
    /href="(index\.html|shop\.html|about\.html|contact\.html|product\.html|week-picks\.html)(#[^"]+)"/g,
    (m, file, hash) => `href="${(map[file] || `/${lang}/`) + hash}"`,
  );
  return html;
}

function applyI18nToHtml(html, lang) {
  html = html.replace(
    /<html([^>]*)\slang="[^"]*"([^>]*)>/i,
    `<html$1 lang="${lang}"$2>`,
  );

  html = html.replace(
    /(<[^>]*\sdata-i18n-html="([^"]+)"[^>]*>)([\s\S]*?)(<\/[^>]+>)/g,
    (m, open, key, _old, close) => `${open}${t(lang, key)}${close}`,
  );

  html = html.replace(
    /(<[^>]*\sdata-i18n="([^"]+)"[^>]*>)([\s\S]*?)(<\/[^>]+>)/g,
    (m, open, key, _old, close) => `${open}${escapeHtml(t(lang, key))}${close}`,
  );

  html = html.replace(/data-i18n-placeholder="([^"]+)"/g, (m, key) => {
    const val = t(lang, key);
    return `${m} placeholder="${escapeHtml(val)}"`;
  });

  const dict = I18N[lang] || I18N[DEFAULT_LANG];
  const i18nAttrs = Object.keys(dict)
    .map((k) => ` data-${k}="${escapeHtml(dict[k])}"`)
    .join("");
  const i18nDiv = `<div id="i18n"${i18nAttrs} style="display:none!important"></div>`;

  if (!/id="i18n"/.test(html)) {
    html = html.replace(/<body([^>]*)>/i, `<body$1>\n${i18nDiv}\n`);
  }

  html = html.replace(/href="\/css\//g, `href="/${lang}/css/`);
  html = html.replace(/src="\/js\//g, `src="/${lang}/js/`);

  html = rewriteLinksToLangUrls(html, lang);
  return html;
}

// =========================
// AUTH
// =========================
function signToken() {
  return jwt.sign({ role: "admin" }, process.env.JWT_SECRET, {
    expiresIn: "7d",
  });
}
function auth(req, res, next) {
  const cookies = parseCookies(req);
  const header = req.headers.authorization || "";
  const bearer = header.startsWith("Bearer ") ? header.slice(7) : null;
  const token = bearer || cookies.admin_token || null;
  if (!token) return res.status(401).json({ error: "No token" });
  try {
    jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
    return res.status(401).json({ error: "Invalid token" });
  }
}

app.post("/api/auth/login", (req, res) => {
  const { username, password } = req.body || {};
  if (
    username === process.env.ADMIN_USER &&
    password === process.env.ADMIN_PASS
  ) {
    const token = signToken();
    setCookie(res, "admin_token", token, { maxAgeDays: 7, cookiePath: "/" });
    return res.json({ token });
  }
  return res.status(401).json({ error: "Wrong credentials" });
});

app.post("/api/auth/logout", (req, res) => {
  clearCookie(res, "admin_token", { cookiePath: "/" });
  res.json({ ok: true });
});

// =========================
// MULTER upload
// =========================
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname || "").toLowerCase();
    const safeExt = ext && ext.length <= 8 ? ext : ".jpg";
    cb(null, `p_${Date.now()}_${Math.round(Math.random() * 1e9)}${safeExt}`);
  },
});
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname || "").toLowerCase();
    const allowedExt = new Set([".jpg", ".jpeg", ".png", ".webp", ".gif"]);
    const isImage = String(file.mimetype || "").startsWith("image/");
    if (!isImage || !allowedExt.has(ext)) {
      return cb(new Error("Only image uploads are allowed"));
    }
    cb(null, true);
  },
});

function makeSlug(str) {
  return String(str || "")
    .trim()
    .toLowerCase()
    .replace(/ё/g, "e")
    .replace(/[^a-z0-9а-я]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

// =========================
// WEEK PICK helpers (для isWeekPick)
// =========================
function getActiveWeekPickIds(cb) {
  db.get(
    "SELECT productIds FROM week_picks WHERE isActive=1 ORDER BY updatedAt DESC LIMIT 1",
    [],
    (err, row) => {
      if (err) return cb(err, []);
      let ids = [];
      try {
        ids = JSON.parse(row?.productIds || "[]");
      } catch {
        ids = [];
      }
      ids = Array.isArray(ids) ? ids.map(Number).filter(Boolean) : [];
      cb(null, ids);
    },
  );
}
function attachIsWeekPick(rows, weekIds) {
  const set = new Set((weekIds || []).map(Number));
  return (rows || []).map((r) => ({
    ...r,
    isWeekPick: set.has(Number(r.id)) ? 1 : 0,
  }));
}
function parseProductIds(raw) {
  try {
    const arr = JSON.parse(raw || "[]");
    return Array.isArray(arr) ? arr.map(Number).filter(Boolean) : [];
  } catch {
    return [];
  }
}
function normalizeTranslateLang(v) {
  const x = String(v || "").toLowerCase().trim();
  return LANGS.has(x) ? x : "";
}
async function translateFree(text, from, to) {
  const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(
    text,
  )}&langpair=${from}|${to}`;
  const r = await fetch(url, {
    headers: { Accept: "application/json" },
  });
  if (!r.ok) throw new Error(`Translate HTTP ${r.status}`);
  const data = await r.json();
  const out = String(data?.responseData?.translatedText || "").trim();
  if (!out) throw new Error("Empty translation");
  return out;
}
function pickLocalized(base, row, lang, field) {
  const v = String(row?.[`${field}_${lang}`] || "").trim();
  if (v) return v;
  return String(base || "");
}
function localizeProductRow(row, lang) {
  if (!row) return row;
  return {
    ...row,
    title: pickLocalized(row.title, row, lang, "title"),
    description: pickLocalized(row.description, row, lang, "description"),
  };
}

// =========================
// CATEGORIES
// =========================
app.get("/api/categories", (req, res) => {
  db.all("SELECT * FROM categories ORDER BY name ASC", [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.get("/api/public/categories", (req, res) => {
  db.all(
    "SELECT * FROM categories WHERE isActive=1 ORDER BY name ASC",
    [],
    (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(rows);
    },
  );
});

app.post("/api/categories", auth, (req, res) => {
  const body = req.body || {};
  const name = String(body.name || "").trim();
  let slug = String(body.slug || "").trim();
  const isActive = Number(body.isActive ?? 1) ? 1 : 0;

  if (!name) return res.status(400).json({ error: "Name required" });
  if (!slug) slug = makeSlug(name);

  db.run(
    "INSERT INTO categories(name, slug, isActive) VALUES(?,?,?)",
    [name, slug, isActive],
    function (err) {
      if (err) return res.status(400).json({ error: err.message });
      res.json({ id: this.lastID, name, slug, isActive });
    },
  );
});

app.put("/api/categories/:id", auth, (req, res) => {
  const id = Number(req.params.id);
  const body = req.body || {};

  const name = String(body.name || "").trim();
  let slug = String(body.slug || "").trim();
  const isActive = Number(body.isActive ?? 1) ? 1 : 0;

  if (!id) return res.status(400).json({ error: "Bad id" });
  if (!name) return res.status(400).json({ error: "Name required" });
  if (!slug) slug = makeSlug(name);

  db.run(
    "UPDATE categories SET name=?, slug=?, isActive=? WHERE id=?",
    [name, slug, isActive, id],
    function (err) {
      if (err) return res.status(400).json({ error: err.message });
      res.json({ ok: true, id, name, slug, isActive });
    },
  );
});

app.put("/api/categories/:id/active", auth, (req, res) => {
  const id = Number(req.params.id);
  const { isActive } = req.body || {};
  const v = Number(isActive) ? 1 : 0;

  db.run(
    "UPDATE categories SET isActive=? WHERE id=?",
    [v, id],
    function (err) {
      if (err) return res.status(400).json({ error: err.message });
      res.json({ ok: true });
    },
  );
});

app.delete("/api/categories/:id", auth, (req, res) => {
  const id = Number(req.params.id);
  db.run("DELETE FROM categories WHERE id=?", [id], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ ok: true });
  });
});

app.post("/api/tools/translate", auth, async (req, res) => {
  try {
    const body = req.body || {};
    const text = String(body.text || "").trim();
    const from = normalizeTranslateLang(body.from);
    const to = normalizeTranslateLang(body.to);

    if (!text) return res.status(400).json({ error: "Text required" });
    if (!from || !to) return res.status(400).json({ error: "Bad languages" });
    if (from === to)
      return res.json({ translatedText: text, provider: "noop" });

    const translatedText = await translateFree(text, from, to);
    res.json({ translatedText, provider: "mymemory" });
  } catch (e) {
    res
      .status(502)
      .json({ error: "Translate failed", details: String(e.message || e) });
  }
});

// =========================
// PRODUCTS query (✅ FIX: categorySlug)
// =========================
function buildProductsQuery({
  q = "",
  categoryId = "",
  inStock = "",
  onlyActive = false,
}) {
  const filters = [];
  const params = [];

  if (q) {
    filters.push("(p.title LIKE ? OR p.description LIKE ? OR p.title_ro LIKE ? OR p.title_ru LIKE ? OR p.title_en LIKE ? OR p.description_ro LIKE ? OR p.description_ru LIKE ? OR p.description_en LIKE ?)");
    params.push(`%${q}%`, `%${q}%`, `%${q}%`, `%${q}%`, `%${q}%`, `%${q}%`, `%${q}%`, `%${q}%`);
  }
  if (categoryId) {
    filters.push("p.categoryId = ?");
    params.push(Number(categoryId));
  }
  if (inStock === "1" || inStock === "0") {
    filters.push("p.inStock = ?");
    params.push(Number(inStock));
  }
  if (onlyActive) {
    filters.push("p.isActive = 1");
  }

  const where = filters.length ? `WHERE ${filters.join(" AND ")}` : "";
  const sql = `
    SELECT p.*,
           c.name as categoryName,
           c.slug as categorySlug
    FROM products p
      LEFT JOIN categories c ON c.id = p.categoryId
    ${where}
    ORDER BY p.updatedAt DESC
  `;
  return { sql, params };
}

// ADMIN products (✅ + isWeekPick)
app.get("/api/products", auth, (req, res) => {
  const { q = "", categoryId = "", inStock = "" } = req.query;
  const { sql, params } = buildProductsQuery({
    q,
    categoryId,
    inStock,
    onlyActive: false,
  });

  db.all(sql, params, (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });

    getActiveWeekPickIds((e2, ids) => {
      if (e2) return res.status(500).json({ error: e2.message });
      res.json(attachIsWeekPick(rows, ids));
    });
  });
});

// PUBLIC products (✅ + isWeekPick)
app.get("/api/public/products", (req, res) => {
  const { q = "", categoryId = "", inStock = "" } = req.query;
  const { sql, params } = buildProductsQuery({
    q,
    categoryId,
    inStock,
    onlyActive: true,
  });
  const lang = detectLang(req);

  db.all(sql, params, (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });

    getActiveWeekPickIds((e2, ids) => {
      if (e2) return res.status(500).json({ error: e2.message });
      const withWeek = attachIsWeekPick(rows, ids);
      res.json(withWeek.map((r) => localizeProductRow(r, lang)));
    });
  });
});

// product by id (✅ + categorySlug)
app.get("/api/products/:id", auth, (req, res) => {
  const id = Number(req.params.id);
  db.get(
    `SELECT p.*,
            c.name as categoryName,
            c.slug as categorySlug
     FROM products p
       LEFT JOIN categories c ON c.id=p.categoryId
     WHERE p.id=?`,
    [id],
    (err, row) => {
      if (err) return res.status(500).json({ error: err.message });
      if (!row) return res.status(404).json({ error: "Not found" });

      getActiveWeekPickIds((e2, ids) => {
        if (e2) return res.status(500).json({ error: e2.message });
        const set = new Set(ids.map(Number));
        res.json({ ...row, isWeekPick: set.has(Number(row.id)) ? 1 : 0 });
      });
    },
  );
});
app.get("/api/public/products/:id", (req, res) => {
  const id = Number(req.params.id);
  const lang = detectLang(req);
  db.get(
    `SELECT p.*,
            c.name as categoryName,
            c.slug as categorySlug
     FROM products p
       LEFT JOIN categories c ON c.id=p.categoryId
     WHERE p.id=? AND p.isActive=1`,
    [id],
    (err, row) => {
      if (err) return res.status(500).json({ error: err.message });
      if (!row) return res.status(404).json({ error: "Not found" });

      getActiveWeekPickIds((e2, ids) => {
        if (e2) return res.status(500).json({ error: e2.message });
        const set = new Set(ids.map(Number));
        const localized = localizeProductRow(row, lang);
        res.json({ ...localized, isWeekPick: set.has(Number(row.id)) ? 1 : 0 });
      });
    },
  );
});

// create product
app.post("/api/products", auth, upload.single("image"), (req, res) => {
  const body = req.body || {};
  const imageUrl = req.file ? `/uploads/${req.file.filename}` : null;

  const titleBase = (body.title || "").trim();
  const titleRo = (body.title_ro || "").trim();
  const titleRu = (body.title_ru || "").trim();
  const titleEn = (body.title_en || "").trim();
  const descriptionBase = (body.description || "").trim();
  const descriptionRo = (body.description_ro || "").trim();
  const descriptionRu = (body.description_ru || "").trim();
  const descriptionEn = (body.description_en || "").trim();

  const title = titleBase || titleRo || titleRu || titleEn;
  if (!title) return res.status(400).json({ error: "Title required" });

  const price = Number(body.price || 0);
  const description = descriptionBase || descriptionRo || descriptionRu || descriptionEn;
  const categoryId = body.categoryId ? Number(body.categoryId) : null;
  const inStock = body.inStock === "0" ? 0 : 1;
  const quantity = Number(body.quantity || 0);
  const isActive = body.isActive === "0" ? 0 : 1;

  db.run(
    `INSERT INTO products(
      title, title_ro, title_ru, title_en,
      price,
      description, description_ro, description_ru, description_en,
      categoryId, inStock, quantity, imageUrl, isActive, updatedAt
    ) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?, datetime('now'))`,
    [
      title,
      titleRo,
      titleRu,
      titleEn,
      price,
      description,
      descriptionRo,
      descriptionRu,
      descriptionEn,
      categoryId,
      inStock,
      quantity,
      imageUrl,
      isActive,
    ],
    function (err) {
      if (err) return res.status(400).json({ error: err.message });
      res.json({ id: this.lastID });
    },
  );
});

// update product
app.put("/api/products/:id", auth, upload.single("image"), (req, res) => {
  const id = Number(req.params.id);
  const body = req.body || {};

  const titleBase = (body.title || "").trim();
  const titleRo = (body.title_ro || "").trim();
  const titleRu = (body.title_ru || "").trim();
  const titleEn = (body.title_en || "").trim();
  const descriptionBase = (body.description || "").trim();
  const descriptionRo = (body.description_ro || "").trim();
  const descriptionRu = (body.description_ru || "").trim();
  const descriptionEn = (body.description_en || "").trim();

  const title = titleBase || titleRo || titleRu || titleEn;
  if (!title) return res.status(400).json({ error: "Title required" });

  const price = Number(body.price || 0);
  const description = descriptionBase || descriptionRo || descriptionRu || descriptionEn;
  const categoryId = body.categoryId ? Number(body.categoryId) : null;
  const inStock = body.inStock === "0" ? 0 : 1;
  const quantity = Number(body.quantity || 0);
  const isActive = body.isActive === "0" ? 0 : 1;

  const imageUrl = req.file ? `/uploads/${req.file.filename}` : null;

  const sql = imageUrl
    ? `UPDATE products
       SET title=?, title_ro=?, title_ru=?, title_en=?,
           price=?,
           description=?, description_ro=?, description_ru=?, description_en=?,
           categoryId=?, inStock=?, quantity=?, imageUrl=?, isActive=?, updatedAt=datetime('now')
       WHERE id=?`
    : `UPDATE products
       SET title=?, title_ro=?, title_ru=?, title_en=?,
           price=?,
           description=?, description_ro=?, description_ru=?, description_en=?,
           categoryId=?, inStock=?, quantity=?, isActive=?, updatedAt=datetime('now')
       WHERE id=?`;

  const params = imageUrl
    ? [
        title,
        titleRo,
        titleRu,
        titleEn,
        price,
        description,
        descriptionRo,
        descriptionRu,
        descriptionEn,
        categoryId,
        inStock,
        quantity,
        imageUrl,
        isActive,
        id,
      ]
    : [
        title,
        titleRo,
        titleRu,
        titleEn,
        price,
        description,
        descriptionRo,
        descriptionRu,
        descriptionEn,
        categoryId,
        inStock,
        quantity,
        isActive,
        id,
      ];

  db.run(sql, params, function (err) {
    if (err) return res.status(400).json({ error: err.message });
    res.json({ ok: true });
  });
});

// toggle show/hide
app.put("/api/products/:id/active", auth, (req, res) => {
  const id = Number(req.params.id);
  const { isActive } = req.body || {};
  const v = Number(isActive) ? 1 : 0;

  db.run(
    "UPDATE products SET isActive=?, updatedAt=datetime('now') WHERE id=?",
    [v, id],
    function (err) {
      if (err) return res.status(400).json({ error: err.message });
      res.json({ ok: true });
    },
  );
});

// ✅ FIX: endpoint ожидаемый админкой
app.put("/api/products/:id/week-pick", auth, (req, res) => {
  const productId = Number(req.params.id);
  if (!productId) return res.status(400).json({ error: "Bad id" });

  const body = req.body || {};
  const wantOn = Number(body.isWeekPick) === 1;

  db.get(
    "SELECT * FROM week_picks WHERE isActive=1 ORDER BY updatedAt DESC LIMIT 1",
    [],
    (err, row) => {
      if (err) return res.status(500).json({ error: err.message });

      const ensureActivePick = (cb) => {
        if (row) return cb(row);
        db.run(
          `INSERT INTO week_picks(title, subtitle, productIds, isActive, updatedAt)
           VALUES(?,?,?,?, datetime('now'))`,
          ["Выбор недели", "", "[]", 1],
          function (e2) {
            if (e2) return res.status(500).json({ error: e2.message });
            db.get(
              "SELECT * FROM week_picks WHERE id=?",
              [this.lastID],
              (e3, r3) => {
                if (e3) return res.status(500).json({ error: e3.message });
                cb(r3);
              },
            );
          },
        );
      };

      ensureActivePick((active) => {
        let ids = [];
        try {
          ids = JSON.parse(active.productIds || "[]");
        } catch {
          ids = [];
        }
        ids = Array.isArray(ids) ? ids.map(Number).filter(Boolean) : [];

        const has = ids.includes(productId);

        if (wantOn && !has) ids.push(productId);
        if (!wantOn && has) ids = ids.filter((x) => x !== productId);

        db.run(
          "UPDATE week_picks SET productIds=?, updatedAt=datetime('now') WHERE id=?",
          [JSON.stringify(ids), active.id],
          (e4) => {
            if (e4) return res.status(500).json({ error: e4.message });
            res.json({ ok: true, isWeekPick: wantOn ? 1 : 0, productIds: ids });
          },
        );
      });
    },
  );
});

app.delete("/api/products/:id", auth, (req, res) => {
  const id = Number(req.params.id);
  db.run("DELETE FROM products WHERE id=?", [id], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ ok: true });
  });
});

// =========================
// WEEK PICKS (как у тебя было)
// =========================
app.get("/api/week-picks", auth, (req, res) => {
  db.all(
    "SELECT * FROM week_picks ORDER BY isActive DESC, updatedAt DESC",
    [],
    (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      const parsed = rows.map((r) => ({
        ...r,
        productIds: parseProductIds(r.productIds),
      }));
      res.json(parsed);
    },
  );
});

app.get("/api/public/week-picks/active", (req, res) => {
  db.get(
    "SELECT * FROM week_picks WHERE isActive=1 LIMIT 1",
    [],
    (err, row) => {
      if (err) return res.status(500).json({ error: err.message });
      if (!row) return res.json(null);
      res.json({ ...row, productIds: parseProductIds(row.productIds) });
    },
  );
});

app.post("/api/week-picks", auth, (req, res) => {
  const body = req.body || {};
  const title = (body.title || "Выбор недели").trim();
  const subtitle = (body.subtitle || "").trim();
  const productIds = JSON.stringify(body.productIds || []);
  const isActive = body.isActive ? 1 : 0;

  if (isActive) db.run("UPDATE week_picks SET isActive=0");

  db.run(
    `INSERT INTO week_picks(title, subtitle, productIds, isActive, updatedAt)
     VALUES(?,?,?,?, datetime('now'))`,
    [title, subtitle, productIds, isActive],
    function (err) {
      if (err) return res.status(400).json({ error: err.message });
      res.json({ id: this.lastID });
    },
  );
});

app.put("/api/week-picks/:id", auth, (req, res) => {
  const id = Number(req.params.id);
  const body = req.body || {};
  const title = (body.title || "Выбор недели").trim();
  const subtitle = (body.subtitle || "").trim();
  const productIds = JSON.stringify(body.productIds || []);
  const isActive = body.isActive ? 1 : 0;

  if (isActive) db.run("UPDATE week_picks SET isActive=0");

  db.run(
    `UPDATE week_picks
     SET title=?, subtitle=?, productIds=?, isActive=?, updatedAt=datetime('now')
     WHERE id=?`,
    [title, subtitle, productIds, isActive, id],
    function (err) {
      if (err) return res.status(400).json({ error: err.message });
      res.json({ ok: true, id });
    },
  );
});

app.delete("/api/week-picks/:id", auth, (req, res) => {
  const id = Number(req.params.id);
  db.run("DELETE FROM week_picks WHERE id=?", [id], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ ok: true });
  });
});

// =========================
// STATIC + SEO routes
// =========================
const publicDir = path.join(__dirname, "..", "public");
app.use("/:lang(ro|ru|en)/css", express.static(path.join(publicDir, "css")));
app.use("/:lang(ro|ru|en)/js", express.static(path.join(publicDir, "js")));
app.use("/:lang(ro|ru|en)/uploads", express.static(uploadsDir));

// старые URL без языка -> редирект
app.get(
  [
    "/",
    "/index.html",
    "/shop.html",
    "/about.html",
    "/contact.html",
    "/product.html",
    "/week-picks.html",
  ],
  (req, res) => {
    const lang = detectLang(req);
    const qs = req.url.includes("?") ? req.url.slice(req.url.indexOf("?")) : "";
    const p = req.path;

    if (p === "/" || p === "/index.html")
      return res.redirect(302, `/${lang}/${qs}`);
    if (p === "/shop.html") return res.redirect(302, `/${lang}/shop${qs}`);
    if (p === "/about.html") return res.redirect(302, `/${lang}/about${qs}`);
    if (p === "/contact.html")
      return res.redirect(302, `/${lang}/contact${qs}`);
    if (p === "/product.html")
      return res.redirect(302, `/${lang}/product${qs}`);
    if (p === "/week-picks.html")
      return res.redirect(302, `/${lang}/week-picks${qs}`);
    return res.redirect(302, `/${lang}/${qs}`);
  },
);

// языковые URL (SSR)
app.get("/:lang(ro|ru|en)/:page?", (req, res, next) => {
  const lang = normalizeLang(req.params.lang);
  const page = (req.params.page || "").toLowerCase();

  if (page === "api" || page === "admin" || page === "uploads") return next();

  setCookie(res, LANG_COOKIE, lang, { maxAgeDays: 365, cookiePath: "/" });

  const fileMap = {
    "": "index.html",
    index: "index.html",
    shop: "shop.html",
    about: "about.html",
    contact: "contact.html",
    product: "product.html",
    "week-picks": "week-picks.html",
  };
  const fileName = fileMap[page];
  if (!fileName) return next();

  const filePath = path.join(publicDir, fileName);
  if (!fs.existsSync(filePath)) return res.status(404).send("Not found");

  let html = fs.readFileSync(filePath, "utf8");
  html = applyI18nToHtml(html, lang);

  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.send(html);
});

// admin
app.get("/admin", (req, res) => {
  res.sendFile(path.join(publicDir, "admin", "login.html"));
});
app.use("/admin", express.static(path.join(publicDir, "admin")));

// static
app.use("/", express.static(publicDir));

const port = Number(process.env.PORT || 3001);
app.listen(port, () =>
  console.log(`Server running on http://localhost:${port}`),
);
