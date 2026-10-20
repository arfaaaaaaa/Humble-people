/* ===== MODAL (jendela pop-up) - dipakai fitur login, detail produk, checkout ===== */
const Modal = {
  el: null,
  buka(html, lebar = 480) {
    this.tutup();
    const l = document.createElement("div");
    l.className = "modal-latar";
    l.innerHTML = `<div class="modal" style="max-width:${lebar}px" role="dialog" aria-modal="true">
      <button type="button" class="modal-x" data-tutup aria-label="Tutup">✕</button>${html}</div>`;
    l.addEventListener("click", e => { if (e.target === l || e.target.closest("[data-tutup]")) Modal.tutup(); });
    document.body.appendChild(l);
    document.body.classList.add("kunci");
    requestAnimationFrame(() => l.classList.add("tampil"));
    this.el = l;
    return l.querySelector(".modal");
  },
  tutup() {
    if (!this.el) return;
    this.el.remove();
    this.el = null;
    document.body.classList.remove("kunci");
  }
};
document.addEventListener("keydown", e => { if (e.key === "Escape") Modal.tutup(); });
