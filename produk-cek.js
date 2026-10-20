/* ===== PEMERIKSA produk.json =====
   Dipakai server saat menyala, dan bisa dijalankan sendiri dengan: npm run cek
   Tujuannya: kalau ada salah ketik di produk.json, pesannya jelas dan mudah diperbaiki. */
const fs = require("fs");
const path = require("path");

const FOTO_OK = /^[\w][\w .\-()]*\.(jpe?g|png|webp|avif|gif)$/i;
const daftarFoto = p => Array.isArray(p.foto) ? p.foto : (p.foto ? [p.foto] : []);

function muat(fileProduk, folderFoto) {
  const fatal = [], peringatan = [];
  let mentah;
  try { mentah = JSON.parse(fs.readFileSync(fileProduk, "utf8")); }
  catch (e) {
    return { produk: [], peringatan, fatal: [`produk.json tidak bisa dibaca (${e.message}).\n     Biasanya ada koma, tanda kutip " atau kurung yang kurang/berlebih di dekat posisi yang disebut.`] };
  }
  if (!Array.isArray(mentah)) return { produk: [], peringatan, fatal: ["Isi produk.json harus diawali [ dan diakhiri ]."] };
  if (!mentah.length) peringatan.push("produk.json masih kosong, toko tampil tanpa produk.");

  const ids = new Set();
  const produk = mentah.map((p, n) => {
    const label = `Produk ke-${n + 1}${p && p.nama ? ` (${p.nama})` : ""}`;
    if (!p || typeof p !== "object" || Array.isArray(p)) { fatal.push(`${label}: bukan data produk yang benar.`); return null; }
    if (!Number.isInteger(p.id) || p.id < 1) fatal.push(`${label}: "id" harus angka bulat mulai dari 1.`);
    else if (ids.has(p.id)) fatal.push(`${label}: "id" ${p.id} dipakai dua kali. Setiap produk harus punya id berbeda.`);
    else ids.add(p.id);
    if (typeof p.nama !== "string" || !p.nama.trim()) fatal.push(`${label}: "nama" wajib diisi.`);
    if (!Number.isInteger(p.harga) || p.harga < 1) fatal.push(`${label}: "harga" harus angka bulat tanpa titik/koma, contoh 129000.`);
    if (typeof p.kategori !== "string" || !p.kategori.trim()) fatal.push(`${label}: "kategori" wajib diisi, contoh "Kaos".`);
    if (p.lama !== undefined && !(Number.isInteger(p.lama) && p.lama > p.harga)) peringatan.push(`${label}: "lama" (harga sebelum diskon) harus angka yang lebih besar dari "harga". Hapus baris "lama" jika tidak diskon.`);
    if (p.ukuran !== undefined && !(Array.isArray(p.ukuran) && p.ukuran.length && p.ukuran.every(u => typeof u === "string" && u.trim()))) fatal.push(`${label}: "ukuran" harus berupa daftar, contoh ["S","M","L"].`);
    if (p.hex !== undefined && !/^#[0-9a-f]{3,8}$/i.test(String(p.hex))) { peringatan.push(`${label}: "hex" bukan kode warna yang benar (contoh #111111), dipakai abu-abu.`); p = { ...p, hex: undefined }; }
    if (p.foto !== undefined && !(typeof p.foto === "string" || (Array.isArray(p.foto) && p.foto.every(f => typeof f === "string")))) {
      fatal.push(`${label}: "foto" harus berupa satu nama file, atau daftar nama file dalam tanda [ ].`);
    } else {
      for (const f of daftarFoto(p)) {
        if (!FOTO_OK.test(f)) fatal.push(`${label}: nama foto "${f}" tidak valid. Harus berakhiran .jpg/.png/.webp dan tanpa nama folder.`);
        else if (!fs.existsSync(path.join(folderFoto, f))) peringatan.push(`${label}: file foto "${f}" tidak ditemukan di folder public/foto, jadi tampil emoji. Cek ejaan nama file.`);
      }
    }
    const isi = Object.fromEntries(Object.entries(p).filter(([, v]) => v !== undefined));
    return { ikon: "👕", bahan: "-", warna: "-", hex: "#cccccc", deskripsi: "", ...isi, foto: daftarFoto(isi) };
  }).filter(Boolean);
  return { produk, fatal, peringatan };
}
module.exports = { muat };

/* Dijalankan langsung: npm run cek */
if (require.main === module) {
  const { produk, fatal, peringatan } = muat(path.join(__dirname, "produk.json"), path.join(__dirname, "public", "foto"));
  peringatan.forEach(m => console.log("⚠ " + m));
  if (fatal.length) { console.log("\n❌ Ada masalah yang harus diperbaiki di produk.json:\n" + fatal.map(m => " - " + m).join("\n")); process.exit(1); }
  console.log(`\n✓ produk.json benar: ${produk.length} produk${peringatan.length ? `, ${peringatan.length} peringatan di atas` : ""}.`);
}
