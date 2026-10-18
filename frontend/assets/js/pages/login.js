/* ============================================
   HALAMAN LOGIN — E-Office SKSDA
   Role dari URL, toggle password, validasi
   inline, submit + redirect dashboard
   ============================================ */

const form = document.getElementById("login-form");
const userIdInput = document.getElementById("user-id");
const passwordInput = document.getElementById("password");
const roleSelect = document.getElementById("role");
const rememberInput = document.getElementById("remember");
const loginBtn = document.getElementById("login-btn");
const loginBtnText = document.getElementById("login-btn-text");
const toggleBtn = document.getElementById("toggle-password");
const iconEye = document.getElementById("icon-eye");
const iconEyeOff = document.getElementById("icon-eye-off");

/* Role otomatis terisi dari URL (?role=...) — dikirim dari dropdown landing page */
const role = new URLSearchParams(window.location.search).get("role");
if (role && Array.from(roleSelect.options).some((opt) => opt.value === role)) {
  roleSelect.value = role;
}

/* Toggle tampil/sembunyikan kata sandi */
toggleBtn.addEventListener("click", () => {
  const isHidden = passwordInput.type === "password";
  passwordInput.type = isHidden ? "text" : "password";
  iconEye.style.display = isHidden ? "none" : "block";
  iconEyeOff.style.display = isHidden ? "block" : "none";
  toggleBtn.setAttribute("aria-label", isHidden ? "Sembunyikan kata sandi" : "Tampilkan kata sandi");
});

/* Validasi inline */
function setFieldError(input, show) {
  input.classList.toggle("input-error", show);
  document.getElementById(input.id + "-error").classList.toggle("hidden", !show);
}
[userIdInput, passwordInput].forEach((input) => {
  input.addEventListener("input", () => setFieldError(input, false));
});

/* Submit: validasi → state diproses → redirect dashboard sesuai role */
const ROLE_DASHBOARD = {
  admin: "pages/admin/dashboard.html",
  "kepala-seksi": "pages/kepala-seksi/dashboard.html",
  pegawai: "pages/pegawai/dashboard.html"
};

form.addEventListener("submit", (event) => {
  event.preventDefault();

  const isUserIdValid = userIdInput.value.trim() !== "";
  const isPasswordValid = passwordInput.value !== "";
  setFieldError(userIdInput, !isUserIdValid);
  setFieldError(passwordInput, !isPasswordValid);
  if (!isUserIdValid || !isPasswordValid) return;

  loginBtn.disabled = true;
  loginBtnText.textContent = I18N[getLang()]["login.processing"];

  const session = { userId: userIdInput.value.trim(), role: roleSelect.value, loginAt: new Date().toISOString() };
  const storage = rememberInput.checked ? window.localStorage : window.sessionStorage;
  storage.setItem("eoffice_session", JSON.stringify(session));

  window.location.href = ROLE_DASHBOARD[roleSelect.value] || ROLE_DASHBOARD.admin;
});
