/* ===== HALAMAN UTAMA: menjalankan fitur-fitur yang tersisa =====
   Produk ditampilkan oleh katalog.js, keranjang oleh keranjang.js, dll. */
$("btn-menu").addEventListener("click", () => $("menu").classList.toggle("buka"));
$("btn-member").addEventListener("click", () => Auth.daftar());

muat();                 // ambil isi keranjang yang tersimpan
tampilkanKeranjang();   // tampilkan angka & isi keranjang
