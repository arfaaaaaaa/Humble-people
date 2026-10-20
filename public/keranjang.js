/* ===== FITUR KERANJANG ===== */
const KUNCI_KERANJANG = "humble-people-keranjang";
let keranjang = [];   // contoh isi: { id: 1, ukuran: "M", qty: 2 }

function muat() {
  try {
    const data = JSON.parse(localStorage.getItem(KUNCI_KERANJANG));
    if (Array.isArray(data)) keranjang = data.filter(i => cariProduk(i.id) && i.qty > 0);
  } catch (e) { keranjang = []; }
}
function simpan() {
  try { localStorage.setItem(KUNCI_KERANJANG, JSON.stringify(keranjang)); } catch (e) {}
}

function tambah(id, ukuran) {
  const ada = keranjang.find(i => i.id === id && i.ukuran === ukuran);
  if (ada && ada.qty >= MAKS_QTY) return toast(`Maksimal ${MAKS_QTY} per produk`);
  if (ada) ada.qty++; else keranjang.push({ id, ukuran, qty: 1 });
  simpan();
  tampilkanKeranjang();
  bunyiBadge();
  toast(`✓ ${cariProduk(id).nama} (${ukuran}) masuk keranjang`);
}
function ubahQty(id, ukuran, selisih) {
  const item = keranjang.find(i => i.id === id && i.ukuran === ukuran);
  if (!item) return;
  item.qty += selisih;
  if (item.qty > MAKS_QTY) { item.qty = MAKS_QTY; toast(`Maksimal ${MAKS_QTY} per produk`); }
  if (item.qty <= 0) return hapus(id, ukuran);
  simpan();
  tampilkanKeranjang();
}
function hapus(id, ukuran) {
  keranjang = keranjang.filter(i => !(i.id === id && i.ukuran === ukuran));
  simpan();
  tampilkanKeranjang();
}
function kosongkan() {
  if (confirm("Kosongkan semua isi keranjang?")) { keranjang = []; simpan(); tampilkanKeranjang(); }
}
const hitungJumlah = () => keranjang.reduce((t, i) => t + i.qty, 0);
const hitungTotal = () => keranjang.reduce((t, i) => t + i.qty * cariProduk(i.id).harga, 0);

function tampilkanKeranjang() {
  const jumlah = hitungJumlah(), total = hitungTotal();
  $("jumlah-keranjang").textContent = jumlah;          // angka oranye di ikon
  $("jumlah-teks").textContent = jumlah ? `(${jumlah} item)` : "";

  const sisa = GRATIS_ONGKIR - total;
  $("teks-ongkir").innerHTML = sisa > 0
    ? `Belanja <strong>${rupiah(sisa)}</strong> lagi untuk <strong>gratis ongkir</strong>`
    : `🎉 Selamat! Kamu dapat <strong>gratis ongkir</strong>`;
  $("isi-bar").style.width = Math.min(100, (total / GRATIS_ONGKIR) * 100) + "%";

  const kosong = keranjang.length === 0;
  $("blok-ongkir").hidden = kosong;
  $("footer-keranjang").hidden = kosong;

  if (kosong) {
    $("isi-keranjang").innerHTML = `
      <div class="kosong"><div class="kosong-ikon">🛒</div>
        <h3>Keranjangmu masih kosong</h3><p>Yuk, pilih pakaian favoritmu dulu.</p>
        <button type="button" class="tombol" data-aksi="tutup">Mulai Belanja</button></div>`;
    return;
  }
  $("isi-keranjang").innerHTML = keranjang.map(i => {
    const p = cariProduk(i.id);
    return `
      <div class="item" data-id="${i.id}" data-ukuran="${esc(i.ukuran)}">
        <div class="thumb">${gambar(p)}</div>
        <div class="info"><h4>${esc(p.nama)}</h4><p class="meta">Ukuran: ${esc(i.ukuran)}</p><p class="hrg">${rupiah(p.harga)}</p>
          <div class="qty">
            <button type="button" data-aksi="kurang" aria-label="Kurangi">−</button><span>${i.qty}</span>
            <button type="button" data-aksi="plus" aria-label="Tambah">+</button></div></div>
        <div class="kanan-item">
          <button type="button" class="hapus" data-aksi="hapus" aria-label="Hapus item">🗑</button>
          <strong>${rupiah(p.harga * i.qty)}</strong></div>
      </div>`;
  }).join("");
  $("subtotal").textContent = rupiah(total);
}

function bukaPanel() {
  $("panel-keranjang").classList.add("buka");
  $("overlay").classList.add("buka");
  document.body.classList.add("kunci");
}
function tutupPanel() {
  $("panel-keranjang").classList.remove("buka");
  $("overlay").classList.remove("buka");
  document.body.classList.remove("kunci");
}
function bunyiBadge() {
  const b = $("jumlah-keranjang");
  b.classList.remove("bump");
  void b.offsetWidth;            // memaksa animasi diulang
  b.classList.add("bump");
}

$("isi-keranjang").addEventListener("click", e => {
  const tombol = e.target.closest("[data-aksi]");
  if (!tombol) return;
  const aksi = tombol.dataset.aksi;
  if (aksi === "tutup") return tutupPanel();
  const item = tombol.closest(".item");
  const id = Number(item.dataset.id), ukuran = item.dataset.ukuran;
  if (aksi === "plus") ubahQty(id, ukuran, 1);
  if (aksi === "kurang") ubahQty(id, ukuran, -1);
  if (aksi === "hapus") hapus(id, ukuran);
});
$("buka-keranjang").addEventListener("click", bukaPanel);
$("tutup-keranjang").addEventListener("click", tutupPanel);
$("overlay").addEventListener("click", tutupPanel);
$("toast").addEventListener("click", bukaPanel);
$("btn-kosongkan").addEventListener("click", kosongkan);
/* Checkout dari keranjang -> masuk ke fitur belanja (belanja.js) */
$("btn-checkout").addEventListener("click", () => { tutupPanel(); Belanja.dariKeranjang(); });
document.addEventListener("keydown", e => { if (e.key === "Escape") tutupPanel(); });
