/* ============================================
   MODAL (KOMPONEN REUSABLE) — E-Office SKSDA
   openModal({ title, desc, html, confirmLabel,
   cancelLabel, danger, onConfirm }) + closeModal().
   Style disuntikkan sendiri (tanpa CSS halaman).
   ============================================ */

let backdropEl = null;
let confirmCb = null;

const MODAL_STYLE = `
  .app-modal-backdrop {
    position: fixed;
    inset: 0;
    z-index: 190;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 16px;
    background: rgba(15, 23, 42, 0.5);
    opacity: 0;
    pointer-events: none;
    transition: opacity 0.2s ease;
  }
  .app-modal-backdrop.is-open { opacity: 1; pointer-events: auto; }
  .app-modal-card {
    width: 100%;
    max-width: 440px;
    max-height: 85vh;
    overflow-y: auto;
    padding: 26px;
    background: #ffffff;
    border-radius: 16px;
    transform: scale(0.95);
    transition: transform 0.2s ease;
    font-family: "Segoe UI", system-ui, sans-serif;
  }
  .app-modal-backdrop.is-open .app-modal-card { transform: scale(1); }
  .app-modal-title {
    margin: 0;
    font-size: 16px;
    font-weight: 700;
    color: #111827;
  }
  .app-modal-desc {
    margin: 6px 0 0;
    font-size: 13px;
    line-height: 1.6;
    color: #6B7280;
  }
  .app-modal-body { margin-top: 14px; }
  .app-modal-actions {
    display: flex;
    justify-content: flex-end;
    gap: 10px;
    margin-top: 20px;
  }
  .app-modal-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding: 10px 16px;
    font: 600 13px "Segoe UI", system-ui, sans-serif;
    border-radius: 10px;
    border: 1px solid transparent;
    cursor: pointer;
    transition: background-color 0.15s ease, color 0.15s ease, border-color 0.15s ease;
  }
  .app-modal-btn--cancel {
    color: #374151;
    background: #ffffff;
    border-color: #E5E7EB;
  }
  .app-modal-btn--cancel:hover { border-color: #2563EB; color: #2563EB; }
  .app-modal-btn--confirm {
    color: #ffffff;
    background: #2563EB;
  }
  .app-modal-btn--confirm:hover { background: #1D4ED8; }
  .app-modal-btn--danger { background: #DC2626; }
  .app-modal-btn--danger:hover { background: #B91C1C; }
  /* List opsi di dalam modal (mis. daftar staf) */
  .app-modal-list { display: flex; flex-direction: column; gap: 8px; }
  .app-modal-option {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 11px 14px;
    font-size: 13px;
    color: #374151;
    background: #ffffff;
    border: 1px solid #E5E7EB;
    border-radius: 10px;
    cursor: pointer;
    transition: border-color 0.15s ease, background-color 0.15s ease;
  }
  .app-modal-option:hover { border-color: #2563EB; }
  .app-modal-option:has(input:checked) { border-color: #2563EB; background: #EFF6FF; }
  .app-modal-option input { accent-color: #2563EB; }
  .app-modal-option strong { display: block; font-size: 13px; color: #111827; }
  .app-modal-option span { display: block; font-size: 11.5px; color: #6B7280; }
`;

function ensureModal() {
  if (!document.getElementById("app-modal-style")) {
    const style = document.createElement("style");
    style.id = "app-modal-style";
    style.textContent = MODAL_STYLE;
    document.head.appendChild(style);
  }
  if (!backdropEl) {
    backdropEl = document.createElement("div");
    backdropEl.className = "app-modal-backdrop";
    backdropEl.setAttribute("role", "dialog");
    backdropEl.setAttribute("aria-modal", "true");
    backdropEl.innerHTML = `
      <div class="app-modal-card">
        <h2 class="app-modal-title"></h2>
        <p class="app-modal-desc"></p>
        <div class="app-modal-body"></div>
        <div class="app-modal-actions">
          <button type="button" class="app-modal-btn app-modal-btn--cancel" data-modal-cancel></button>
          <button type="button" class="app-modal-btn app-modal-btn--confirm" data-modal-confirm></button>
        </div>
      </div>`;
    document.body.appendChild(backdropEl);

    backdropEl.addEventListener("click", (event) => {
      if (event.target.closest("[data-modal-cancel]") || event.target === backdropEl) closeModal();
    });
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && backdropEl.classList.contains("is-open")) closeModal();
    });
  }
}

/**
 * Buka modal.
 * @param {Object} opts
 * @param {string} opts.title
 * @param {string} [opts.desc]
 * @param {string} [opts.html]   konten body kustom (mis. daftar opsi)
 * @param {string} [opts.confirmLabel="OK"]
 * @param {string} [opts.cancelLabel]  kosongkan untuk menyembunyikan tombol batal
 * @param {boolean} [opts.danger]
 * @param {Function} [opts.onConfirm]
 */
export function openModal(opts = {}) {
  ensureModal();

  confirmCb = opts.onConfirm || null;

  backdropEl.querySelector(".app-modal-title").textContent = opts.title || "";
  backdropEl.querySelector(".app-modal-desc").textContent = opts.desc || "";
  backdropEl.querySelector(".app-modal-desc").style.display = opts.desc ? "" : "none";

  const body = backdropEl.querySelector(".app-modal-body");
  body.innerHTML = opts.html || "";
  body.style.display = opts.html ? "" : "none";

  const cancelBtn = backdropEl.querySelector("[data-modal-cancel]");
  cancelBtn.textContent = opts.cancelLabel || "Batal";
  cancelBtn.style.display = opts.cancelLabel === null ? "none" : "";

  const confirmBtn = backdropEl.querySelector("[data-modal-confirm]");
  confirmBtn.textContent = opts.confirmLabel || "OK";
  confirmBtn.className = `app-modal-btn app-modal-btn--confirm${opts.danger ? " app-modal-btn--danger" : ""}`;

  confirmBtn.onclick = () => {
    let result;
    if (typeof confirmCb === "function") result = confirmCb();
    // onConfirm yang mengembalikan false menjaga modal tetap terbuka
    if (result !== false) closeModal();
  };

  backdropEl.classList.add("is-open");
}

export function closeModal() {
  if (backdropEl) backdropEl.classList.remove("is-open");
  confirmCb = null;
}
