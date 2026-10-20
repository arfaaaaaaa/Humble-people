/* ===== DATABASE (SQLite) =====
   Semua akun, sesi login, dan pesanan disimpan di satu file: data/toko.db */
// SQLite bawaan Node.js (tidak perlu install/kompilasi apa pun). Butuh Node 22.13 atau lebih baru.
const { DatabaseSync } = require("node:sqlite");
const fs = require("fs");
const path = require("path");

const file = process.env.DB_PATH || path.join(__dirname, "data", "toko.db");
fs.mkdirSync(path.dirname(file), { recursive: true });

const db = new DatabaseSync(file);
db.exec("PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON;");

db.exec(`
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  nama TEXT NOT NULL,
  hash TEXT,                       -- kata sandi (di-hash); kosong untuk akun Google
  google_id TEXT UNIQUE,
  hp TEXT, alamat TEXT, kota TEXT, provinsi TEXT, pos TEXT, catatan TEXT,
  dibuat TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS sessions (
  token_hash TEXT PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  google INTEGER NOT NULL DEFAULT 0,
  berlaku_sampai INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS orders (
  id INTEGER PRIMARY KEY,
  kode TEXT UNIQUE NOT NULL,
  user_id INTEGER NOT NULL REFERENCES users(id),
  status TEXT NOT NULL DEFAULT 'menunggu',
  kurir TEXT NOT NULL, bayar TEXT NOT NULL,
  subtotal INTEGER NOT NULL, ongkir INTEGER NOT NULL, total INTEGER NOT NULL,
  penerima TEXT NOT NULL, hp TEXT NOT NULL, alamat TEXT NOT NULL,
  dibuat TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS order_items (
  id INTEGER PRIMARY KEY,
  order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  produk_id INTEGER NOT NULL, nama TEXT NOT NULL, ukuran TEXT NOT NULL,
  harga INTEGER NOT NULL, qty INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_orders_user ON orders(user_id);
`);

/* Menjalankan beberapa perintah sekaligus: semua berhasil, atau semua dibatalkan */
db.transaksi = fn => {
  db.exec("BEGIN");
  try { const hasil = fn(); db.exec("COMMIT"); return hasil; }
  catch (e) { db.exec("ROLLBACK"); throw e; }
};

module.exports = db;
