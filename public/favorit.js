/* ===== FITUR FAVORIT (wishlist) ===== */
const Favorit = (() => {
  const K = "hp-favorit";
  let ids = [];
  try { const d = JSON.parse(localStorage.getItem(K)); if (Array.isArray(d)) ids = d.filter(i => cariProduk(i)); } catch (e) {}
  const simpan = () => { try { localStorage.setItem(K, JSON.stringify(ids)); } catch (e) {} };
  const ada = id => ids.includes(id);

  function segarkan() {   // update angka di ikon hati & warna semua tombol hati
    $("jumlah-favorit").textContent = ids.length;
    $("jumlah-favorit").hidden = !ids.length;
    document.querySelectorAll("[data-fav]").forEach(b => {
      const on = ada(Number(b.dataset.fav));
      b.classList.toggle("aktif", on);
      if (b.classList.contains("fav-detail")) b.innerHTML = IKON.heart + (on ? " Tersimpan di favorit" : " Simpan ke favorit");
    });
  }
  function toggle(id) {
    if (ada(id)) { ids = ids.filter(x => x !== id); toast("Dihapus dari favorit"); }
    else { ids.push(id); toast(`♥ ${cariProduk(id).nama} disimpan ke favorit`); }
    simpan();
    segarkan();
    if (Modal.el && Modal.el.querySelector(".fav-modal")) buka();   // segarkan daftar jika sedang terbuka
  }
  function buka() {
    const isi = ids.length
      ? `<div class="fav-daftar">${ids.map(id => { const p = cariProduk(id); return `
          <div class="fav-item"><div class="thumb">${gambar(p)}</div>
            <div class="fav-info" data-lihat="${id}"><h4>${esc(p.nama)}</h4><p class="meta">${esc(p.warna)}</p><p class="hrg">${rupiah(p.harga)}</p></div>
            <button type="button" class="hapus" data-fav="${id}" aria-label="Hapus dari favorit">✕</button></div>`; }).join("")}</div>`
      : `<div class="kosong"><div class="kosong-ikon">♡</div><h3>Belum ada favorit</h3><p>Tekan ikon hati pada produk untuk menyimpannya di sini.</p></div>`;
    const m = Modal.buka(`<div class="fav-modal"><h2>Favorit Saya <span class="meta">(${ids.length})</span></h2>${isi}</div>`, 480);
    m.querySelectorAll("[data-lihat]").forEach(el => el.onclick = () => Belanja.detail(Number(el.dataset.lihat)));
  }

  document.addEventListener("click", e => {
    const b = e.target.closest("[data-fav]");
    if (b) { e.preventDefault(); toggle(Number(b.dataset.fav)); }
  });
  $("btn-favorit").addEventListener("click", buka);
  segarkan();
  return { ada, toggle, buka, segarkan };
})();
