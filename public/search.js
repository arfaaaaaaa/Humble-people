/* ===== FITUR SEARCH ===== */
(() => {
  const latar = document.createElement("div");
  latar.className = "cari-latar";
  latar.innerHTML = `<div class="cari-kotak">
    <div class="cari-input"><span>${IKON.search}</span>
      <input id="cari-q" type="text" placeholder="Cari: kaos, hoodie, hitam, katun..." autocomplete="off">
      <button type="button" id="cari-x" aria-label="Tutup">✕</button></div>
    <div id="cari-hasil"></div></div>`;
  document.body.appendChild(latar);

  /* Posisi huruf yang cocok (untuk di-stabilo). 1 huruf = awal kata */
  function posisi(nama, q) {
    const n = nama.toLowerCase();
    if (q.length > 1) return n.indexOf(q);
    for (let i = 0; i < n.length; i++) if ((i === 0 || n[i - 1] === " ") && n[i] === q) return i;
    return -1;
  }
  const sorot = (t, q) => {
    const i = posisi(t, q);
    return i < 0 ? esc(t) : esc(t.slice(0, i)) + "<mark>" + esc(t.slice(i, i + q.length)) + "</mark>" + esc(t.slice(i + q.length));
  };
  /* 1 huruf -> cocokkan inisial kata di nama. 2+ huruf -> cari di nama, kategori, bahan, warna */
  const cocok = (p, q) => q.length === 1
    ? p.nama.toLowerCase().split(" ").some(k => k.startsWith(q))
    : [p.nama, p.kategori, p.bahan, p.warna].some(t => t.toLowerCase().includes(q));

  function render() {
    const q = $("cari-q").value.trim().toLowerCase(), h = $("cari-hasil");
    if (!q) { h.innerHTML = `<p class="cari-info">Ketik nama produk, kategori, bahan, atau warna.</p>`; return; }
    const hasil = produk.filter(p => cocok(p, q));
    if (!hasil.length) {
      h.innerHTML = `<div class="kosong"><div class="kosong-ikon">🔎</div><h3>Barang tidak tersedia</h3>
        <p>Tidak ada produk yang cocok dengan “${esc(q)}”. Coba kata kunci lain.</p></div>`;
      return;
    }
    h.innerHTML = `<p class="cari-info">${hasil.length} produk ditemukan</p>` + hasil.map(p => `
      <button type="button" class="cari-item" data-id="${p.id}">
        <div class="thumb">${gambar(p)}</div>
        <div class="cari-teks"><h4>${sorot(p.nama, q)}</h4>
          <p class="meta">${q.length > 1 ? `${esc(p.bahan)} · ${esc(p.warna)} · Ukuran ${(p.ukuran || UKURAN).map(esc).join("/")}` : esc(p.kategori)}</p></div>
        <strong>${rupiah(p.harga)}</strong>
      </button>`).join("");
  }
  const buka = () => { latar.classList.add("tampil"); $("cari-q").value = ""; render(); setTimeout(() => $("cari-q").focus(), 50); };
  const tutup = () => latar.classList.remove("tampil");

  $("btn-cari").addEventListener("click", buka);
  $("cari-x").addEventListener("click", tutup);
  $("cari-q").addEventListener("input", render);
  latar.addEventListener("click", e => {
    if (e.target === latar) return tutup();
    const item = e.target.closest(".cari-item");
    if (item) { tutup(); Belanja.detail(Number(item.dataset.id)); }
  });
  document.addEventListener("keydown", e => { if (e.key === "Escape") tutup(); });
})();
