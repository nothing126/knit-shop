/* =========================
   Data + Helpers
   ========================= */
const PRODUCTS = [
    {
        id: "rose-cardigan",
        name: "Пудровый кардиган Rosé",
        price: 1890,
        category: "cardigans",
        color: "rose",
        tag: "Handmade",
        desc: "Нежный кардиган из мягкой пряжи. Силуэт oversize, идеально для слоёв и уютных вечеров.",
        care: "Ручная стирка 30°C, сушить горизонтально."
    },
    {
        id: "milk-sweater",
        name: "Молочный свитер Milk Cloud",
        price: 2190,
        category: "sweaters",
        color: "milk",
        tag: "Premium Yarn",
        desc: "Свитер с аккуратной резинкой и мягкой посадкой. Смотрится дорого и минималистично.",
        care: "Ручная/деликатная стирка 30°C, без отжима."
    },
    {
        id: "caramel-beanie",
        name: "Шапка Caramel Hug",
        price: 690,
        category: "hats",
        color: "caramel",
        tag: "Small Batch",
        desc: "Тёплая шапка с мягкой пряжей и идеальной посадкой. Носится с пальто и пуховиком.",
        care: "Ручная стирка 30°C."
    },
    {
        id: "lav-scarf",
        name: "Шарф Lavender Mist",
        price: 990,
        category: "accessories",
        color: "lav",
        tag: "Giftable",
        desc: "Длинный шарф с нежной текстурой. Отличный подарок — выглядит премиально в любой упаковке.",
        care: "Деликатная стирка 30°C."
    },
    {
        id: "rose-socks",
        name: "Носочки Blush Cozy",
        price: 420,
        category: "accessories",
        color: "rose",
        tag: "Soft",
        desc: "Супер мягкие носочки — для дома, кино и горячего чая. Милые и очень уютные.",
        care: "Деликатная стирка 30°C."
    },
    {
        id: "milk-hood",
        name: "Капюшон-снуд Milk Wrap",
        price: 1290,
        category: "accessories",
        color: "milk",
        tag: "Limited",
        desc: "Капюшон-снуд для ветреных дней: стильная защита шеи и головы в одном.",
        care: "Ручная стирка 30°C, сушить горизонтально."
    }
];

const formatMoney = (n) => new Intl.NumberFormat("ru-RU").format(n) + " MDL";
const $ = (sel, root=document) => root.querySelector(sel);
const $$ = (sel, root=document) => Array.from(root.querySelectorAll(sel));

/* =========================
   Cart (localStorage)
   ========================= */
const CART_KEY = "knit_cart_v1";

function readCart(){
    try { return JSON.parse(localStorage.getItem(CART_KEY)) || {}; }
    catch { return {}; }
}
function writeCart(cart){
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
    updateCartBadge();
}
function cartCount(cart = readCart()){
    return Object.values(cart).reduce((a,b)=>a+b,0);
}
function cartTotal(cart = readCart()){
    let sum = 0;
    for (const [id, qty] of Object.entries(cart)){
        const p = PRODUCTS.find(x=>x.id===id);
        if (p) sum += p.price * qty;
    }
    return sum;
}
function addToCart(id, qty=1){
    const cart = readCart();
    cart[id] = (cart[id] || 0) + qty;
    if (cart[id] <= 0) delete cart[id];
    writeCart(cart);
    toast("Добавлено в корзину ✨");
}
function setQty(id, qty){
    const cart = readCart();
    if (qty <= 0) delete cart[id];
    else cart[id] = qty;
    writeCart(cart);
    renderCartDrawer();
}
function updateCartBadge(){
    const n = cartCount();
    const badge = $("#cartBadge");
    if (badge) badge.textContent = n;
}

/* =========================
   UI: Toast
   ========================= */
let toastTimer = null;
function toast(msg){
    const t = $("#toast");
    if (!t) return;
    t.textContent = msg;
    t.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(()=> t.classList.remove("show"), 1800);
}

/* =========================
   UI: Drawer (Cart)
   ========================= */
function openCart(){
    document.body.classList.add("drawer-open");
    renderCartDrawer();
}
function closeCart(){
    document.body.classList.remove("drawer-open");
}

function renderCartDrawer(){
    const list = $("#cartList");
    const totalEl = $("#cartTotal");
    const emptyEl = $("#cartEmpty");
    if (!list || !totalEl) return;

    const cart = readCart();
    const entries = Object.entries(cart);

    list.innerHTML = "";
    if (entries.length === 0){
        if (emptyEl) emptyEl.style.display = "block";
    } else {
        if (emptyEl) emptyEl.style.display = "none";
        for (const [id, qty] of entries){
            const p = PRODUCTS.find(x=>x.id===id);
            if (!p) continue;

            const item = document.createElement("div");
            item.className = "cart-item";
            item.innerHTML = `
        <div class="ph" aria-hidden="true"></div>
        <div>
          <h5>${p.name}</h5>
          <div class="meta">${formatMoney(p.price)} • ${p.tag}</div>
          <div class="qty" style="margin-top:10px">
            <button type="button" data-dec="${id}" aria-label="minus">−</button>
            <div style="min-width:18px;text-align:center;font-size:13px">${qty}</div>
            <button type="button" data-inc="${id}" aria-label="plus">+</button>
          </div>
        </div>
        <div style="display:flex;flex-direction:column;align-items:flex-end;gap:10px">
          <div style="font-family:var(--serif);font-size:16px">${formatMoney(p.price * qty)}</div>
          <button class="btn small ghost" type="button" data-rm="${id}">Удалить</button>
        </div>
      `;
            list.appendChild(item);
        }
    }

    totalEl.textContent = formatMoney(cartTotal(cart));

    // bind
    $$("[data-inc]").forEach(b => b.onclick = () => {
        const id = b.getAttribute("data-inc");
        const cart = readCart();
        setQty(id, (cart[id]||0) + 1);
    });
    $$("[data-dec]").forEach(b => b.onclick = () => {
        const id = b.getAttribute("data-dec");
        const cart = readCart();
        setQty(id, (cart[id]||0) - 1);
    });
    $$("[data-rm]").forEach(b => b.onclick = () => {
        const id = b.getAttribute("data-rm");
        setQty(id, 0);
        toast("Удалено из корзины");
    });
}

/* =========================
   Page: Shop (render grid)
   ========================= */
function renderShop(){
    const grid = $("#productGrid");
    if (!grid) return;

    const q = $("#searchInput");
    const cat = $("#categorySelect");
    const col = $("#colorSelect");
    const sort = $("#sortSelect");

    const apply = () => {
        let items = [...PRODUCTS];

        const query = (q?.value || "").trim().toLowerCase();
        if (query){
            items = items.filter(p => p.name.toLowerCase().includes(query) || p.tag.toLowerCase().includes(query));
        }

        const c = cat?.value || "all";
        if (c !== "all") items = items.filter(p => p.category === c);

        const cl = col?.value || "all";
        if (cl !== "all") items = items.filter(p => p.color === cl);

        const s = sort?.value || "featured";
        if (s === "price-asc") items.sort((a,b)=>a.price-b.price);
        if (s === "price-desc") items.sort((a,b)=>b.price-a.price);
        if (s === "name") items.sort((a,b)=>a.name.localeCompare(b.name,"ru"));

        grid.innerHTML = items.map(p => productCardHTML(p)).join("");
        bindCardButtons();
    };

    [q,cat,col,sort].forEach(el => el && el.addEventListener("input", apply));
    apply();
}

function productCardHTML(p){
    const colorLabel = ({rose:"Розовый", milk:"Молочный", caramel:"Карамель", lav:"Лаванда"})[p.color] || "Нежный";
    return `
    <article class="product reveal">
      <div class="thumb">
        <div class="tag">${p.tag}</div>
      </div>
      <div class="body">
        <h3>${p.name}</h3>
        <div class="chip-row">
          <div class="chip">${colorLabel}</div>
          <div class="chip">${categoryLabel(p.category)}</div>
        </div>
        <div class="price">
          <b>${formatMoney(p.price)}</b>
          <span style="color:rgba(45,36,33,.62)">в наличии</span>
        </div>
        <div class="mini-actions">
          <a class="btn small" href="product.html?id=${encodeURIComponent(p.id)}">Подробнее</a>
          <button class="btn small primary" type="button" data-add="${p.id}">В корзину</button>
        </div>
      </div>
    </article>
  `;
}

function categoryLabel(c){
    return ({
        sweaters:"Свитеры",
        cardigans:"Кардиганы",
        hats:"Шапки",
        accessories:"Аксессуары"
    })[c] || "Коллекция";
}

function bindCardButtons(){
    $$("[data-add]").forEach(btn=>{
        btn.onclick = () => addToCart(btn.getAttribute("data-add"), 1);
    });
    // reveal animation
    requestAnimationFrame(()=> {
        $$(".reveal").forEach(el => el.classList.add("on"));
    });
}

/* =========================
   Page: Product
   ========================= */
function renderProduct(){
    const root = $("#productRoot");
    if (!root) return;

    const params = new URLSearchParams(location.search);
    const id = params.get("id") || PRODUCTS[0].id;
    const p = PRODUCTS.find(x=>x.id===id) || PRODUCTS[0];

    $("#pName").textContent = p.name;
    $("#pPrice").textContent = formatMoney(p.price);
    $("#pDesc").textContent = p.desc;
    $("#pCare").textContent = p.care;
    $("#pTag").textContent = p.tag;
    $("#pCat").textContent = categoryLabel(p.category);

    const addBtn = $("#pAdd");
    if (addBtn) addBtn.onclick = () => addToCart(p.id, 1);

    const sizeSel = $("#pSize");
    const colorSel = $("#pColor");
    const buyNow = $("#pBuyNow");

    if (buyNow){
        buyNow.onclick = () => {
            addToCart(p.id, 1);
            openCart();
        };
    }

    // tiny detail: update "chosen" label
    const chosen = $("#pChosen");
    const updateChosen = () => {
        const s = sizeSel?.value || "One size";
        const c = colorSel?.value || "Нежный";
        if (chosen) chosen.textContent = `${s} • ${c}`;
    };
    [sizeSel, colorSel].forEach(el => el && el.addEventListener("input", updateChosen));
    updateChosen();

    // recommended
    const rec = $("#recommendGrid");
    if (rec){
        const others = PRODUCTS.filter(x=>x.id!==p.id).slice(0,3);
        rec.innerHTML = others.map(productCardHTML).join("");
        bindCardButtons();
    }

    requestAnimationFrame(()=> $$(".reveal").forEach(el=>el.classList.add("on")));
}

/* =========================
   Global: menu, cart, reveal
   ========================= */
function initGlobal(){
    updateCartBadge();

    const cartBtn = $("#cartBtn");
    const cartClose = $("#cartClose");
    const backdrop = $("#drawerBackdrop");
    if (cartBtn) cartBtn.onclick = openCart;
    if (cartClose) cartClose.onclick = closeCart;
    if (backdrop) backdrop.onclick = closeCart;

    // checkout
    const checkout = $("#checkoutBtn");
    if (checkout) checkout.onclick = () => {
        const n = cartCount();
        if (!n) return toast("Корзина пустая 🙂");
        toast("Оформление — заглушка (добавишь позже) 💳");
    };

    // mobile menu
    const burger = $("#burgerBtn");
    const links = $("#mobileLinks");
    if (burger && links){
        burger.onclick = () => links.classList.toggle("open");
    }

    // reveal observer (for long pages)
    const obs = new IntersectionObserver((entries)=>{
        entries.forEach(e=>{
            if (e.isIntersecting) e.target.classList.add("on");
        });
    }, {threshold: .12});

    $$(".reveal").forEach(el=>obs.observe(el));
}

/* =========================
   Boot
   ========================= */
document.addEventListener("DOMContentLoaded", ()=>{
    initGlobal();
    renderShop();
    renderProduct();
});

window.PRODUCTS = PRODUCTS;
window.addToCart = addToCart;