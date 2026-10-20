/* ===== KATALOG: filter, urutkan, tampilan kolom, tampilkan lebih banyak ===== */
const Katalog = (() => {
  const PER_HALAMAN = 8;
  const S = { kat: new Set(), ukuran: new Set(), warna: new Set(), min: "", max: "", diskon: false, urut: "rekomendasi", tampil: PER_HALAMAN };
  const persen = p => p.lama ? Math.round((1 - p.harga / p.lama) * 100) : 0;
  const ukuranProduk = p => p.ukuran || UKURAN;
  const kategoriList = [...new Set(produk.map(p => p.kategori))];
  const warnaList = [...new Map(produk.map(p => [p.warna, p.hex]))];
  const ukuranList = [...new Set(produk.flatMap(ukuranProduk))];
  const toggle = (set, v) => set.has(v) ? set.delete(v) : set.add(v);

  /* Menyaring & mengurutkan produk sesuai pilihan */
  function hasil() {
    const h = produk.filter(p =>
      (!S.kat.size || S.kat.has(p.kategori)) &&
      (!S.ukuran.size || ukuranProduk(p).some(u => S.ukuran.has(u))) &&
      (!S.warna.size || S.warna.has(p.warna)) &&
      (S.min === "" || p.harga >= S.min) && (S.max === "" || p.harga <= S.max) &&
      (!S.diskon || p.lama));
    const urut = {
      terbaru: (a, b) => (b.baru ? 1 : 0) - (a.baru ? 1 : 0) || b.id - a.id,
      termurah: (a, b) => a.harga - b.harga,
      termahal: (a, b) => b.harga - a.harga,
      diskon: (a, b) => persen(b) - persen(a),
      nama: (a, b) => a.nama.localeCompare(b.nama)
    }[S.urut];
    return urut ? h.sort(urut) : h;
  }

  function kartu(p) {
    const d = persen(p);
    return `
      <article class="kartu" data-id="${p.id}">
        <div class="foto-wrap">
          <div class="foto" title="Lihat detail">${gambar(p)}${gambarKedua(p)}</div>
          <div class="lencana-wrap">${p.baru ? '<span class="lencana">BARU</span>' : ""}${d ? `<span class="lencana diskon">-${d}%</span>` : ""}</div>
          <button type="button" class="fav" data-fav="${p.id}" aria-label="Simpan ke favorit">${IKON.heart}</button>
          <div class="cepat"><small>Tambah cepat ke keranjang</small>
            <div class="ukuran">${ukuranProduk(p).map(u => `<button type="button" class="chip" data-cepat="${esc(u)}">${esc(u)}</button>`).join("")}</div></div>
        </div>
        <h3>${esc(p.nama)}</h3>
        <p class="harga ${d ? "sale" : ""}">${rupiah(p.harga)}${d ? `<s>${rupiah(p.lama)}</s>` : ""}</p>
        <div class="warna-baris"><i style="background:${p.hex}"></i>${esc(p.warna)}</div>
      </article>`;
  }

  function judul() {
    const satu = S.kat.size === 1 ? [...S.kat][0] : "";
    const nama = satu || (S.diskon ? "Sale" : "Barang Baru");
    $("judul-katalog").textContent = nama;
    $("bc-aktif").textContent = nama;
    document.title = `${nama} - Humble People`;
    const kunci = satu || (S.diskon && !S.kat.size ? "sale" : "");
    document.querySelectorAll("#menu a").forEach(a => a.classList.toggle("aktif", a.dataset.kat === kunci));
    const pil = [["", "Semua", produk.length], ...kategoriList.map(k => [k, k, produk.filter(p => p.kategori === k).length])];
    $("sub-kat").innerHTML = pil.map(([k, n, c]) => `<button type="button" class="pil ${k === satu ? "aktif" : ""}" data-kat="${esc(k)}">${esc(n)} [${c}]</button>`).join("");
  }

  /* Label filter yang sedang aktif (bisa dihapus satu per satu) */
  function chipAktif() {
    const c = [];
    S.kat.forEach(v => c.push(["kat", v, v]));
    S.ukuran.forEach(v => c.push(["ukuran", v, "Ukuran " + v]));
    S.warna.forEach(v => c.push(["warna", v, v]));
    if (S.min !== "" || S.max !== "") c.push(["harga", "", `Harga ${S.min !== "" ? rupiah(S.min) : "0"} – ${S.max !== "" ? rupiah(S.max) : "∞"}`]);
    if (S.diskon) c.push(["diskon", "", "Sale"]);
    $("chip-aktif").innerHTML = c.map(([t, v, l]) => `<button type="button" class="chip-x" data-t="${t}" data-v="${esc(v)}">${esc(l)} ✕</button>`).join("")
      + (c.length ? '<button type="button" class="btn-teks" id="hapus-semua">Hapus semua</button>' : "");
  }

  function render() {
    const h = hasil(), tampil = h.slice(0, S.tampil);
    $("daftar-produk").innerHTML = tampil.length ? tampil.map(kartu).join("") :
      `<div class="kosong" style="grid-column:1/-1"><div class="kosong-ikon">🔎</div><h3>Barang tidak tersedia</h3>
        <p>Tidak ada produk yang cocok dengan filter kamu.</p><button type="button" class="tombol" id="reset-filter">Hapus semua filter</button></div>`;
    $("jumlah-produk").textContent = `${h.length} produk`;
    $("muat").innerHTML = h.length ? `<p>Menampilkan ${tampil.length} dari ${h.length} produk</p>
      <div class="bar-muat"><div style="width:${(tampil.length / h.length) * 100}%"></div></div>
      ${tampil.length < h.length ? '<button type="button" class="btn-garis" id="btn-muat">Tampilkan lebih banyak</button>' : ""}` : "";
    $("f-lihat").textContent = `Lihat ${h.length} produk`;
    chipAktif();
    judul();
    Favorit.segarkan();
  }

  function reset() { S.kat.clear(); S.ukuran.clear(); S.warna.clear(); S.min = S.max = ""; S.diskon = false; S.tampil = PER_HALAMAN; }
  function pilihKategori(k) { reset(); if (k === "sale") S.diskon = true; else if (k) S.kat.add(k); render(); }
  const segar = () => { S.tampil = PER_HALAMAN; render(); };

  /* ----- Panel filter ----- */
  function bangunFilter() {
    const cek = (v, n, aktif) => `<label class="f-opsi"><input type="checkbox" data-f="kat" value="${esc(v)}" ${aktif ? "checked" : ""}>${esc(v)}<small>${n}</small></label>`;
    $("f-isi").innerHTML = `
      <details open><summary>Kategori</summary>${kategoriList.map(k => cek(k, produk.filter(p => p.kategori === k).length, S.kat.has(k))).join("")}</details>
      <details open><summary>Ukuran</summary><div class="ukuran f-wrap">${ukuranList.map(u => `<button type="button" class="chip ${S.ukuran.has(u) ? "aktif" : ""}" data-fu="${esc(u)}">${esc(u)}</button>`).join("")}</div></details>
      <details open><summary>Warna</summary><div class="f-swatch">${warnaList.map(([w, hx]) => `<div class="sw ${S.warna.has(w) ? "aktif" : ""}" data-fw="${esc(w)}"><i style="background:${hx}"></i>${esc(w)}</div>`).join("")}</div></details>
      <details open><summary>Harga (Rp)</summary><div class="f-harga"><input type="number" min="0" id="f-min" placeholder="Minimum" value="${S.min}"><input type="number" min="0" id="f-max" placeholder="Maksimum" value="${S.max}"></div></details>
      <details open><summary>Penawaran</summary><label class="f-opsi"><input type="checkbox" id="f-diskon" ${S.diskon ? "checked" : ""}>Hanya produk diskon (Sale)</label></details>`;
  }
  const bukaF = () => { bangunFilter(); $("panel-filter").classList.add("buka"); $("overlay-filter").classList.add("buka"); document.body.classList.add("kunci"); };
  const tutupF = () => { $("panel-filter").classList.remove("buka"); $("overlay-filter").classList.remove("buka"); document.body.classList.remove("kunci"); };

  $("f-isi").addEventListener("input", e => {
    const t = e.target;
    if (t.dataset.f) t.checked ? S.kat.add(t.value) : S.kat.delete(t.value);
    else if (t.id === "f-diskon") S.diskon = t.checked;
    else if (t.id === "f-min") S.min = t.value === "" ? "" : Number(t.value);
    else if (t.id === "f-max") S.max = t.value === "" ? "" : Number(t.value);
    segar();
  });
  $("f-isi").addEventListener("click", e => {
    const u = e.target.closest("[data-fu]"), w = e.target.closest("[data-fw]");
    if (u) { toggle(S.ukuran, u.dataset.fu); u.classList.toggle("aktif"); segar(); }
    if (w) { toggle(S.warna, w.dataset.fw); w.classList.toggle("aktif"); segar(); }
  });
  $("btn-filter").addEventListener("click", bukaF);
  $("tutup-filter").addEventListener("click", tutupF);
  $("overlay-filter").addEventListener("click", tutupF);
  $("f-lihat").addEventListener("click", tutupF);
  $("f-reset").addEventListener("click", () => { reset(); bangunFilter(); render(); });
  document.addEventListener("keydown", e => { if (e.key === "Escape") tutupF(); });

  /* ----- Daftar produk ----- */
  $("daftar-produk").addEventListener("click", e => {
    if (e.target.closest("#reset-filter")) return pilihKategori("");
    const k = e.target.closest(".kartu");
    if (!k) return;
    const id = Number(k.dataset.id), cepat = e.target.closest("[data-cepat]");
    if (cepat) return tambah(id, cepat.dataset.cepat);          // tambah cepat dari kartu
    if (e.target.closest(".foto, h3")) Belanja.detail(id);      // klik gambar/nama -> detail
  });
  $("muat").addEventListener("click", e => { if (e.target.closest("#btn-muat")) { S.tampil += PER_HALAMAN; render(); } });
  $("chip-aktif").addEventListener("click", e => {
    if (e.target.closest("#hapus-semua")) return pilihKategori("");
    const c = e.target.closest(".chip-x");
    if (!c) return;
    const { t, v } = c.dataset;
    if (t === "kat") S.kat.delete(v);
    if (t === "ukuran") S.ukuran.delete(v);
    if (t === "warna") S.warna.delete(v);
    if (t === "harga") S.min = S.max = "";
    if (t === "diskon") S.diskon = false;
    segar();
  });

  /* ----- Urutkan, kolom, menu kategori, promo ----- */
  $("urutkan").addEventListener("change", e => { S.urut = e.target.value; segar(); });
  $("kolom").addEventListener("click", e => {
    const b = e.target.closest("[data-k]");
    if (!b) return;
    $("kolom").querySelectorAll("button").forEach(x => x.classList.toggle("aktif", x === b));
    $("daftar-produk").style.setProperty("--kol", b.dataset.k);
  });
  document.addEventListener("click", e => {
    const a = e.target.closest("[data-kat]");
    if (!a) return;
    e.preventDefault();
    pilihKategori(a.dataset.kat);
    $("menu").classList.remove("buka");
    window.scrollTo({ top: 0, behavior: "smooth" });
  });
  $("promo-link").addEventListener("click", e => {
    e.preventDefault();
    reset(); S.max = 299000; render();
    $("judul-katalog").scrollIntoView({ behavior: "smooth" });
  });
  $("promo-x").addEventListener("click", () => $("promo-bar").remove());

  render();
  return { pilihKategori };
})();
