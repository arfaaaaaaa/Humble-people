/* ===== FITUR LOGIN, DAFTAR & DATA PENGIRIMAN (tersambung ke server) ===== */
const Auth = (() => {
  let user = null;      // data pengguna dari server (null = belum login)
  let setelah = null;   // aksi yang dijalankan setelah login & data lengkap

  const lengkap = u => !!(u && u.nama && u.hp && u.alamat && u.kota && u.provinsi && u.pos);
  const fld = (label, nama, tipe = "text", nilai = "", extra = "") =>
    `<label class="fld"><span>${label}</span><input name="${nama}" type="${tipe}" value="${esc(nilai)}" ${extra}></label>`;
  const galat = (m, pesan) => { const g = m.querySelector(".galat"); g.textContent = pesan; g.hidden = false; };

  function segarkan() {   // ikon profil: ikon orang jika belum login, huruf nama jika sudah
    const b = $("btn-profil");
    if (user) b.textContent = user.nama.trim().charAt(0).toUpperCase(); else b.innerHTML = IKON.user;
    b.classList.toggle("masuk", !!user);
    b.title = user ? user.nama : "Masuk / Daftar";
  }
  function selesai() {
    Modal.tutup();
    const f = setelah; setelah = null;
    if (f) f();
  }
  async function mulai() {   // cek apakah user masih login (cookie sesi dari server)
    try { user = (await Api.get("/api/me")).pengguna; } catch (e) { user = null; }
    segarkan();
  }
  function masuk(u, pesan) {
    user = u;
    segarkan();
    toast(pesan);
    lengkap(u) ? selesai() : profil(true);   // data belum lengkap -> minta diisi
  }

  function bukaLogin(tab = "masuk") {
    const daftar = tab === "daftar";
    const m = Modal.buka(`
      <h2>Selamat datang 👋</h2>
      <p class="sub">Masuk atau buat akun Humble People untuk belanja lebih mudah.</p>
      <div class="tab"><button type="button" data-tab="masuk">Masuk</button><button type="button" data-tab="daftar">Daftar</button></div>
      <form novalidate>
        <div class="galat" hidden></div>
        ${daftar ? fld("Nama lengkap", "nama", "text", "", "autocomplete=name") : ""}
        ${fld("Email", "email", "email", "", "autocomplete=email")}
        ${fld("Kata sandi", "sandi", "password", "", daftar ? 'autocomplete=new-password placeholder="Minimal 8 karakter"' : "autocomplete=current-password")}
        <button class="tombol btn-blok">${daftar ? "Buat Akun" : "Masuk"}</button>
      </form>
      <div class="atau"><span>atau</span></div><div id="g-tombol"></div>`, 440);
    m.querySelector(`[data-tab="${tab}"]`).classList.add("aktif");
    m.querySelectorAll("[data-tab]").forEach(b => b.onclick = () => bukaLogin(b.dataset.tab));
    GoogleLogin.render(m.querySelector("#g-tombol"));
    m.querySelector("form").onsubmit = async e => {
      e.preventDefault();
      const tombol = e.target.querySelector("button.tombol");
      tombol.disabled = true;
      try {
        const r = await Api.post(daftar ? "/api/register" : "/api/login", Object.fromEntries(new FormData(e.target)));
        masuk(r.pengguna, daftar ? "✓ Akun berhasil dibuat" : "✓ Berhasil masuk");
      } catch (err) { galat(m, err.message); tombol.disabled = false; }
    };
  }

  /* Dipanggil google.js: token dari Google dikirim ke server untuk diverifikasi */
  async function loginGoogle(credential) {
    try { masuk((await Api.post("/api/google", { credential })).pengguna, "✓ Berhasil masuk dengan Google"); }
    catch (err) { toast(err.message); }
  }

  function profil(baru) {
    if (!user) return bukaLogin();
    const u = user;
    const m = Modal.buka(`
      <h2>${baru ? "Lengkapi data pengirimanmu 📦" : "Data Diri & Alamat"}</h2>
      <p class="sub">${baru ? "Data ini dipakai untuk mengirim pesananmu dan bisa diubah kapan saja." : "Pastikan data benar supaya paketmu sampai dengan tepat."}</p>
      <form novalidate>
        <div class="galat" hidden></div>
        ${fld("Nama lengkap", "nama", "text", u.nama)}
        <div class="baris2">${fld("No. HP / WhatsApp", "hp", "tel", u.hp, 'placeholder="08xxxxxxxxxx"')}${fld("Email", "email", "email", u.email, "readonly")}</div>
        <label class="fld"><span>Alamat utama</span><textarea name="alamat" rows="3" placeholder="Jalan, nomor rumah, RT/RW, kelurahan, kecamatan">${esc(u.alamat)}</textarea></label>
        <div class="baris2">${fld("Kota / Kabupaten", "kota", "text", u.kota)}${fld("Provinsi", "provinsi", "text", u.provinsi)}</div>
        <div class="baris2">${fld("Kode pos", "pos", "text", u.pos, "inputmode=numeric maxlength=5")}${fld("Patokan (opsional)", "catatan", "text", u.catatan, 'placeholder="Dekat masjid, pagar hijau"')}</div>
        <button class="tombol btn-blok">Simpan Data</button>
      </form>`, 520);
    m.querySelector("form").onsubmit = async e => {
      e.preventDefault();
      const tombol = e.target.querySelector("button.tombol");
      tombol.disabled = true;
      try {
        user = (await Api.put("/api/profile", Object.fromEntries(new FormData(e.target)))).pengguna;
        segarkan();
        toast("✓ Data tersimpan");
        selesai();
      } catch (err) { galat(m, err.message); tombol.disabled = false; }
    };
  }

  function akun() {   // dipanggil saat ikon profil ditekan
    setelah = null;
    if (!user) return bukaLogin();
    const u = user;
    const m = Modal.buka(`
      <div class="profil-kepala"><div class="avatar">${esc(u.nama.trim().charAt(0).toUpperCase())}</div>
        <div><h2>${esc(u.nama)}</h2><p class="sub">${esc(u.email)}</p></div></div>
      <div class="kotak"><h4>📍 Alamat utama</h4>${lengkap(u)
        ? `<p>${esc(u.nama)} · ${esc(u.hp)}</p><p>${esc(u.alamat)}, ${esc(u.kota)}, ${esc(u.provinsi)} ${esc(u.pos)}</p>`
        : `<p class="meta">Belum diisi.</p>`}</div>
      <button type="button" class="tombol btn-blok" id="a-pesanan">Pesanan Saya</button>
      ${u.admin ? '<a class="btn-garis btn-blok" href="admin.html" target="_blank" rel="noopener" style="text-align:center;margin-top:8px">Kelola Pesanan (Admin)</a>' : ""}
      <button type="button" class="btn-garis btn-blok" id="a-ubah" style="margin-top:8px">${lengkap(u) ? "Ubah Data Diri" : "Lengkapi Data"}</button>
      <button type="button" class="btn-teks btn-blok" id="a-keluar">Keluar</button>`, 440);
    m.querySelector("#a-pesanan").onclick = () => Pesanan.buka();
    m.querySelector("#a-ubah").onclick = () => profil(false);
    m.querySelector("#a-keluar").onclick = async () => {
      try { await Api.post("/api/logout"); } catch (e) {}
      user = null; segarkan(); Modal.tutup(); toast("Kamu sudah keluar");
    };
  }

  /* Dipakai fitur belanja: pastikan user sudah login & data lengkap, baru jalankan aksi */
  function perlu(aksi) {
    setelah = aksi;
    if (!user) { toast("Masuk dulu untuk melanjutkan pembelian"); return bukaLogin(); }
    if (!lengkap(user)) { toast("Lengkapi data pengirimanmu dulu"); return profil(true); }
    selesai();
  }
  const bukaProfil = aksi => { setelah = aksi; profil(false); };
  const daftar = () => { setelah = null; bukaLogin("daftar"); };

  $("btn-profil").addEventListener("click", akun);
  mulai();
  return { pengguna: () => user, perlu, bukaProfil, loginGoogle, daftar };
})();
