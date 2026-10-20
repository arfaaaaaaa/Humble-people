/* Pengaturan toko, daftar produk, nomor WhatsApp & Google Client ID datang dari server
   lewat konfigurasi.js (ubah di produk.json dan .env). File ini berisi alat bantu bersama. */

/* ===== IKON SVG ===== */
const svg = d => `<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">${d}</svg>`;
const IKON = {
  search: svg('<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>'),
  user:   svg('<circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 4-6 8-6s8 2 8 6"/>'),
  heart:  svg('<path d="M12 21s-8-5.2-8-11a4.5 4.5 0 0 1 8-2.8A4.5 4.5 0 0 1 20 10c0 5.8-8 11-8 11z"/>'),
  bag:    svg('<path d="M5 8h14l-1 12H6L5 8z"/><path d="M9 8a3 3 0 0 1 6 0"/>')
};

/* ===== ALAT BANTU (dipakai semua file) ===== */
const $ = id => document.getElementById(id);
const rupiah = angka => "Rp" + angka.toLocaleString("id-ID");
const cariProduk = id => produk.find(p => p.id === id);
/* esc: mengamankan teks buatan user sebelum ditampilkan di halaman */
const esc = t => String(t ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

/* Notifikasi kecil di bawah layar */
let timerToast;
function toast(pesan) {
  const t = $("toast");
  t.textContent = pesan;
  t.classList.add("tampil");
  clearTimeout(timerToast);
  timerToast = setTimeout(() => t.classList.remove("tampil"), 2400);
}

/* ===== FOTO PRODUK =====
   Foto ditaruh di folder public/foto lalu nama filenya ditulis di produk.json ("foto").
   Kalau produk tidak punya foto (atau filenya tidak ada), otomatis tampil emoji "ikon". */
const daftarFoto = p => Array.isArray(p.foto) ? p.foto : (p.foto ? [p.foto] : []);
const gambar = (p, i = 0) => {
  const f = daftarFoto(p)[i];
  return f ? `<img src="foto/${encodeURIComponent(f)}" alt="${esc(p.nama)}" loading="lazy" onerror="this.outerHTML='${p.ikon || "👕"}'">` : (p.ikon || "👕");
};
/* Foto kedua untuk efek ganti foto saat kursor diarahkan ke kartu produk */
const gambarKedua = p => daftarFoto(p)[1] ? `<img class="alt" src="foto/${encodeURIComponent(daftarFoto(p)[1])}" alt="" loading="lazy" onerror="this.remove()">` : "";
