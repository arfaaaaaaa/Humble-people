/* ===== HALAMAN INFO (Customer Service, Cara Pesan, dll). Ubah isi teks sesuai kebijakan tokomu ===== */
(() => {
  const isi = {
    "cara-pesan": ["Cara Pesan", "1. Pilih produk dan ukuran.<br>2. Tekan Tambah ke Keranjang atau Beli Sekarang.<br>3. Masuk atau daftar, lalu lengkapi alamat pengiriman.<br>4. Periksa checkout dan tekan Buat Pesanan via WhatsApp.<br>5. Kami konfirmasi total dan pembayaran lewat WhatsApp."],
    pengiriman: ["Pengiriman", "Reguler 3–5 hari (Rp15.000) dan Express 1–2 hari (Rp25.000). Gratis ongkir Reguler untuk belanja di atas Rp500.000."],
    tukar: ["Pengembalian & Tukar Ukuran", "Tukar ukuran maksimal 7 hari setelah paket diterima, selama barang belum dipakai dan label masih terpasang. Hubungi kami lewat WhatsApp."],
    tentang: ["Tentang Humble People", "Humble People adalah brand clothing lokal untuk kamu yang rendah hati tapi tetap berkelas."]
  };
  document.addEventListener("click", e => {
    const a = e.target.closest("[data-info]");
    if (!a) return;
    e.preventDefault();
    const k = a.dataset.info;
    if (k === "kontak") return window.open(`https://wa.me/${NOMOR_WA}`, "_blank");
    Modal.buka(`<h2>${isi[k][0]}</h2><p class="sub">${isi[k][1]}</p>`, 460);
  });
})();
