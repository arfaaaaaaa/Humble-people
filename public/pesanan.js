/* ===== FITUR PESANAN: konfirmasi pesanan & riwayat "Pesanan Saya" ===== */
const Pesanan = (() => {
  const NAMA_STATUS = { menunggu: "Menunggu pembayaran", dibayar: "Dibayar", dikemas: "Dikemas", dikirim: "Dikirim", selesai: "Selesai", dibatalkan: "Dibatalkan" };
  const tgl = s => new Date(s.replace(" ", "T") + "Z").toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" });
  const barisItem = p => p.items.map((i, n) => `${n + 1}. ${i.nama} (${i.ukuran}) x${i.qty} = ${rupiah(i.harga * i.qty)}`).join("\n");
  const pesanWA = p => `Halo Humble People, saya sudah membuat pesanan ${p.kode}:\n\n${barisItem(p)}\n\nSubtotal: ${rupiah(p.subtotal)}\nOngkir (${p.kurir}): ${p.ongkir ? rupiah(p.ongkir) : "Gratis"}\nTotal: ${rupiah(p.total)}\nPembayaran: ${p.bayar}\n\nPenerima: ${p.penerima} (${p.hp})\nAlamat: ${p.alamat}\n\nMohon konfirmasi pembayarannya. Terima kasih!`;
  const kirimWA = p => window.open(`https://wa.me/${NOMOR_WA}?text=${encodeURIComponent(pesanWA(p))}`, "_blank");

  /* Muncul setelah pesanan berhasil disimpan di server */
  function sukses(p) {
    const m = Modal.buka(`
      <div class="sukses"><div class="sukses-ikon">✓</div>
        <h2 style="padding:0">Pesanan berhasil dibuat</h2>
        <p class="sub">Kode pesanan <strong>${esc(p.kode)}</strong>. Kirim detail pesanan ke WhatsApp kami untuk konfirmasi pembayaran.</p>
        <div class="kotak" style="text-align:left">
          ${p.items.map(i => `<div class="baris-item"><span>${esc(i.nama)} (${esc(i.ukuran)}) × ${i.qty}</span><strong>${rupiah(i.harga * i.qty)}</strong></div>`).join("")}
          <div class="baris-item"><span>Ongkos kirim</span><span>${p.ongkir ? rupiah(p.ongkir) : "Gratis"}</span></div>
          <div class="baris-total"><span>Total</span><strong>${rupiah(p.total)}</strong></div>
        </div>
        <button type="button" class="tombol btn-blok" id="s-wa">Kirim ke WhatsApp</button>
        <button type="button" class="btn-teks btn-blok" id="s-lihat">Lihat Pesanan Saya</button></div>`, 460);
    m.querySelector("#s-wa").onclick = () => kirimWA(p);
    m.querySelector("#s-lihat").onclick = buka;
  }

  async function buka() {
    const m = Modal.buka(`<h2>Pesanan Saya</h2><div id="p-isi"><p class="sub">Memuat pesanan...</p></div>`, 560);
    try {
      const { pesanan } = await Api.get("/api/orders");
      m.querySelector("#p-isi").innerHTML = pesanan.length ? pesanan.map((p, n) => `
        <div class="pesanan-item">
          <div class="pesanan-kepala"><strong>${esc(p.kode)}</strong><span class="status ${esc(p.status)}">${esc(NAMA_STATUS[p.status] || p.status)}</span></div>
          <p class="meta">${esc(tgl(p.dibuat))} · ${esc(p.bayar)} · ${esc(p.kurir)}</p>
          ${p.items.map(i => `<div class="baris-item"><span>${esc(i.nama)} (${esc(i.ukuran)}) × ${i.qty}</span><span>${rupiah(i.harga * i.qty)}</span></div>`).join("")}
          <div class="baris-total"><span>Total</span><strong>${rupiah(p.total)}</strong></div>
          <button type="button" class="btn-garis" data-wa="${n}">Hubungi via WhatsApp</button>
        </div>`).join("") : `<div class="kosong"><div class="kosong-ikon">📦</div><h3>Belum ada pesanan</h3><p>Pesananmu akan muncul di sini.</p></div>`;
      m.querySelectorAll("[data-wa]").forEach(b => b.onclick = () => kirimWA(pesanan[b.dataset.wa]));
    } catch (e) { m.querySelector("#p-isi").innerHTML = `<div class="galat">${esc(e.message)}</div>`; }
  }
  return { sukses, buka };
})();
