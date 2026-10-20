/* ===== PENGHUBUNG KE SERVER ===== */
const Api = {
  async panggil(metode, url, data) {
    let r;
    try {
      r = await fetch(url, { method: metode, headers: data ? { "Content-Type": "application/json" } : {}, body: data ? JSON.stringify(data) : undefined, credentials: "same-origin" });
    } catch (e) { throw new Error("Tidak bisa terhubung ke server. Coba lagi."); }
    let j = {};
    try { j = await r.json(); } catch (e) {}
    if (!r.ok) throw new Error(j.galat || "Terjadi kesalahan, coba lagi.");
    return j;
  },
  get: u => Api.panggil("GET", u),
  post: (u, d) => Api.panggil("POST", u, d || {}),
  put: (u, d) => Api.panggil("PUT", u, d)
};
