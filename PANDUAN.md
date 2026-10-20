# Humble People - Panduan Server

## 1. Menjalankan di komputer sendiri
1. Install **Node.js versi 22.13 atau lebih baru** (LTS) dari https://nodejs.org
2. Buka folder proyek ini di VS Code, lalu buka Terminal (menu Terminal → New Terminal).
3. Jalankan: `npm install`
4. Salin file `.env.example` menjadi `.env`, lalu isi (lihat bagian 2 dan 3).
5. Jalankan: `npm start`
6. Buka http://localhost:3000

Saat server menyala, mungkin muncul tulisan "ExperimentalWarning: SQLite" di terminal. Itu normal dan tidak berbahaya.

Website sekarang disajikan oleh server ini. **Jangan lagi memakai Live Server** dan jangan membuka index.html dengan klik dua kali.

## 2. Mengaktifkan Login Google
1. Buka https://console.cloud.google.com lalu buat project baru.
2. **APIs & Services → OAuth consent screen**: pilih External, isi nama aplikasi dan email.
3. **Credentials → Create credentials → OAuth client ID → Web application**.
4. Di **Authorized JavaScript origins** isi:
   - `http://localhost:3000`
   - (nanti) alamat domain tokomu, contoh `https://humblepeople.com` (harus https)
5. Salin **Client ID** ke `.env` pada baris `GOOGLE_CLIENT_ID=`, lalu jalankan ulang server.

## 3. Admin (melihat dan mengubah status pesanan)
Isi `ADMIN_EMAILS=` di `.env` dengan email Google-mu. Masuk ke website memakai tombol **Masuk dengan Google** dengan email itu, lalu buka ikon profil → **Kelola Pesanan (Admin)** (atau langsung /admin.html).
Admin hanya bisa lewat login Google supaya orang lain tidak bisa mengaku-ngaku memakai email admin.

## 4. Menambah / mengubah produk dan foto
**Produk** ada di file `produk.json`. Satu produk contohnya:
```json
{
  "id": 1,
  "nama": "Kaos Humble Basic",
  "harga": 129000,
  "lama": 159000,
  "kategori": "Kaos",
  "bahan": "Katun Combed 24s",
  "warna": "Hitam",
  "hex": "#111111",
  "baru": true,
  "deskripsi": "Kaos polos potongan regular.",
  "ukuran": ["S", "M", "L", "XL"],
  "foto": ["kaos-basic-1.jpg", "kaos-basic-2.jpg"]
}
```
- Wajib diisi: `id`, `nama`, `harga`, `kategori`. Sisanya boleh dihapus.
- `id` harus unik. Jangan dipakai ulang untuk produk lain dan jangan diubah pada produk yang sudah pernah dipesan.
- `harga` angka tanpa titik. `lama` = harga sebelum diskon (hapus barisnya jika tidak diskon).
- Antar-produk dipisahkan koma. Seluruh isi dibungkus `[ ... ]`.

**Foto produk**
1. Taruh file foto di folder `public/foto/`.
2. Tulis nama filenya di `produk.json`: `"foto": "kaos.jpg"` (satu foto) atau `"foto": ["a.jpg", "b.jpg"]` (beberapa foto).
3. Foto pertama jadi foto utama. Foto kedua tampil saat kursor diarahkan ke kartu. Semua foto jadi galeri di halaman detail.
4. Produk tanpa foto otomatis memakai emoji (`ikon`).
- Saran: format .jpg/.png/.webp, rasio 3:4 (contoh 900x1200 piksel), di bawah 300 KB, nama file huruf kecil tanpa spasi.

**Memeriksa sebelum menyalakan server:** jalankan `npm run cek`. Perintah ini memberi tahu kalau ada salah ketik, id ganda, atau file foto yang tidak ditemukan. Server juga otomatis memeriksa saat `npm start` dan berhenti dengan pesan jelas kalau ada kesalahan.

Setelah mengubah `produk.json` atau menambah foto, jalankan ulang server (Ctrl+C lalu `npm start`).

Pengaturan lain:
- Nomor WhatsApp: `NOMOR_WA` di `.env`.
- Ongkir dan batas gratis ongkir: bagian `KONFIG` di `server.js`.
- Menu kategori di bagian atas dan footer: `public/index.html`.

## 5. Menayangkan ke internet (hosting)
Server ini harus berjalan terus dan butuh **penyimpanan yang tidak hilang**, karena database ada di file `data/toko.db`.
- Cocok: VPS (server virtual), atau layanan seperti Railway / Fly.io / Render **dengan persistent disk/volume**.
- Tidak cocok: paket gratis yang hapus file setiap deploy (data akun dan pesanan ikut hilang).
- Wajib memakai **HTTPS** (Google login tidak jalan di http selain localhost).
- Di hosting, atur environment variable yang sama dengan `.env`, ditambah `NODE_ENV=production`. Jika memakai volume, arahkan `DB_PATH` ke lokasi volume.
- **Backup** file `data/toko.db` secara rutin.

## 6. Keamanan
- Jangan upload file `.env` ke GitHub atau tempat umum (sudah ada di .gitignore).
- Kata sandi disimpan ter-hash (scrypt), sesi memakai cookie httpOnly, harga pesanan dihitung ulang oleh server.
- Akun yang daftar dengan email + sandi emailnya belum diverifikasi (belum ada pengiriman email). Jika kelak orang itu masuk lewat Google dengan email yang sama, sandi lamanya dihapus demi keamanan.
- Keranjang dan favorit masih disimpan di browser pelanggan, belum di server.
