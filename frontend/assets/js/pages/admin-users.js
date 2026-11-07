
/*
 * MANAJEMEN PENGGUNA — E-OFFICE BKSDA
 * Backend CodeIgniter 4
 *
 * GET    /api/users
 * PATCH  /api/users/{id}
 * DELETE /api/users/{id} (nonaktifkan akun)
 *
 * Tidak menggunakan mock data.
 */

"use strict";

const $ = (id) => document.getElementById(id);

const escapeHTML = (value) =>
  String(value ?? "").replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[char]);

const ROLE_LABELS = {
  admin: "Admin Sistem",
  kepala_seksi: "Kepala Seksi",
  staf: "Staf"
};

const state = {
  users: [],
  search: "",
  role: "all",
  status: "all",
  unit: "all",
  page: 1,
  perPage: 5,
  loading: false
};

/* ========== API ========== */

function api(method, path, body) {
  if (
    typeof EOfficeAPI === "undefined" ||
    !EOfficeAPI.config?.LIVE ||
    typeof EOfficeAPI.request !== "function"
  ) {
    throw new Error("API backend belum tersedia.");
  }

  return EOfficeAPI.request(method, path, body);
}

async function loadUsers() {
  const all = [];
  let currentPage = 1;
  let lastPage = 1;

  do {
    const result = await api(
      "GET",
      `/users?per_page=100&page=${currentPage}`
    );

    if (
      result?.status !== true ||
      !Array.isArray(result.data)
    ) {
      throw new Error("Format daftar pengguna tidak valid.");
    }

    all.push(...result.data);

    lastPage = Number(
      result.pagination?.last_page ?? 1
    );

    currentPage++;

    if (currentPage > 100) {
      throw new Error(
        "Jumlah halaman pengguna melebihi batas pemuatan."
      );
    }
  } while (currentPage <= lastPage);

  state.users = all.map(normalizeUser);
}

function normalizeUser(user) {
  return {
    id: Number(user.id),
    nama: user.name || "-",
    username: user.username || "-",
    email: user.email || "-",
    role: user.role,
    roleLabel: ROLE_LABELS[user.role] || user.role,
    status: Number(user.status),
    jabatan: user.jabatan || "-",
    resortId: user.resort_id,
    resortNama: user.resort_nama || "",
    resortKode: user.resort_kode || "",
    unit: user.resort_nama || "Tidak ditetapkan",
    createdAt: user.created_at || null
  };
}

/* ========== SESSION ========== */

function getSession() {
  try {
    return JSON.parse(
      sessionStorage.getItem("eoffice_session") ||
      localStorage.getItem("eoffice_session") ||
      "null"
    );
  } catch {
    return null;
  }
}

function checkAdmin() {
  const session = getSession();
  const token = localStorage.getItem("eoffice_token");

  if (!token || session?.role !== "admin") {
    location.replace("../../login.html");
    return false;
  }

  return true;
}

/* ========== STATUS ========== */

function showMessage(message, isError = false) {
  let banner = $("users-api-message");

  if (!banner) {
    banner = document.createElement("div");
    banner.id = "users-api-message";
    banner.setAttribute("role", "status");
    banner.style.padding = "12px 16px";
    banner.style.margin = "12px 0";
    banner.style.borderRadius = "8px";

    $("users-stats")?.before(banner);
  }

  banner.textContent = message;
  banner.style.display = "block";

  banner.style.background = isError
    ? "#fee2e2"
    : "#dcfce7";

  banner.style.color = isError
    ? "#991b1b"
    : "#166534";
}

/* ========== STATISTIK ========== */

function renderStats() {
  const users = state.users;
  const total = users.length;

  const aktif = users.filter(
    (user) => user.status === 1
  ).length;

  const nonaktif = total - aktif;

  const resorts = new Set(
    users
      .filter((user) => user.resortId)
      .map((user) => String(user.resortId))
  ).size;

  const stats = [
    ["Total Pengguna", total, "Akun terdaftar"],
    ["Pengguna Aktif", aktif, "Akun aktif"],
    ["Pengguna Nonaktif", nonaktif, "Akun nonaktif"],
    ["Resort Terhubung", resorts, "Resort dengan pengguna"]
  ];

  const grid = $("users-stats");
  if (!grid) return;

  grid.innerHTML = stats.map(([label, value, sub]) => `
    <article class="stat-card">
      <div>
        <p class="stat-label">${label}</p>

        <div class="stat-value-row">
          <span class="stat-value">
            ${Number(value).toLocaleString("id-ID")}
          </span>
        </div>

        <p class="stat-sub">${sub}</p>
      </div>
    </article>
  `).join("");
}

/* ========== FILTER ========== */

function setupFilters() {
  const roleSelect = $("filter-role");

  if (roleSelect) {
    roleSelect.innerHTML = `
      <option value="all">Semua Peran</option>
      <option value="admin">Admin Sistem</option>
      <option value="kepala_seksi">Kepala Seksi</option>
      <option value="staf">Staf</option>
    `;
  }

  const statusSelect = $("filter-status");

  if (statusSelect) {
    statusSelect.innerHTML = `
      <option value="all">Semua Status</option>
      <option value="1">Aktif</option>
      <option value="0">Nonaktif</option>
    `;
  }

  updateUnitFilter();

  $("filter-search")?.addEventListener("input", (event) => {
    state.search = event.target.value.trim().toLowerCase();
    state.page = 1;
    refresh();
  });

  roleSelect?.addEventListener("change", (event) => {
    state.role = event.target.value;
    state.page = 1;
    refresh();
  });

  statusSelect?.addEventListener("change", (event) => {
    state.status = event.target.value;
    state.page = 1;
    refresh();
  });

  $("filter-unit")?.addEventListener("change", (event) => {
    state.unit = event.target.value;
    state.page = 1;
    refresh();
  });

  $("filter-reset")?.addEventListener("click", () => {
    state.search = "";
    state.role = "all";
    state.status = "all";
    state.unit = "all";
    state.page = 1;

    for (const id of [
      "filter-search",
      "filter-role",
      "filter-status",
      "filter-unit"
    ]) {
      const el = $(id);
      if (el) {
        el.value = id === "filter-search" ? "" : "all";
      }
    }

    refresh();
  });

  $("per-page")?.addEventListener("change", (event) => {
    state.perPage = Number(event.target.value) || 5;
    state.page = 1;
    refresh();
  });
}

function updateUnitFilter() {
  const select = $("filter-unit");
  if (!select) return;

  const current = state.unit;

  const units = [...new Set(
    state.users.map((user) => user.unit)
  )].sort();

  select.innerHTML = `
    <option value="all">Semua Unit Kerja</option>
    ${units.map((unit) => `
      <option value="${escapeHTML(unit)}">
        ${escapeHTML(unit)}
      </option>
    `).join("")}
  `;

  if (units.includes(current)) {
    select.value = current;
  } else {
    state.unit = "all";
  }
}

function getFilteredUsers() {
  return state.users.filter((user) => {
    const text = [
      user.nama,
      user.username,
      user.email,
      user.jabatan,
      user.unit,
      user.resortKode
    ].join(" ").toLowerCase();

    return (
      (!state.search || text.includes(state.search)) &&
      (state.role === "all" || user.role === state.role) &&
      (
        state.status === "all" ||
        String(user.status) === state.status
      ) &&
      (
        state.unit === "all" ||
        user.unit === state.unit
      )
    );
  });
}

/* ========== TABEL ========== */

function renderTable(filtered) {
  const tbody = $("users-tbody");
  if (!tbody) return;

  const start = (state.page - 1) * state.perPage;
  const rows = filtered.slice(start, start + state.perPage);

  if (!rows.length) {
    tbody.innerHTML = `
      <tr class="empty-row">
        <td colspan="7">
          Tidak ada pengguna yang cocok.
        </td>
      </tr>
    `;
    return;
  }

  const session = getSession();

  tbody.innerHTML = rows.map((user) => {
    const isSelf =
      Number(session?.id) === user.id;

    const statusLabel =
      user.status === 1 ? "AKTIF" : "NONAKTIF";

    const initials = user.nama
      .split(/\s+/)
      .slice(0, 2)
      .map((word) => word.charAt(0))
      .join("")
      .toUpperCase();

    return `
      <tr>
        <td>
          <div class="cell-user">
            <span class="avatar avatar--blue">
              ${escapeHTML(initials)}
            </span>

            <div>
              <span class="cell-user-name">
                ${escapeHTML(user.nama)}
                ${isSelf ? '<span class="tag-me">SAYA</span>' : ""}
              </span>

              <span class="cell-user-nip">
                ${escapeHTML(user.jabatan)}
              </span>
            </div>
          </div>
        </td>

        <td class="mono">
          <span class="cell-username">
            ${escapeHTML(user.username)}
          </span>

          <span class="cell-email">
            ${escapeHTML(user.email)}
          </span>
        </td>

        <td>
          <span class="badge badge-role--staf">
            ${escapeHTML(user.roleLabel)}
          </span>
        </td>

        <td>
          <span class="cell-unit">
            ${escapeHTML(user.unit)}
          </span>

          <span class="cell-unit-sub">
            ${escapeHTML(user.resortKode)}
          </span>
        </td>

        <td>
          <span class="badge badge-status--${statusLabel}">
            ${statusLabel}
          </span>
        </td>

        <td>
          <span class="cell-login">
            Belum tersedia
          </span>
        </td>

        <td>
          <div class="cell-actions">
            <button
              type="button"
              class="action-btn"
              data-action="edit"
              data-id="${user.id}"
              title="Edit Pengguna"
            >
              Edit
            </button>

            <button
              type="button"
              class="action-btn"
              data-action="password"
              data-id="${user.id}"
              title="Reset Password"
            >
              Sandi
            </button>

            <button
              type="button"
              class="action-btn"
              data-action="toggle"
              data-id="${user.id}"
              ${isSelf ? "disabled" : ""}
              title="${user.status === 1 ? "Nonaktifkan" : "Aktifkan"}"
            >
              ${user.status === 1 ? "Nonaktifkan" : "Aktifkan"}
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join("");
}

/* ========== PAGINATION ========== */

function renderFooter(filtered) {
  const total = filtered.length;

  const pages = Math.max(
    1,
    Math.ceil(total / state.perPage)
  );

  state.page = Math.min(state.page, pages);

  const start =
    total === 0 ? 0 :
    (state.page - 1) * state.perPage + 1;

  const end = Math.min(
    state.page * state.perPage,
    total
  );

  const showing = $("showing-text");

  if (showing) {
    showing.textContent =
      `Menampilkan ${start}-${end} dari ${total} pengguna`;
  }

  const pagination = $("pagination");
  if (!pagination) return;

  const buttons = [];

  for (let page = 1; page <= pages; page++) {
    buttons.push(`
      <button
        type="button"
        class="page-btn ${
          page === state.page ? "is-active" : ""
        }"
        data-page="${page}"
      >
        ${page}
      </button>
    `);
  }

  pagination.innerHTML = buttons.join("");
}

function refresh() {
  const filtered = getFilteredUsers();

  const maxPage = Math.max(
    1,
    Math.ceil(filtered.length / state.perPage)
  );

  state.page = Math.min(state.page, maxPage);

  renderStats();
  renderTable(filtered);
  renderFooter(filtered);
}

/* ========== MODAL ========== */

function closeModal() {
  $("modal-backdrop")?.classList.remove("is-open");
}

function openModal(title, description, confirmText, action) {
  const backdrop = $("modal-backdrop");

  $("modal-title").textContent = title;
  $("modal-desc").textContent = description;

  const button = $("modal-confirm");
  button.textContent = confirmText;
  button.disabled = false;

  button.onclick = async () => {
    button.disabled = true;

    try {
      await action();
      closeModal();
    } catch (error) {
      console.error("Operasi pengguna gagal:", error.message);
      showMessage(error.message, true);
    } finally {
      button.disabled = false;
    }
  };

  backdrop.classList.add("is-open");
}

/* ========== CRUD ========== */

async function reloadUsers() {
  await loadUsers();
  updateUnitFilter();
  refresh();
}

async function toggleStatus(user) {
  const nextStatus = user.status === 1 ? 0 : 1;

  if (nextStatus === 0) {
    // DELETE pada backend adalah soft deactivate,
    // bukan penghapusan permanen.
    await api("DELETE", `/users/${user.id}`);
  } else {
    await api("PATCH", `/users/${user.id}`, {
      status: 1
    });
  }

  await reloadUsers();

  showMessage(
    `Akun ${user.username} berhasil ${
      nextStatus === 1 ? "diaktifkan" : "dinonaktifkan"
    }.`
  );
}

function openEditForm(user) {
  const title = $("modal-title");
  const desc = $("modal-desc");
  const backdrop = $("modal-backdrop");
  const confirm = $("modal-confirm");

  title.textContent = "Edit Pengguna";

  // Form lokal; tidak menyimpan sampai tombol
  // Simpan ditekan dan API memberi respons sukses.
  desc.innerHTML = `
    <form id="edit-user-form" style="text-align:left">
      <label for="edit-name">Nama</label>
      <input
        id="edit-name"
        name="name"
        required
        class="form-input"
        value="${escapeHTML(user.nama)}"
      />

      <label for="edit-email">Email</label>
      <input
        id="edit-email"
        name="email"
        type="email"
        class="form-input"
        value="${escapeHTML(
          user.email === "-" ? "" : user.email
        )}"
      />

      <label for="edit-jabatan">Jabatan</label>
      <input
        id="edit-jabatan"
        name="jabatan"
        class="form-input"
        value="${escapeHTML(
          user.jabatan === "-" ? "" : user.jabatan
        )}"
      />

      <label for="edit-role">Role</label>
      <select
        id="edit-role"
        name="role"
        class="form-input"
      >
        ${Object.entries(ROLE_LABELS).map(
          ([value, label]) => `
            <option
              value="${value}"
              ${user.role === value ? "selected" : ""}
            >
              ${label}
            </option>
          `
        ).join("")}
      </select>
    </form>
  `;

  confirm.textContent = "Simpan Perubahan";
  confirm.disabled = false;

  confirm.onclick = async () => {
    const form = $("edit-user-form");

    if (!form.reportValidity()) return;

    const payload = {
      name: form.elements.name.value.trim(),
      email: form.elements.email.value.trim(),
      jabatan: form.elements.jabatan.value.trim(),
      role: form.elements.role.value
    };

    confirm.disabled = true;

    try {
      await api(
        "PATCH",
        `/users/${user.id}`,
        payload
      );

      closeModal();
      await reloadUsers();

      showMessage("Data pengguna berhasil diperbarui.");
    } catch (error) {
      showMessage(error.message, true);
    } finally {
      confirm.disabled = false;
    }
  };

  backdrop.classList.add("is-open");
}

function openPasswordForm(user) {
  const backdrop = $("modal-backdrop");
  const confirm = $("modal-confirm");

  $("modal-title").textContent = "Reset Password";

  $("modal-desc").innerHTML = `
    <form id="reset-user-form" style="text-align:left">
      <p>
        Akun:
        <strong>${escapeHTML(user.username)}</strong>
      </p>

      <label for="reset-user-password">
        Password Baru
      </label>

      <input
        id="reset-user-password"
        name="password"
        type="password"
        minlength="8"
        required
        autocomplete="new-password"
        class="form-input"
      />
      <p>Minimal 8 karakter.</p>
    </form>
  `;

  confirm.textContent = "Reset Password";
  confirm.disabled = false;

  confirm.onclick = async () => {
    const form = $("reset-user-form");

    if (!form.reportValidity()) return;

    const password = form.elements.password.value;

    confirm.disabled = true;

    try {
      await api("PATCH", `/users/${user.id}`, {
        password
      });

      form.reset();
      closeModal();

      showMessage(
        `Password akun ${user.username} berhasil diubah.`
      );
    } catch (error) {
      showMessage(error.message, true);
    } finally {
      confirm.disabled = false;
    }
  };

  backdrop.classList.add("is-open");
}

/* ========== EVENTS ========== */

function setupActions() {
  $("users-tbody")?.addEventListener("click", (event) => {
    const button = event.target.closest(
      "button[data-action]"
    );

    if (!button) return;

    const user = state.users.find(
      (item) => item.id === Number(button.dataset.id)
    );

    if (!user) return;

    switch (button.dataset.action) {
      case "edit":
        openEditForm(user);
        break;

      case "password":
        openPasswordForm(user);
        break;

      case "toggle": {
        const action = user.status === 1
          ? "Nonaktifkan"
          : "Aktifkan";

        openModal(
          `${action} Akun`,
          `Yakin ingin ${action.toLowerCase()} akun ${user.username}?`,
          `Ya, ${action}`,
          () => toggleStatus(user)
        );

        break;
      }
    }
  });

  $("pagination")?.addEventListener("click", (event) => {
    const button = event.target.closest(
      "button[data-page]"
    );

    if (!button) return;

    state.page = Number(button.dataset.page);
    refresh();
  });

  $("modal-cancel")?.addEventListener("click", closeModal);

  $("modal-backdrop")?.addEventListener("click", (event) => {
    if (event.target === $("modal-backdrop")) {
      closeModal();
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      closeModal();
    }
  });
}

/* ========== NONAKTIFKAN MOCK UI ========== */

function hideMockPanels() {
  // Panel data mock belum terintegrasi.
  const panels = document.getElementById("panels-grid");

  if (panels) {
    panels.innerHTML = "";
    panels.hidden = true;
  }

  const verification = document.getElementById("verif-section");

  if (verification) {
    verification.hidden = true;
  }

  // Nonaktifkan HANYA tombol Unduh Rekap.
  // Jangan sampai tombol Impor CSV ikut dinonaktifkan.
  const headerButtons = document.querySelectorAll(
    ".page-header-actions button"
  );

  headerButtons.forEach((button) => {
    if (button.textContent.includes("Unduh Rekap")) {
      button.disabled = true;
      button.title = "Ekspor belum diintegrasikan";
    }
  });

  // Pastikan tombol Import bisa digunakan.
  const importButton = document.getElementById(
    "btn-import-csv"
  );

  if (importButton) {
    importButton.disabled = false;
    importButton.removeAttribute("disabled");
  }
}

/* ========== INIT ========== */

async function initUsersPage() {
  if (!checkAdmin()) return;

  hideMockPanels();
  setupActions();
  setupFilters();

  const tbody = $("users-tbody");

  if (tbody) {
    tbody.innerHTML = `
      <tr>
        <td colspan="7">Memuat pengguna dari backend...</td>
      </tr>
    `;
  }

  try {
    await loadUsers();
    updateUnitFilter();
    refresh();

    console.info(
      "Manajemen Pengguna berhasil dimuat:",
      state.users.length,
      "akun"
    );
  } catch (error) {
    console.error("Gagal memuat pengguna:", error.message);

    showMessage(
      "Gagal mengambil data pengguna: " + error.message,
      true
    );

    if (tbody) {
      tbody.innerHTML = `
        <tr>
          <td colspan="7">
            Gagal memuat data pengguna.
          </td>
        </tr>
      `;
    }
  }
}

if (document.readyState === "loading") {
  document.addEventListener(
    "DOMContentLoaded",
    initUsersPage,
    { once: true }
  );
} else {
  initUsersPage();
}
