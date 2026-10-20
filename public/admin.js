/* ===== HALAMAN ADMIN: lihat pesanan & ubah status ===== */
const NAMA_STATUS = { menunggu: "Menunggu pembayaran", dibayar: "Dibayar", dikemas: "Dikemas", dikirim: "Dikirim", selesai: "Selesai", dibatalkan: "Dibatalkan" };
const $ = id => document.getElementById(id);
const esc = t => String(t ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const rupiah = n => "Rp" + n.toLocaleString("id-ID");
const tgl = s => new Date(s.replace(" ", "T") + "Z").toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" });
const nomorWA = hp => { const d = String(hp).replace(/\D/g, ""); return d.startsWith("0") ? "62" + d.slice(1) : d; };
const pilihanStatus = s => Object.entries(NAMA_STATUS).map(([k, v]) => `<option value="${k}" ${k === s ? "selected" : ""}>${v}</option>`).join("");

async function api(metode, url, data) {
  const r = await fetch(url, { method: metode, headers: data ? { "Content-Type": "application/json" } : {}, body: data ? JSON.stringify(data) : undefined, credentials: "same-origin" });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(j.galat || "Terjadi kesalahan.");
  return j;
}

let semua = [];
function tampil() {
  const f = $("filter").value, h = semua.filter(o => !f || o.status === f);
  $("isi").innerHTML = h.length ? h.map(o => `
    <div class="order">
      <div class="kepala"><div><strong>${esc(o.kode)}</strong> <span class="abu">· ${esc(tgl(o.dibuat))}</span></div>
        <select data-kode="${esc(o.kode)}">${pilihanStatus(o.status)}</select></div>
      <p><strong>${esc(o.penerima)}</strong> · ${esc(o.hp)} · <span class="abu">${esc(o.email)}</span></p>
      <p class="abu">${esc(o.alamat)}</p>
      <div style="margin:8px 0">${o.items.map(i => `<div class="baris"><span>${esc(i.nama)} (${esc(i.ukuran)}) × ${i.qty}</span><span>${rupiah(i.harga * i.qty)}</span></div>`).join("")}
        <div class="baris"><span>Ongkir (${esc(o.kurir)})</span><span>${o.ongkir ? rupiah(o.ongkir) : "Gratis"}</span></div>
        <div class="baris total"><span>Total · ${esc(o.bayar)}</span><span>${rupiah(o.total)}</span></div></div>
      <a class="wa" href="https://wa.me/${nomorWA(o.hp)}" target="_blank" rel="noopener">Chat pelanggan</a>
    </div>`).join("") : `<p class="info">Belum ada pesanan.</p>`;
}
async function muat() {
  try { semua = (await api("GET", "/api/admin/orders")).pesanan; tampil(); }
  catch (e) { $("isi").innerHTML = `<p class="info">${esc(e.message)}<br>Masuk dengan akun Google admin di <a href="/">halaman toko</a>, lalu muat ulang halaman ini.</p>`; }
}
$("filter").insertAdjacentHTML("beforeend", Object.entries(NAMA_STATUS).map(([k, v]) => `<option value="${k}">${v}</option>`).join(""));
$("filter").addEventListener("change", tampil);
$("muat").addEventListener("click", muat);
$("isi").addEventListener("change", async e => {
  const s = e.target.closest("select[data-kode]");
  if (!s) return;
  try { await api("PATCH", "/api/admin/orders/" + encodeURIComponent(s.dataset.kode), { status: s.value }); semua.find(o => o.kode === s.dataset.kode).status = s.value; }
  catch (err) { alert(err.message); muat(); }
});
muat();
