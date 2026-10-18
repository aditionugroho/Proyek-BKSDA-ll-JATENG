/* ============================================
   TOAST (KOMPONEN REUSABLE) — E-Office SKSDA
   showToast(teks) — hijau, auto-hide 3 detik.
   Style disuntikkan sendiri (tanpa CSS halaman).
   ============================================ */

let toastEl = null;
let toastTimer = null;

const TOAST_STYLE = `
  .app-toast {
    position: fixed;
    right: 24px;
    bottom: 24px;
    z-index: 200;
    display: flex;
    align-items: center;
    gap: 10px;
    max-width: 420px;
    padding: 14px 18px;
    font: 600 13px "Segoe UI", system-ui, sans-serif;
    color: #ffffff;
    background: #16A34A;
    border-radius: 10px;
    box-shadow: 0 8px 24px rgba(22, 163, 74, 0.35);
    opacity: 0;
    transform: translateY(16px);
    pointer-events: none;
    transition: opacity 0.25s ease, transform 0.25s ease;
  }
  .app-toast.is-show { opacity: 1; transform: translateY(0); }
  .app-toast svg { width: 16px; height: 16px; flex-shrink: 0; }
`;

function ensureToast() {
  if (!document.getElementById("app-toast-style")) {
    const style = document.createElement("style");
    style.id = "app-toast-style";
    style.textContent = TOAST_STYLE;
    document.head.appendChild(style);
  }
  if (!toastEl) {
    toastEl = document.createElement("div");
    toastEl.className = "app-toast";
    toastEl.setAttribute("role", "status");
    toastEl.setAttribute("aria-live", "polite");
    toastEl.innerHTML =
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg><span></span>';
    document.body.appendChild(toastEl);
  }
}

export function showToast(text) {
  ensureToast();
  toastEl.querySelector("span").textContent = text;
  toastEl.classList.add("is-show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toastEl.classList.remove("is-show"), 3000);
}
