/* ============================================
   NAVBAR — dropdown login role
   Dipakai di index.html (landing page)
   ============================================ */

const loginWrapper = document.getElementById("login-wrapper");
const loginToggle = document.getElementById("login-toggle");
const loginDropdown = document.getElementById("login-dropdown");
const loginChevron = document.getElementById("login-chevron");

let dropdownOpen = false;

function setDropdown(open) {
  dropdownOpen = open;
  loginDropdown.classList.toggle("opacity-0", !open);
  loginDropdown.classList.toggle("scale-95", !open);
  loginDropdown.classList.toggle("pointer-events-none", !open);
  loginToggle.setAttribute("aria-expanded", String(open));
  loginChevron.style.transform = open ? "rotate(180deg)" : "";
  loginChevron.style.transition = "transform 0.2s ease";
}

if (loginWrapper && loginToggle && loginDropdown) {
  loginToggle.addEventListener("click", (event) => {
    event.stopPropagation();
    setDropdown(!dropdownOpen);
  });

  document.addEventListener("click", (event) => {
    if (dropdownOpen && !loginWrapper.contains(event.target)) setDropdown(false);
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && dropdownOpen) setDropdown(false);
  });
}
