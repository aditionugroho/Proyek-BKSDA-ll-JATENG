
/*
==================================================
IMPORT PEGAWAI CSV - E-OFFICE BKSDA
Frontend HTML + JavaScript
Backend CodeIgniter 4 + MySQL

Endpoint:
POST /api/users/import

Database mengikuti konfigurasi backend.
==================================================
*/

(() => {
  "use strict";

  const API_URL =
  EOfficeAPI.config.BASE_URL + "/users/import";

  const MAX_FILE_SIZE = 2 * 1024 * 1024;

  const REQUIRED_HEADERS = [
    "name",
    "username",
    "email",
    "no_whatsapp",
    "role",
    "jabatan",
    "resort_kode"
  ];

  let isUploading = false;

  const $ = (id) => document.getElementById(id);

  /* ==========================================
     SESSION & AUTHENTICATION
  ========================================== */

  function getSession() {
    try {
      const raw =
        sessionStorage.getItem("eoffice_session") ||
        localStorage.getItem("eoffice_session");

      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  function getToken() {
    return localStorage.getItem("eoffice_token");
  }

  function validateAdmin() {
    const session = getSession();

    if (!session || session.role !== "admin") {
      throw new Error(
        "Hanya Administrator yang boleh mengimpor pegawai."
      );
    }

    if (!getToken()) {
      throw new Error(
        "Token login tidak ditemukan. Silakan login ulang."
      );
    }
  }

  /* ==========================================
     BUAT TOMBOL DAN INPUT OTOMATIS
  ========================================== */

  function createImportUI() {
    const headerActions = document.querySelector(
      ".page-header-actions"
    );

    if (!headerActions) {
      console.error(
        "Import CSV: .page-header-actions tidak ditemukan."
      );
      return false;
    }

    // Buat tombol kalau belum ada.
    if (!$("btn-import-csv")) {
      const button = document.createElement("button");

      button.type = "button";
      button.id = "btn-import-csv";
      button.className = "btn btn--outline";
      button.textContent = "Impor Pegawai CSV";

      headerActions.prepend(button);
    }

    // Buat input file jika belum ada.
    if (!$("input-import-csv")) {
      const input = document.createElement("input");

      input.type = "file";
      input.id = "input-import-csv";
      input.accept = ".csv,text/csv";
      input.hidden = true;

      headerActions.appendChild(input);
    }

    // Buat panel hasil jika belum ada.
    if (!$("import-result-panel")) {
      const panel = document.createElement("section");

      panel.id = "import-result-panel";
      panel.className = "table-card";
      panel.hidden = true;

      panel.style.marginTop = "20px";
      panel.style.padding = "20px";

      panel.innerHTML = `
        <h2 style="margin-bottom:14px">
          Hasil Impor Pegawai
        </h2>

        <p
          id="import-result-summary"
          role="status"
          aria-live="polite"
        ></p>

        <div
          id="import-result-errors"
          style="margin-top:12px"
        ></div>
      `;

      const main = document.querySelector("main");

      if (main) {
        main.appendChild(panel);
      } else {
        document.body.appendChild(panel);
      }
    }

    return Boolean(
      $("btn-import-csv") &&
      $("input-import-csv") &&
      $("import-result-panel")
    );
  }

  /* ==========================================
     TAMPILKAN HASIL
  ========================================== */

  function showResult(message, type = "success") {
    const panel = $("import-result-panel");
    const summary = $("import-result-summary");

    if (!panel || !summary) return;

    panel.hidden = false;
    panel.style.display = "block";

    summary.textContent = message;

    const colors = {
      success: "#166534",
      error: "#b91c1c",
      info: "#1d4ed8"
    };

    summary.style.color =
      colors[type] || colors.info;
  }

  function clearErrors() {
    $("import-result-errors")?.replaceChildren();
  }

  function showErrors(errors) {
    const container = $("import-result-errors");

    if (!container) return;

    container.replaceChildren();

    if (!Array.isArray(errors) || !errors.length) {
      return;
    }

    const title = document.createElement("h3");
    title.textContent = "Rincian Data Gagal";
    title.style.marginBottom = "10px";

    container.appendChild(title);

    const list = document.createElement("ul");
    list.style.paddingLeft = "20px";

    errors.forEach((error) => {
      const item = document.createElement("li");

      const row =
        error.baris ??
        error.row ??
        error.line ??
        "?";

      const reason =
        error.alasan ??
        error.message ??
        "Data tidak valid.";

      item.textContent =
        `Baris ${row}: ${reason}`;

      item.style.marginBottom = "6px";

      list.appendChild(item);
    });

    container.appendChild(list);
  }

  /* ==========================================
     VALIDASI FILE CSV
  ========================================== */

  async function validateCSV(file) {
    if (!file) {
      throw new Error(
        "Silakan pilih file CSV."
      );
    }

    if (!file.name.toLowerCase().endsWith(".csv")) {
      throw new Error(
        "Format file harus .csv."
      );
    }

    if (file.size === 0) {
      throw new Error(
        "File CSV tidak boleh kosong."
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      throw new Error(
        "Ukuran file maksimal 2 MB."
      );
    }

    const content = await file.text();

    const lines = content
      .replace(/^\uFEFF/, "")
      .split(/\r?\n/)
      .filter((line) => line.trim() !== "");

    if (lines.length < 2) {
      throw new Error(
        "CSV harus berisi header dan minimal satu pegawai."
      );
    }

    const actualHeaders = lines[0]
      .split(",")
      .map((header) => header.trim());

    const validHeaders =
      actualHeaders.length === REQUIRED_HEADERS.length &&
      actualHeaders.every(
        (header, index) =>
          header === REQUIRED_HEADERS[index]
      );

    if (!validHeaders) {
      throw new Error(
        "Header CSV tidak sesuai.\n" +
        "Gunakan:\n" +
        REQUIRED_HEADERS.join(",")
      );
    }

    const dataCount = lines.length - 1;

    if (dataCount > 200) {
      throw new Error(
        "Maksimal 200 pegawai dalam satu file CSV."
      );
    }

    return dataCount;
  }

  /* ==========================================
     KIRIM CSV KE CODEIGNITER
  ========================================== */

  async function uploadCSV(file) {
    const token = getToken();

    if (!token) {
      throw new Error("Token login tidak tersedia.");
    }

    const formData = new FormData();

    formData.append("file", file, file.name);

    const controller = new AbortController();

    const timeout = setTimeout(() => {
      controller.abort();
    }, 60000);

    try {
      const response = await fetch(API_URL, {
        method: "POST",

        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json"
        },

        body: formData,

        signal: controller.signal
      });

      let result;

      try {
        result = await response.json();
      } catch {
        throw new Error(
          "Server tidak mengembalikan respons JSON."
        );
      }

      if (!response.ok || result.status !== true) {
        const error = new Error(
          result.message ||
          `Upload gagal. HTTP ${response.status}`
        );

        error.status = response.status;
        error.details = result.data?.errors || [];

        throw error;
      }

      return result.data;

    } catch (error) {
      if (error.name === "AbortError") {
        throw new Error(
          "Waktu upload habis. Periksa daftar pengguna " +
          "sebelum mengulangi impor."
        );
      }

      throw error;

    } finally {
      clearTimeout(timeout);
    }
  }

  /* ==========================================
     PROSES IMPOR
  ========================================== */

  async function processImport(file) {
    if (isUploading) return;

    const button = $("btn-import-csv");
    const input = $("input-import-csv");

    isUploading = true;

    if (button) {
      button.disabled = true;
      button.textContent = "Mengimpor...";
    }

    clearErrors();

    try {
      validateAdmin();

      const dataCount = await validateCSV(file);

      showResult(
        `Memproses ${dataCount} pegawai...`,
        "info"
      );

      const result = await uploadCSV(file);

      const total = Number(result?.total ?? 0);
      const success = Number(result?.berhasil ?? 0);
      const failed = Number(result?.gagal ?? 0);

      showResult(
        `Impor selesai. Total: ${total} | ` +
        `Berhasil: ${success} | ` +
        `Gagal: ${failed}`,
        failed > 0 ? "error" : "success"
      );

      showErrors(result?.errors || []);

      if (success > 0) {
        const info = document.createElement("p");

        info.textContent =
          "Akun baru berhasil disimpan. " +
          "Password awal perlu ditetapkan oleh Admin " +
          "melalui fitur Reset Password.";

        info.style.marginTop = "12px";
        info.style.color = "#475569";

        $("import-result-errors")?.prepend(info);
      }

      console.info(
        "Impor CSV selesai:",
        {
          total,
          berhasil: success,
          gagal: failed
        }
      );

    } catch (error) {
      console.error(
        "Gagal mengimpor CSV:",
        error.message
      );

      showResult(
        error.message || "Impor CSV gagal.",
        "error"
      );

      showErrors(error.details || []);

    } finally {
      isUploading = false;

      if (button) {
        button.disabled = false;
        button.textContent = "Impor Pegawai CSV";
      }

      if (input) {
        input.value = "";
      }
    }
  }

  /* ==========================================
     PASANG EVENT TOMBOL
  ========================================== */

  function initImportCSV() {
    const ready = createImportUI();

    if (!ready) return;

    const button = $("btn-import-csv");
    const input = $("input-import-csv");

    if (button.dataset.importBound === "true") {
      return;
    }

    button.dataset.importBound = "true";

    button.addEventListener("click", () => {
      if (isUploading) return;

      console.info(
        "Tombol Impor CSV diklik."
      );

      input.click();
    });

    input.addEventListener("change", () => {
      const file = input.files?.[0];

      if (!file) return;

      console.info(
        "File CSV dipilih:",
        file.name
      );

      processImport(file);
    });

    console.info(
      "Fitur Impor CSV BKSDA siap digunakan."
    );
  }

  /* ==========================================
     INISIALISASI
  ========================================== */

  if (document.readyState === "loading") {
    document.addEventListener(
      "DOMContentLoaded",
      initImportCSV,
      { once: true }
    );
  } else {
    initImportCSV();
  }
})();
