/* ===== SERVER HUMBLE PEOPLE =====
   - Menyajikan website (folder public/)
   - Akun: daftar, login, login Google (diverifikasi server), data pengiriman
   - Pesanan: harga dihitung ulang di server, disimpan di database
   - Admin: lihat & ubah status pesanan */
require("dotenv").config();
const express = require("express");
const crypto = require("crypto");
const path = require("path");
const rateLimit = require("express-rate-limit");
const { OAuth2Client } = require("google-auth-library");
const db = require("./db");
const { fatal: masalahProduk, peringatan: peringatanProduk, produk } = require("./produk-cek").muat(path.join(__dirname, "produk.json"), path.join(__dirname, "public", "foto"));
if (masalahProduk.length) {   // salah ketik di produk.json: tampilkan pesan jelas, jangan jalankan server
  console.error("\n❌ Ada masalah di produk.json:\n" + masalahProduk.map(m => " - " + m).join("\n") + "\n\nPerbaiki lalu jalankan ulang (npm start).");
  process.exit(1);
}
peringatanProduk.forEach(m => console.warn("⚠ " + m));

const PORT = process.env.PORT || 3000;
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || "";
const NOMOR_WA = process.env.NOMOR_WA || "6281234567890";
const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || "").split(",").map(s => s.trim().toLowerCase()).filter(Boolean);
const PROD = process.env.NODE_ENV === "production";

/* Pengaturan toko: dikirim juga ke browser lewat /konfigurasi.js */
const KONFIG = { GRATIS_ONGKIR: 500000, ONGKIR_REGULER: 15000, ONGKIR_EXPRESS: 25000, MAKS_QTY: 10, UKURAN: ["S", "M", "L", "XL"] };
const STATUS = ["menunggu", "dibayar", "dikemas", "dikirim", "selesai", "dibatalkan"];
const PEMBAYARAN = ["Transfer Bank", "QRIS", "COD"];
const MASA_SESI = 30 * 24 * 3600 * 1000;

const app = express();
app.disable("x-powered-by");
if (PROD) app.set("trust proxy", 1);   // di belakang proxy hosting (HTTPS)
app.use(express.json({ limit: "20kb" }));
app.use((req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  next();
});

const tolak = (res, kode, galat) => res.status(kode).json({ galat });
const sha = t => crypto.createHash("sha256").update(t).digest("hex");

/* ----- Kata sandi (scrypt + salt) ----- */
const hashSandi = s => { const salt = crypto.randomBytes(16); return salt.toString("hex") + ":" + crypto.scryptSync(s, salt, 64).toString("hex"); };
function cekSandi(s, h) {
  if (!h) return false;
  const [salt, k] = h.split(":");
  const a = crypto.scryptSync(s, Buffer.from(salt, "hex"), 64), b = Buffer.from(k, "hex");
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

/* ----- Sesi login (cookie httpOnly, hanya hash token disimpan di database) ----- */
const bacaCookie = req => Object.fromEntries((req.headers.cookie || "").split(";").map(c => c.trim().split("=")).filter(c => c[0]).map(([k, ...v]) => [k, decodeURIComponent(v.join("="))]));
function buatSesi(res, userId, viaGoogle) {
  const token = crypto.randomBytes(32).toString("hex");
  db.prepare("INSERT INTO sessions VALUES (?,?,?,?)").run(sha(token), userId, viaGoogle ? 1 : 0, Date.now() + MASA_SESI);
  res.cookie("hp_sid", token, { httpOnly: true, sameSite: "lax", secure: PROD, maxAge: MASA_SESI, path: "/" });
}
db.prepare("DELETE FROM sessions WHERE berlaku_sampai < ?").run(Date.now());

const ambilUser = id => db.prepare("SELECT * FROM users WHERE id=?").get(id);
const lengkap = u => !!(u && u.nama && u.hp && u.alamat && u.kota && u.provinsi && u.pos);
const publik = (u, viaGoogle) => ({
  email: u.email, nama: u.nama, hp: u.hp, alamat: u.alamat, kota: u.kota, provinsi: u.provinsi, pos: u.pos, catatan: u.catatan,
  google: !!u.google_id, admin: !!viaGoogle && ADMIN_EMAILS.includes(u.email)
});

/* ----- Pengaman API ----- */
app.use("/api", (req, res, next) => {   // tolak permintaan tulis dari situs lain
  const o = req.headers.origin;
  if (req.method !== "GET" && o) { try { if (new URL(o).host !== req.headers.host) return tolak(res, 403, "Origin tidak valid."); } catch (e) { return tolak(res, 403, "Origin tidak valid."); } }
  const t = bacaCookie(req).hp_sid;
  req.tokenHash = t ? sha(t) : null;
  req.user = t ? db.prepare("SELECT s.google AS via_google, u.* FROM sessions s JOIN users u ON u.id=s.user_id WHERE s.token_hash=? AND s.berlaku_sampai>?").get(req.tokenHash, Date.now()) || null : null;
  next();
});
const perluLogin = (req, res, next) => req.user ? next() : tolak(res, 401, "Silakan masuk dulu.");
const perluAdmin = (req, res, next) => req.user && req.user.via_google && ADMIN_EMAILS.includes(req.user.email) ? next() : tolak(res, 403, "Khusus admin (masuk dengan Google).");
const batas = rateLimit({ windowMs: 15 * 60 * 1000, limit: 30, standardHeaders: true, legacyHeaders: false, message: { galat: "Terlalu banyak percobaan. Coba lagi beberapa menit lagi." } });

const teks = (v, min, max) => typeof v === "string" && v.trim().length >= min && v.trim().length <= max;
const emailValid = e => typeof e === "string" && e.length <= 120 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e.trim());

/* ----- Konfigurasi untuk browser (produk, ongkir, nomor WA, Google Client ID) ----- */
app.get("/konfigurasi.js", (req, res) => {
  const baris = [`const GOOGLE_CLIENT_ID=${JSON.stringify(GOOGLE_CLIENT_ID)};`, `const NOMOR_WA=${JSON.stringify(NOMOR_WA)};`,
    ...Object.entries(KONFIG).map(([k, v]) => `const ${k}=${JSON.stringify(v)};`), `const produk=${JSON.stringify(produk)};`];
  res.type("application/javascript").set("Cache-Control", "no-store").send(baris.join("\n"));
});

/* ----- Akun ----- */
app.get("/api/me", (req, res) => res.json({ pengguna: req.user ? publik(req.user, req.user.via_google) : null }));

app.post("/api/register", batas, (req, res) => {
  const { nama, email, sandi } = req.body || {};
  if (!teks(nama, 2, 80)) return tolak(res, 400, "Nama wajib diisi (minimal 2 huruf).");
  if (!emailValid(email)) return tolak(res, 400, "Format email belum benar.");
  if (typeof sandi !== "string" || sandi.length < 8 || sandi.length > 100) return tolak(res, 400, "Kata sandi minimal 8 karakter.");
  const em = email.trim().toLowerCase();
  if (db.prepare("SELECT 1 FROM users WHERE email=?").get(em)) return tolak(res, 409, "Email sudah terdaftar. Silakan masuk.");
  const r = db.prepare("INSERT INTO users(email,nama,hash) VALUES(?,?,?)").run(em, nama.trim(), hashSandi(sandi));
  buatSesi(res, r.lastInsertRowid, false);
  res.status(201).json({ pengguna: publik(ambilUser(r.lastInsertRowid), false) });
});

app.post("/api/login", batas, (req, res) => {
  const { email, sandi } = req.body || {};
  const u = emailValid(email) && typeof sandi === "string" ? db.prepare("SELECT * FROM users WHERE email=?").get(email.trim().toLowerCase()) : null;
  if (u && !u.hash && u.google_id) return tolak(res, 401, "Akun ini terdaftar lewat Google. Gunakan tombol Masuk dengan Google.");
  if (!u || !cekSandi(sandi, u.hash)) return tolak(res, 401, "Email atau kata sandi salah.");
  buatSesi(res, u.id, false);
  res.json({ pengguna: publik(u, false) });
});

/* Login Google: token (ID token) diverifikasi ke Google oleh server, tidak percaya data dari browser */
const klienGoogle = GOOGLE_CLIENT_ID ? new OAuth2Client(GOOGLE_CLIENT_ID) : null;
app.post("/api/google", batas, async (req, res) => {
  if (!klienGoogle) return tolak(res, 503, "Login Google belum dikonfigurasi di server (isi GOOGLE_CLIENT_ID di .env).");
  let p;
  try {
    const tiket = await klienGoogle.verifyIdToken({ idToken: String((req.body || {}).credential || ""), audience: GOOGLE_CLIENT_ID });
    p = tiket.getPayload();
  } catch (e) { return tolak(res, 401, "Token Google tidak valid."); }
  if (!p.email || !p.email_verified) return tolak(res, 401, "Email Google belum terverifikasi.");
  const em = p.email.toLowerCase();
  let u = db.prepare("SELECT * FROM users WHERE google_id=?").get(p.sub) || db.prepare("SELECT * FROM users WHERE email=?").get(em);
  if (!u) {
    const r = db.prepare("INSERT INTO users(email,nama,google_id) VALUES(?,?,?)").run(em, String(p.name || em.split("@")[0]).slice(0, 80), p.sub);
    u = ambilUser(r.lastInsertRowid);
  } else if (!u.google_id) {
    // Akun lama dibuat dengan sandi (emailnya belum terverifikasi). Sekarang email terbukti milik pemilik Google,
    // maka sandi lama dihapus supaya orang lain yang mendaftar duluan dengan email ini tidak bisa masuk.
    db.prepare("UPDATE users SET google_id=?, hash=NULL WHERE id=?").run(p.sub, u.id);
    u = ambilUser(u.id);
  }
  buatSesi(res, u.id, true);
  res.json({ pengguna: publik(u, true) });
});

app.post("/api/logout", (req, res) => {
  if (req.tokenHash) db.prepare("DELETE FROM sessions WHERE token_hash=?").run(req.tokenHash);
  res.clearCookie("hp_sid", { path: "/" });
  res.json({ ok: true });
});

app.put("/api/profile", perluLogin, (req, res) => {
  const b = req.body || {}, s = k => String(b[k] ?? "").trim();
  const d = { nama: s("nama"), hp: s("hp").replace(/[\s-]/g, ""), alamat: s("alamat"), kota: s("kota"), provinsi: s("provinsi"), pos: s("pos"), catatan: s("catatan") };
  if (d.nama.length < 3 || d.nama.length > 80) return tolak(res, 400, "Nama lengkap minimal 3 huruf.");
  if (!/^(\+62|62|0)8\d{7,12}$/.test(d.hp)) return tolak(res, 400, "Nomor HP belum benar. Contoh: 081234567890");
  if (d.alamat.length < 10 || d.alamat.length > 300) return tolak(res, 400, "Alamat terlalu singkat, tulis lebih lengkap.");
  if (d.kota.length < 2 || d.kota.length > 60 || d.provinsi.length < 2 || d.provinsi.length > 60) return tolak(res, 400, "Kota dan provinsi wajib diisi.");
  if (!/^\d{5}$/.test(d.pos)) return tolak(res, 400, "Kode pos harus 5 angka.");
  if (d.catatan.length > 100) return tolak(res, 400, "Patokan maksimal 100 huruf.");
  db.prepare("UPDATE users SET nama=?, hp=?, alamat=?, kota=?, provinsi=?, pos=?, catatan=? WHERE id=?").run(d.nama, d.hp, d.alamat, d.kota, d.provinsi, d.pos, d.catatan, req.user.id);
  res.json({ pengguna: publik(ambilUser(req.user.id), req.user.via_google) });
});

/* ----- Pesanan ----- */
function ambilPesanan(where, params, batasBaris = 200) {
  const os = db.prepare(`SELECT o.*, u.email FROM orders o JOIN users u ON u.id=o.user_id WHERE ${where} ORDER BY o.id DESC LIMIT ${batasBaris}`).all(...params);
  const itm = db.prepare("SELECT nama, ukuran, harga, qty FROM order_items WHERE order_id=?");
  return os.map(o => ({ kode: o.kode, status: o.status, kurir: o.kurir, bayar: o.bayar, subtotal: o.subtotal, ongkir: o.ongkir, total: o.total,
    penerima: o.penerima, hp: o.hp, alamat: o.alamat, email: o.email, dibuat: o.dibuat, items: itm.all(o.id) }));
}
const kodeBaru = () => { const t = new Date().toISOString().slice(0, 10).replace(/-/g, ""); return `HP-${t}-${crypto.randomBytes(3).toString("hex").toUpperCase()}`; };

app.post("/api/orders", perluLogin, (req, res) => {
  const u = req.user;
  if (!lengkap(u)) return tolak(res, 400, "Lengkapi data pengiriman dulu.");
  const { items, kurir, bayar } = req.body || {};
  if (!Array.isArray(items) || !items.length || items.length > 30) return tolak(res, 400, "Keranjang kosong atau terlalu banyak item.");
  if (!["reguler", "express"].includes(kurir)) return tolak(res, 400, "Pilihan pengiriman tidak valid.");
  if (!PEMBAYARAN.includes(bayar)) return tolak(res, 400, "Metode pembayaran tidak valid.");
  const baris = [];
  for (const i of items) {   // harga SELALU diambil dari server, bukan dari browser
    const p = i && produk.find(x => x.id === i.id);
    if (!p || !Number.isInteger(i.qty) || i.qty < 1 || i.qty > KONFIG.MAKS_QTY || !(p.ukuran || KONFIG.UKURAN).includes(i.ukuran)) return tolak(res, 400, "Ada item yang tidak valid.");
    baris.push({ id: p.id, nama: p.nama, ukuran: i.ukuran, harga: p.harga, qty: i.qty });
  }
  const subtotal = baris.reduce((t, b) => t + b.harga * b.qty, 0);
  const ongkir = kurir === "express" ? KONFIG.ONGKIR_EXPRESS : (subtotal >= KONFIG.GRATIS_ONGKIR ? 0 : KONFIG.ONGKIR_REGULER);
  const alamat = `${u.alamat}, ${u.kota}, ${u.provinsi} ${u.pos}` + (u.catatan ? ` (Patokan: ${u.catatan})` : "");
  const kodePesanan = db.transaksi(() => {
    let kode; do { kode = kodeBaru(); } while (db.prepare("SELECT 1 FROM orders WHERE kode=?").get(kode));
    const r = db.prepare("INSERT INTO orders(kode,user_id,kurir,bayar,subtotal,ongkir,total,penerima,hp,alamat) VALUES(?,?,?,?,?,?,?,?,?,?)")
      .run(kode, u.id, kurir, bayar, subtotal, ongkir, subtotal + ongkir, u.nama, u.hp, alamat);
    const ins = db.prepare("INSERT INTO order_items(order_id,produk_id,nama,ukuran,harga,qty) VALUES(?,?,?,?,?,?)");
    baris.forEach(b => ins.run(r.lastInsertRowid, b.id, b.nama, b.ukuran, b.harga, b.qty));
    return kode;
  });
  res.status(201).json({ pesanan: ambilPesanan("o.kode=?", [kodePesanan])[0] });
});

app.get("/api/orders", perluLogin, (req, res) => res.json({ pesanan: ambilPesanan("o.user_id=?", [req.user.id]) }));

/* ----- Admin ----- */
app.get("/api/admin/orders", perluAdmin, (req, res) => res.json({ pesanan: ambilPesanan("1=1", [], 500) }));
app.patch("/api/admin/orders/:kode", perluAdmin, (req, res) => {
  const status = (req.body || {}).status;
  if (!STATUS.includes(status)) return tolak(res, 400, "Status tidak valid.");
  const r = db.prepare("UPDATE orders SET status=? WHERE kode=?").run(status, req.params.kode);
  r.changes ? res.json({ ok: true }) : tolak(res, 404, "Pesanan tidak ditemukan.");
});

app.use("/api", (req, res) => tolak(res, 404, "Tidak ditemukan."));
app.use((err, req, res, next) => tolak(res, err.status || 500, err.status === 400 ? "Data tidak valid." : "Terjadi kesalahan di server."));
app.use(express.static(path.join(__dirname, "public")));

app.listen(PORT, () => {
  console.log(`Humble People berjalan di http://localhost:${PORT}`);
  if (!GOOGLE_CLIENT_ID) console.log("Catatan: GOOGLE_CLIENT_ID belum diisi, login Google nonaktif.");
});
