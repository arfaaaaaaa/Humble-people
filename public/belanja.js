/* ===== FITUR BELANJA: detail produk, beli sekarang, checkout ===== */
const Belanja = (() => {
  const harga = i => cariProduk(i.id).harga * i.qty;
  const jumlahSub = items => items.reduce((t, i) => t + harga(i), 0);

  /* 1) Tampilan detail produk (muncul saat gambar produk ditekan) */
  function detail(id, ukuranAwal) {
    const p = cariProduk(id), uk = p.ukuran || UKURAN;
    let pilih = ukuranAwal || (uk.includes("M") ? "M" : uk[0]);
    const m = Modal.buka(`
      <div class="detail">
        <div class="d-galeri">
          <div class="d-foto" id="d-foto">${gambar(p)}</div>
          ${daftarFoto(p).length > 1 ? `<div class="d-mini">${daftarFoto(p).map((_, i) => `<button type="button" class="mini ${i ? "" : "aktif"}" data-i="${i}">${gambar(p, i)}</button>`).join("")}</div>` : ""}
        </div>
        <div class="d-info">
          <small class="d-kat">${esc(p.kategori)}</small>
          <h2>${esc(p.nama)}</h2>
          <p class="d-harga">${rupiah(p.harga)}${p.lama ? ` <s>${rupiah(p.lama)}</s> <span class="lencana diskon">-${Math.round((1 - p.harga / p.lama) * 100)}%</span>` : ""}</p>
          <table class="spek">
            <tr><td>Bahan</td><td>${esc(p.bahan)}</td></tr>
            <tr><td>Warna</td><td>${esc(p.warna)}</td></tr>
            <tr><td>Kategori</td><td>${esc(p.kategori)}</td></tr>
          </table>
          <p class="lbl">Pilih ukuran <button type="button" class="btn-teks" id="d-panduan">Panduan ukuran</button></p>
          <div class="ukuran">${uk.map(u => `<button type="button" class="chip ${u === pilih ? "aktif" : ""}" data-u="${esc(u)}">${esc(u)}</button>`).join("")}</div>
          <div class="d-aksi">
            <button type="button" class="tombol-garis" id="d-keranjang">Tambah ke Keranjang</button>
            <button type="button" class="tombol" id="d-beli">Beli Sekarang</button>
          </div>
          <button type="button" class="fav-detail" data-fav="${id}">${IKON.heart} Simpan ke favorit</button>
          <div class="akordion">
            <details open><summary>Deskripsi & Fit</summary><p>${esc(p.deskripsi)} Jika ragu antara dua ukuran, pilih yang lebih besar.</p></details>
            <details><summary>Material</summary><p>${esc(p.bahan)}</p></details>
            <details><summary>Perawatan</summary><p>Cuci dengan air dingin, balik bagian dalam, jangan pakai pemutih, setrika suhu rendah.</p></details>
            <details><summary>Pengiriman & Pengembalian</summary><p>Estimasi 3–5 hari (Reguler) atau 1–2 hari (Express). Gratis ongkir Reguler untuk belanja di atas ${rupiah(GRATIS_ONGKIR)}. Tukar ukuran maksimal 7 hari selama barang belum dipakai.</p></details>
          </div>
        </div>
      </div>`, 820);
    m.querySelectorAll(".chip").forEach(c => c.onclick = () => {
      m.querySelectorAll(".chip").forEach(x => x.classList.remove("aktif"));
      c.classList.add("aktif");
      pilih = c.dataset.u;
    });
    m.querySelectorAll(".mini").forEach(t => t.onclick = () => {   // ganti foto besar saat foto kecil diklik
      m.querySelectorAll(".mini").forEach(x => x.classList.remove("aktif"));
      t.classList.add("aktif");
      m.querySelector("#d-foto").innerHTML = gambar(p, Number(t.dataset.i));
    });
    m.querySelector("#d-keranjang").onclick = () => { Modal.tutup(); tambah(id, pilih); };
    m.querySelector("#d-beli").onclick = () => jumlah(id, pilih);
    m.querySelector("#d-panduan").onclick = () => panduan(id, pilih);
    Favorit.segarkan();
  }

  /* Panduan ukuran (GANTI angka dengan ukuran asli produkmu, dalam cm) */
  function panduan(id, ukuran) {
    const m = Modal.buka(`<h2>Panduan Ukuran</h2><p class="sub">Ukuran dalam cm. Toleransi sekitar 1–2 cm.</p>
      <table class="spek tabel-ukuran"><tr><th>Ukuran</th><th>Lebar dada</th><th>Panjang</th><th>Bahu</th></tr>
      <tr><td>S</td><td>96</td><td>66</td><td>43</td></tr><tr><td>M</td><td>100</td><td>68</td><td>45</td></tr>
      <tr><td>L</td><td>106</td><td>70</td><td>47</td></tr><tr><td>XL</td><td>112</td><td>72</td><td>49</td></tr></table>
      <button type="button" class="tombol btn-blok" id="p-kembali">Kembali ke produk</button>`, 460);
    m.querySelector("#p-kembali").onclick = () => detail(id, ukuran);
  }

  /* 2) Atur jumlah (+ / -) setelah menekan Beli Sekarang */
  function jumlah(id, ukuran) {
    const p = cariProduk(id);
    let qty = 1;
    const m = Modal.buka(`
      <h2>Beli Sekarang</h2>
      <p class="sub">Atur jumlah barang yang ingin kamu beli.</p>
      <div class="ringkas"><div class="thumb">${gambar(p)}</div>
        <div><h4>${esc(p.nama)}</h4><p class="meta">Ukuran: ${esc(ukuran)}</p><p class="hrg">${rupiah(p.harga)}</p></div></div>
      <div class="jml-baris"><span>Jumlah</span>
        <div class="qty"><button type="button" id="j-kurang">−</button><span id="j-qty">1</span><button type="button" id="j-tambah">+</button></div></div>
      <div class="baris-total"><span>Subtotal</span><strong id="j-total"></strong></div>
      <button type="button" class="tombol btn-blok" id="j-beli">Beli Sekarang</button>
      <button type="button" class="btn-teks btn-blok" id="j-kembali">← Kembali ke detail</button>`, 440);
    const segar = () => { m.querySelector("#j-qty").textContent = qty; m.querySelector("#j-total").textContent = rupiah(p.harga * qty); };
    segar();
    m.querySelector("#j-kurang").onclick = () => { qty = Math.max(1, qty - 1); segar(); };
    m.querySelector("#j-tambah").onclick = () => { if (qty >= MAKS_QTY) toast(`Maksimal ${MAKS_QTY} per pembelian`); else qty++; segar(); };
    m.querySelector("#j-kembali").onclick = () => detail(id, ukuran);
    /* belum login -> diarahkan login & isi data dulu, setelah itu langsung ke checkout */
    m.querySelector("#j-beli").onclick = () => Auth.perlu(() => checkout([{ id, ukuran, qty }], false));
  }

  /* 3) Checkout: alamat otomatis dari data akun */
  function checkout(items, dariKeranjang) {
    const u = Auth.pengguna();
    let kurir = "reguler", bayar = "Transfer Bank";
    const sub = jumlahSub(items);
    const ongkir = () => kurir === "express" ? ONGKIR_EXPRESS : (sub >= GRATIS_ONGKIR ? 0 : ONGKIR_REGULER);
    const opsi = (nama, nilai, label, ket, cek) =>
      `<label class="opsi"><input type="radio" name="${nama}" value="${nilai}" ${cek ? "checked" : ""}><span><strong>${label}</strong><small>${ket}</small></span></label>`;
    const m = Modal.buka(`
      <h2>Checkout</h2>
      <p class="sub">Periksa kembali pesananmu sebelum dikirim.</p>
      <div class="kotak">
        <div class="kotak-judul"><h4>📍 Alamat Pengiriman</h4><button type="button" class="btn-teks" id="c-ubah">Ubah</button></div>
        <p><strong>${esc(u.nama)}</strong> · ${esc(u.hp)}</p>
        <p>${esc(u.alamat)}, ${esc(u.kota)}, ${esc(u.provinsi)} ${esc(u.pos)}</p>
        ${u.catatan ? `<p class="meta">Patokan: ${esc(u.catatan)}</p>` : ""}
      </div>
      <div class="kotak"><h4>🛍 Pesanan</h4>${items.map(i => {
        const p = cariProduk(i.id);
        return `<div class="baris-item"><span class="baris-nama"><span class="thumb-kecil">${gambar(p)}</span>${esc(p.nama)} (${esc(i.ukuran)}) × ${i.qty}</span><strong>${rupiah(harga(i))}</strong></div>`;
      }).join("")}</div>
      <div class="kotak"><h4>🚚 Pengiriman</h4>
        ${opsi("kurir", "reguler", "Reguler", "Estimasi 3–5 hari · " + (sub >= GRATIS_ONGKIR ? "Gratis" : rupiah(ONGKIR_REGULER)), true)}
        ${opsi("kurir", "express", "Express", "Estimasi 1–2 hari · " + rupiah(ONGKIR_EXPRESS))}</div>
      <div class="kotak"><h4>💳 Pembayaran</h4>
        ${opsi("bayar", "Transfer Bank", "Transfer Bank", "Detail rekening dikirim lewat WhatsApp", true)}
        ${opsi("bayar", "QRIS", "QRIS", "Kode QRIS dikirim lewat WhatsApp")}
        ${opsi("bayar", "COD", "Bayar di Tempat (COD)", "Bayar tunai saat paket tiba")}</div>
      <div class="baris-item"><span>Subtotal</span><span>${rupiah(sub)}</span></div>
      <div class="baris-item"><span>Ongkos kirim</span><span id="c-ongkir"></span></div>
      <div class="baris-total"><span>Total</span><strong id="c-total"></strong></div>
      <button type="button" class="tombol btn-blok" id="c-pesan">Buat Pesanan</button>`, 560);
    const segar = () => {
      const o = ongkir();
      m.querySelector("#c-ongkir").textContent = o ? rupiah(o) : "Gratis";
      m.querySelector("#c-total").textContent = rupiah(sub + o);
    };
    segar();
    m.querySelectorAll("input[type=radio]").forEach(r => r.onchange = () => {
      if (r.name === "kurir") kurir = r.value; else bayar = r.value;
      segar();
    });
    m.querySelector("#c-ubah").onclick = () => Auth.bukaProfil(() => checkout(items, dariKeranjang));
    m.querySelector("#c-pesan").onclick = async e => {
      const tombol = e.currentTarget;
      tombol.disabled = true;
      tombol.textContent = "Menyimpan pesanan...";
      try {   // server menghitung ulang harga & menyimpan pesanan
        const r = await Api.post("/api/orders", { items: items.map(({ id, ukuran, qty }) => ({ id, ukuran, qty })), kurir, bayar });
        if (dariKeranjang) { keranjang = []; simpan(); tampilkanKeranjang(); }
        Pesanan.sukses(r.pesanan);
      } catch (err) {
        toast(err.message);
        tombol.disabled = false;
        tombol.textContent = "Buat Pesanan";
      }
    };
  }

  const dariKeranjang = () => Auth.perlu(() => checkout(keranjang.map(i => ({ ...i })), true));
  return { detail, dariKeranjang };
})();
