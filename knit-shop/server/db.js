import sqlite3 from "sqlite3";

const DB_PATH = "./db.sqlite";
export const db = new sqlite3.Database(DB_PATH);

function ensureProductsColumn(name, type, defSql = "") {
  db.all(`PRAGMA table_info(products)`, [], (err, cols) => {
    if (err) return;
    const has = (cols || []).some((c) => String(c.name) === name);
    if (has) return;
    const sql = `ALTER TABLE products ADD COLUMN ${name} ${type}${defSql ? ` ${defSql}` : ""}`;
    db.run(sql);
  });
}

function ensureWeekPicksColumn(name, type, defSql = "") {
  db.all(`PRAGMA table_info(week_picks)`, [], (err, cols) => {
    if (err) return;
    const has = (cols || []).some((c) => String(c.name) === name);
    if (has) return;
    const sql = `ALTER TABLE week_picks ADD COLUMN ${name} ${type}${defSql ? ` ${defSql}` : ""}`;
    db.run(sql);
  });
}

export function initDb() {
  db.serialize(() => {
    db.run(`
            CREATE TABLE IF NOT EXISTS categories (
                                                      id INTEGER PRIMARY KEY AUTOINCREMENT,
                                                      name TEXT NOT NULL UNIQUE,
                                                      slug TEXT NOT NULL UNIQUE,
                                                      isActive INTEGER NOT NULL DEFAULT 1,
                                                      createdAt TEXT NOT NULL DEFAULT (datetime('now'))
            )
        `);

    db.run(`
      CREATE TABLE IF NOT EXISTS products (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        title_ro TEXT NOT NULL DEFAULT '',
        title_ru TEXT NOT NULL DEFAULT '',
        title_en TEXT NOT NULL DEFAULT '',
        price INTEGER NOT NULL DEFAULT 0,
        description TEXT NOT NULL DEFAULT '',
        description_ro TEXT NOT NULL DEFAULT '',
        description_ru TEXT NOT NULL DEFAULT '',
        description_en TEXT NOT NULL DEFAULT '',
        categoryId INTEGER,
        inStock INTEGER NOT NULL DEFAULT 1,
        quantity INTEGER NOT NULL DEFAULT 0,
        imageUrl TEXT,

        isActive INTEGER NOT NULL DEFAULT 1,
        isWeekPick INTEGER NOT NULL DEFAULT 0,

        tag TEXT DEFAULT 'handmade',
        color TEXT DEFAULT '',
        care TEXT DEFAULT 'бережная стирка 30°C',

        createdAt TEXT NOT NULL DEFAULT (datetime('now')),
        updatedAt TEXT NOT NULL DEFAULT (datetime('now')),
        FOREIGN KEY(categoryId) REFERENCES categories(id)
      )
    `);

    db.run(`
            CREATE TABLE IF NOT EXISTS week_picks (
                                                      id INTEGER PRIMARY KEY AUTOINCREMENT,
                                                      title TEXT NOT NULL DEFAULT 'Выбор недели',
                                                      title_ro TEXT NOT NULL DEFAULT '',
                                                      title_ru TEXT NOT NULL DEFAULT '',
                                                      title_en TEXT NOT NULL DEFAULT '',
                                                      subtitle TEXT DEFAULT '',
                                                      subtitle_ro TEXT NOT NULL DEFAULT '',
                                                      subtitle_ru TEXT NOT NULL DEFAULT '',
                                                      subtitle_en TEXT NOT NULL DEFAULT '',
                                                      weekStart TEXT DEFAULT '',
                                                      weekEnd TEXT DEFAULT '',
                                                      productIds TEXT NOT NULL DEFAULT '[]',
                                                      isActive INTEGER NOT NULL DEFAULT 0,
                                                      updatedAt TEXT DEFAULT (datetime('now'))
            )
        `);

    db.run(
      `CREATE INDEX IF NOT EXISTS idx_products_categoryId ON products(categoryId)`,
    );
    db.run(
      `CREATE INDEX IF NOT EXISTS idx_products_isActive ON products(isActive)`,
    );
    db.run(
      `CREATE INDEX IF NOT EXISTS idx_categories_isActive ON categories(isActive)`,
    );

    ensureProductsColumn("isWeekPick", "INTEGER", "NOT NULL DEFAULT 0");
    ensureProductsColumn("title_ro", "TEXT", "NOT NULL DEFAULT ''");
    ensureProductsColumn("title_ru", "TEXT", "NOT NULL DEFAULT ''");
    ensureProductsColumn("title_en", "TEXT", "NOT NULL DEFAULT ''");
    ensureProductsColumn("description_ro", "TEXT", "NOT NULL DEFAULT ''");
    ensureProductsColumn("description_ru", "TEXT", "NOT NULL DEFAULT ''");
    ensureProductsColumn("description_en", "TEXT", "NOT NULL DEFAULT ''");
    ensureWeekPicksColumn("title_ro", "TEXT", "NOT NULL DEFAULT ''");
    ensureWeekPicksColumn("title_ru", "TEXT", "NOT NULL DEFAULT ''");
    ensureWeekPicksColumn("title_en", "TEXT", "NOT NULL DEFAULT ''");
    ensureWeekPicksColumn("subtitle_ro", "TEXT", "NOT NULL DEFAULT ''");
    ensureWeekPicksColumn("subtitle_ru", "TEXT", "NOT NULL DEFAULT ''");
    ensureWeekPicksColumn("subtitle_en", "TEXT", "NOT NULL DEFAULT ''");
    ensureWeekPicksColumn("weekStart", "TEXT", "DEFAULT ''");
    ensureWeekPicksColumn("weekEnd", "TEXT", "DEFAULT ''");

    db.run(
      `CREATE INDEX IF NOT EXISTS idx_products_isWeekPick ON products(isWeekPick)`,
    );
  });
}
