/*
 * FORM SURAT KELUAR ADMIN
 * E-Office BKSDA - Integrasi API CodeIgniter 4
 *
 * POST /api/surat-keluar
 * POST /api/surat-keluar/{id}/file
 * GET  /api/resorts
 *
 * Catatan:
 * - Backend belum mempunyai workflow Draft/Kirim.
 * - Backend belum menyimpan isi editor dan penandatangan.
 * - Backend hanya menyimpan satu lampiran per surat.
 * - Upload menggunakan Idempotency-Key E14.
 */

"use strict";

(() => {
  const $ = (id) => document.getElementById(id);

  const MAX_FILE_SIZE = 10 * 1024 * 1024;

  const ALLOWED_EXTENSIONS = ["pdf", "docx", "jpg", "jpeg", "png"];

  const API_BASE =
    window.EOfficeAPI?.config?.BASE_URL || "http://127.0.0.1:8080/api";

  const form = $("form-surat");
  const fileInput = $("file-input");
  const sendButton = $("btn-send");
  const draftButton = $("btn-draft");
  const toast = $("toast");
  const toastText = $("toast-text");

  let selectedFile = null;
  let fileObjectURL = null;

  let isBusy = false;
  let createdSuratId = null;
  let uploadKey = null;
  let toastTimer = null;

  if (!form) {
    console.error("Form Surat Keluar tidak ditemukan.");
    return;
  }

  /* ===========================
     PESAN
  =========================== */

  function showToast(message) {
    if (!toast || !toastText) {
      console.info(message);
      return;
    }

    toastText.textContent = message;
    toast.classList.add("is-show");

    clearTimeout(toastTimer);

    toastTimer = setTimeout(() => {
      toast.classList.remove("is-show");
    }, 5000);
  }

  function showNotice(message, isError = false) {
    let notice = $("surat-api-notice");

    if (!notice) {
      notice = document.createElement("div");
      notice.id = "surat-api-notice";
      notice.setAttribute("role", "status");
      notice.setAttribute("aria-live", "polite");

      notice.style.marginBottom = "16px";
      notice.style.padding = "14px 16px";
      notice.style.borderRadius = "8px";
      notice.style.lineHeight = "1.6";

      form.prepend(notice);
    }

    notice.hidden = false;
    notice.textContent = message;

    notice.style.background = isError ? "#fef2f2" : "#eff6ff";

    notice.style.color = isError ? "#991b1b" : "#1d4ed8";

    notice.style.border = isError ? "1px solid #fecaca" : "1px solid #bfdbfe";
  }

  /* ===========================
     AUTHENTICATION & API
  =========================== */

  function getToken() {
    return localStorage.getItem("eoffice_token");
  }

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

  function requireAdmin() {
    const session = getSession();

    if (session?.role !== "admin") {
      throw new Error("Halaman ini hanya untuk Administrator.");
    }

    if (!getToken()) {
      throw new Error("Token login tidak ditemukan. Silakan login ulang.");
    }
  }

  async function request(method, endpoint, payload) {
    if (
      typeof EOfficeAPI === "undefined" ||
      !EOfficeAPI.config?.LIVE ||
      typeof EOfficeAPI.request !== "function"
    ) {
      throw new Error("API backend belum aktif.");
    }

    const response = await EOfficeAPI.request(method, endpoint, payload);

    if (response?.status !== true) {
      throw new Error(response?.message || "Permintaan ke backend gagal.");
    }

    return response;
  }

  /* ===========================
     NOMOR SURAT MANUAL
  =========================== */

  function setupNomorSurat() {
    const input = $("nomor-surat");

    if (!input) return;

    input.disabled = false;
    input.readOnly = false;

    input.required = true;

    input.placeholder = "Masukkan nomor surat resmi";

    const hint = input.closest(".form-field")?.querySelector(".form-hint");

    if (hint) {
      hint.textContent =
        "Wajib diisi. Backend saat ini belum " +
        "membuat nomor surat otomatis.";
    }
  }

  /* ===========================
     PILIH RESORT AKTIF
  =========================== */

  function createResortField() {
    if ($("resort-id")) return;

    const field = document.createElement("div");

    field.className = "form-field";

    const label = document.createElement("label");

    label.className = "form-label";
    label.htmlFor = "resort-id";
    label.textContent = "Resort / Unit Kerja *";

    const wrap = document.createElement("div");

    wrap.className = "input-wrap";

    const select = document.createElement("select");

    select.id = "resort-id";
    select.required = true;
    select.disabled = true;

    select.appendChild(new Option("Memuat resort aktif...", ""));

    wrap.appendChild(select);
    field.appendChild(label);
    field.appendChild(wrap);

    const hint = document.createElement("p");

    hint.className = "form-hint";
    hint.textContent = "Surat akan dicatat untuk resort yang dipilih.";

    field.appendChild(hint);

    const agendaField = $("nomor-agenda")?.closest(".form-field");

    if (agendaField) {
      agendaField.insertAdjacentElement("afterend", field);
    } else {
      form.prepend(field);
    }
  }

  async function loadResorts() {
    const select = $("resort-id");

    if (!select) {
      throw new Error("Pilihan resort tidak ditemukan.");
    }

    const response = await request("GET", "/resorts?status=1");

    if (!Array.isArray(response.data)) {
      throw new Error("Format data resort tidak valid.");
    }

    select.replaceChildren();

    select.appendChild(new Option("Pilih resort / unit kerja", ""));

    const activeResorts = response.data.filter(
      (resort) => Number(resort.status ?? 1) === 1,
    );

    for (const resort of activeResorts) {
      const option = new Option(
        `${resort.nama} (${resort.kode})`,
        String(resort.id),
      );

      select.appendChild(option);
    }

    select.disabled = false;

    if (activeResorts.length === 0) {
      throw new Error("Tidak ada resort aktif yang tersedia.");
    }

    console.info("Resort aktif dimuat:", activeResorts.length);
  }

  /* ===========================
     TANGGAL
  =========================== */

  function setupDate() {
    const input = $("tanggal-surat");

    if (!input) return;

    // HTML asli masih mempunyai tanggal
    // contoh statis dari Juli 2026.
    if (!input.value || input.value === "2026-07-09") {
      const now = new Date();

      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, "0");
      const day = String(now.getDate()).padStart(2, "0");

      input.value = `${year}-${month}-${day}`;
    }
  }

  /* ===========================
     FITUR YANG BELUM DIDUKUNG
  =========================== */

  function setupUnsupportedFeatures() {
    // Backend belum mempunyai workflow Draft.
    if (draftButton) {
      draftButton.disabled = true;

      draftButton.title = "Backend belum mendukung penyimpanan draft.";
    }

    // Backend belum mendukung penandatangan
    // maupun isi surat dari rich-text editor.
    const signer = $("penandatangan");

    if (signer) {
      signer.value = "";
      signer.disabled = true;
      signer.required = false;

      const hint = signer.closest(".form-field")?.querySelector(".form-hint");

      if (hint) {
        hint.textContent =
          "Penandatangan belum terintegrasi " + "dengan backend.";
      }
    }

    const jabatanText = $("jabatan-text");

    if (jabatanText) {
      jabatanText.textContent = "Penandatangan belum tersedia";
    }

    const editor = $("editor-body");

    if (editor) {
      editor.setAttribute("contenteditable", "false");

      editor.setAttribute("aria-disabled", "true");

      editor.dataset.placeholder =
        "Penyimpanan isi surat belum didukung backend.";

      const message = document.createElement("p");

      message.className = "form-hint";

      message.style.padding = "10px";
      message.style.color = "#92400e";

      message.textContent =
        "Isi surat dan penandatangan belum " +
        "disimpan oleh API saat ini. " +
        "Form ini hanya mencatat metadata " +
        "surat dan satu lampiran.";

      editor.closest(".editor")?.after(message);
    }

    // Toolbar editor tidak boleh menyiratkan
    // fitur penyimpanan yang sudah tersedia.
    document.querySelectorAll(".editor-btn").forEach((button) => {
      button.disabled = true;
    });

    // Informasi batas upload asli.
    const dropzone = $("dropzone");

    const subtitle = dropzone?.querySelector(".dropzone-sub");

    if (subtitle) {
      subtitle.textContent =
        "PDF, DOCX, JPG, JPEG, PNG — " +
        "maksimal 10 MB, satu lampiran per surat.";
    }

    if (sendButton) {
      sendButton.textContent = "Simpan Surat Keluar";
    }
  }

  /* ===========================
     VALIDASI FORM
  =========================== */

  function fieldValue(id) {
    return String($(id)?.value || "").trim();
  }

  function validateForm() {
    const fields = [
      ["nomor-surat", "Nomor surat"],
      ["nomor-agenda", "Nomor agenda"],
      ["tanggal-surat", "Tanggal surat"],
      ["tujuan-surat", "Tujuan surat"],
      ["perihal", "Perihal"],
      ["resort-id", "Resort"],
    ];

    for (const [id, label] of fields) {
      const element = $(id);

      if (!element || !fieldValue(id)) {
        showNotice(`${label} wajib diisi.`, true);

        element?.focus();
        return false;
      }
    }

    const date = fieldValue("tanggal-surat");

    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      showNotice("Tanggal harus menggunakan format YYYY-MM-DD.", true);

      $("tanggal-surat")?.focus();

      return false;
    }

    // Jangan sampai isi surat yang sudah diketik
    // sebelumnya hilang tanpa disadari.
    const editorContent = String($("editor-body")?.textContent || "").trim();

    if (editorContent) {
      showNotice(
        "Editor masih memiliki isi surat. " +
          "API belum menyimpan isi tersebut. " +
          "Salin isi surat ke dokumen terpisah " +
          "sebelum melanjutkan.",
        true,
      );

      return false;
    }

    return true;
  }

  function buildPayload() {
    return {
      no_agenda: fieldValue("nomor-agenda"),

      no_surat: fieldValue("nomor-surat"),

      tanggal: fieldValue("tanggal-surat"),

      tujuan: fieldValue("tujuan-surat"),

      perihal: fieldValue("perihal"),

      klasifikasi: fieldValue("klasifikasi") || "",

      resort_id: Number(fieldValue("resort-id")),
    };
  }

  /* ===========================
     FILE VALIDATION
  =========================== */

  function validateFile(file) {
    if (!(file instanceof File)) {
      throw new Error("File lampiran tidak valid.");
    }

    const ext = file.name.split(".").pop().toLowerCase();

    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      throw new Error("Lampiran harus PDF, DOCX, JPG, JPEG atau PNG.");
    }

    if (file.size === 0 || file.size > MAX_FILE_SIZE) {
      throw new Error(
        "Ukuran lampiran harus lebih dari 0 " + "dan maksimal 10 MB.",
      );
    }

    return true;
  }

  function formatSize(bytes) {
    return (bytes / (1024 * 1024)).toFixed(2) + " MB";
  }

  /* ===========================
     PREVIEW LOKAL
  =========================== */

  function revokeFileURL() {
    if (fileObjectURL) {
      URL.revokeObjectURL(fileObjectURL);

      fileObjectURL = null;
    }
  }

  function previewSelectedFile() {
    if (!selectedFile) return;

    const ext = selectedFile.name.split(".").pop().toLowerCase();

    if (ext === "docx") {
      showNotice(
        "DOCX tidak dapat dipreview langsung. " +
          "Lampiran tetap bisa diunggah.",
        false,
      );
      return;
    }

    revokeFileURL();

    fileObjectURL = URL.createObjectURL(selectedFile);

    const opened = window.open(fileObjectURL, "_blank", "noopener,noreferrer");

    if (!opened) {
      showToast("Izinkan pop-up untuk melihat preview.");
    }
  }

  /* ===========================
     RENDER FILE TERPILIH
  =========================== */

  function renderAttachment() {
    const list = $("attachment-list");
    const count = $("attachment-count");

    if (count) {
      count.textContent = selectedFile ? "1" : "0";
    }

    if (!list) return;

    list.replaceChildren();

    if (!selectedFile) {
      const empty = document.createElement("p");

      empty.className = "form-hint";
      empty.textContent = "Belum ada berkas terlampir.";

      list.appendChild(empty);
      return;
    }

    const wrapper = document.createElement("div");
    wrapper.className = "attachment-item attachment-item--muted";

    const info = document.createElement("div");
    info.className = "attachment-info";

    const name = document.createElement("span");
    name.className = "attachment-name";
    name.textContent = selectedFile.name;

    const meta = document.createElement("span");
    meta.className = "attachment-meta";

    meta.textContent =
      `${formatSize(selectedFile.size)} • ` +
      (createdSuratId ? "Siap diunggah / diulang" : "Menunggu surat disimpan");

    info.appendChild(name);
    info.appendChild(meta);

    const actions = document.createElement("div");
    actions.className = "attachment-actions";

    const previewButton = document.createElement("button");
    previewButton.type = "button";
    previewButton.className = "icon-btn";
    previewButton.textContent = "Lihat";

    previewButton.addEventListener("click", previewSelectedFile);

    const removeButton = document.createElement("button");
    removeButton.type = "button";
    removeButton.className = "icon-btn icon-btn--danger";
    removeButton.textContent = "Hapus";

    removeButton.disabled = isBusy || createdSuratId !== null;

    removeButton.addEventListener("click", () => {
      if (createdSuratId !== null) return;

      selectedFile = null;
      uploadKey = null;

      revokeFileURL();
      renderAttachment();
    });

    actions.appendChild(previewButton);
    actions.appendChild(removeButton);

    wrapper.appendChild(info);
    wrapper.appendChild(actions);

    list.appendChild(wrapper);
  }

  function chooseFile(file) {
    if (createdSuratId !== null) {
      showNotice(
        "Surat sudah dibuat. Untuk menghindari " +
          "duplikasi, file tidak dapat diganti " +
          "di sesi ini.",
        true,
      );
      return;
    }

    try {
      validateFile(file);

      selectedFile = file;

      // Satu key per percobaan unggah logis.
      // Tetap sama bila request upload diulang.
      uploadKey = crypto.randomUUID();

      renderAttachment();

      showNotice(
        `Berkas "${file.name}" siap diunggah ` + "setelah surat disimpan.",
      );
    } catch (error) {
      showNotice(error.message, true);
    }
  }

  function setupFileInput() {
    $("browse-btn")?.addEventListener("click", () => fileInput?.click());

    fileInput?.addEventListener("change", () => {
      const file = fileInput.files?.[0];

      if (file) {
        chooseFile(file);
      }

      fileInput.value = "";
    });

    const dropzone = $("dropzone");

    if (!dropzone) return;

    ["dragenter", "dragover"].forEach((eventName) => {
      dropzone.addEventListener(eventName, (event) => {
        let completed = false;
        event.preventDefault();
        dropzone.classList.add("is-over");
      });
    });

    ["dragleave", "drop"].forEach((eventName) => {
      dropzone.addEventListener(eventName, (event) => {
        event.preventDefault();
        dropzone.classList.remove("is-over");
      });
    });

    dropzone.addEventListener("drop", (event) => {
      const file = event.dataTransfer?.files?.[0];

      if (file) {
        chooseFile(file);
      }
    });

    dropzone.addEventListener("click", (event) => {
      if (
        event.target === dropzone ||
        event.target.closest(".dropzone-title, .dropzone-sub, .dropzone-icon")
      ) {
        fileInput?.click();
      }
    });
  }

  /* ===========================
     CREATE SURAT
  =========================== */

  async function createSurat() {
    const payload = buildPayload();

    const result = await request("POST", "/surat-keluar", payload);

    const id = Number(result.data?.id);

    if (!Number.isSafeInteger(id) || id < 1) {
      throw new Error(
        "Surat mungkin sudah dibuat, tetapi " +
          "server tidak mengembalikan ID valid. " +
          "Periksa daftar surat sebelum mencoba lagi.",
      );
    }

    return id;
  }

  /* ===========================
     UPLOAD FILE E14
  =========================== */

  async function uploadAttachment() {
    if (!selectedFile) return;

    if (!createdSuratId || !uploadKey) {
      throw new Error("ID surat atau Idempotency-Key belum tersedia.");
    }

    const token = getToken();

    if (!token) {
      throw new Error("Token login tidak ditemukan.");
    }

    const formData = new FormData();

    // Backend membaca getFile("file")
    formData.append("file", selectedFile, selectedFile.name);

    const controller = new AbortController();

    const timeout = setTimeout(() => controller.abort(), 60000);

    try {
      const response = await fetch(
        `${API_BASE}/surat-keluar/${createdSuratId}/file`,
        {
          method: "POST",

          headers: {
            Authorization: `Bearer ${token}`,

            "Idempotency-Key": uploadKey,

            Accept: "application/json",
          },

          body: formData,
          signal: controller.signal,
        },
      );

      let result;

      try {
        result = await response.json();
      } catch {
        throw new Error("Server tidak mengembalikan respons upload JSON.");
      }

      if (!response.ok || result?.status !== true) {
        throw new Error(
          result?.message || `Upload gagal (HTTP ${response.status}).`,
        );
      }

      return result.data;
    } catch (error) {
      if (error.name === "AbortError") {
        throw new Error(
          "Upload melewati batas waktu. " +
            "Periksa lampiran surat sebelum mengulang.",
        );
      }

      throw error;
    } finally {
      clearTimeout(timeout);
    }
  }

  /* ===========================
     SUBMIT
  =========================== */

  function setBusy(busy) {
    isBusy = busy;

    if (sendButton) {
      sendButton.disabled = busy;

      if (busy) {
        sendButton.textContent = "Memproses...";
      } else {
        sendButton.textContent =
          createdSuratId && selectedFile
            ? "Coba Unggah Lagi"
            : "Simpan Surat Keluar";
      }
    }

    if ($("browse-btn")) {
      $("browse-btn").disabled = busy || createdSuratId !== null;
    }

    renderAttachment();
  }

  async function handleSubmit(event) {
    event.preventDefault();
    let completed = false;

    if (isBusy) return;

    try {
      requireAdmin();

      // Setelah surat tercipta, jangan POST ulang.
      if (!createdSuratId && !validateForm()) {
        return;
      }

      setBusy(true);

      if (!createdSuratId) {
        showNotice("Menyimpan Surat Keluar...");

        createdSuratId = await createSurat();

        // Setelah surat berhasil dibuat, data
        // tidak boleh disimpan ulang melalui POST.
        form.querySelectorAll("input, select").forEach((element) => {
          if (element !== fileInput) {
            element.disabled = true;
          }
        });

        console.info("Surat Keluar tercatat:", createdSuratId);
      }

      if (selectedFile) {
        showNotice(
          `Surat ID ${createdSuratId} tersimpan. ` + "Mengunggah lampiran...",
        );

        await uploadAttachment();
        completed = true;
      }

      showNotice(
        `Berhasil! Surat Keluar ID ${createdSuratId} ` +
          (selectedFile
            ? "dan lampirannya sudah tersimpan."
            : "sudah tersimpan tanpa lampiran."),
      );

      showToast("Surat Keluar berhasil dicatat.");

      if (sendButton) {
        sendButton.disabled = true;
        sendButton.textContent = "Berhasil Disimpan";
      }

      console.info("Integrasi Surat Keluar berhasil:", {
        id: createdSuratId,
        lampiran: Boolean(selectedFile),
      });
    } catch (error) {
      console.error("Simpan Surat Keluar gagal:", error);

      if (createdSuratId) {
        showNotice(
          `Surat ID ${createdSuratId} sudah tercatat, ` +
            "tetapi upload belum terkonfirmasi. " +
            error.message +
            " Jangan membuat surat baru. " +
            "Periksa detail surat atau coba ulangi upload.",
          true,
        );
      } else {
        showNotice(
          error.message +
            " Jika request pembuatan sempat terkirim, " +
            "periksa daftar surat sebelum mengulangi.",
          true,
        );
      }
    } finally {
      setBusy(false);

      if (completed && sendButton) {
        sendButton.disabled = true;
        sendButton.textContent = "Berhasil Disimpan";
      }
    }
  }

  /* ===========================
     INIT
  =========================== */

  async function init() {
    try {
      requireAdmin();

      setupNomorSurat();
      setupDate();

      createResortField();
      setupUnsupportedFeatures();

      setupFileInput();

      form.addEventListener("submit", handleSubmit);

      $("btn-cancel")?.addEventListener("click", () => {
        window.location.href = "input-surat.html";
      });

      renderAttachment();

      await loadResorts();

      console.info("Form Surat Keluar Admin siap.");
    } catch (error) {
      console.error("Inisialisasi form gagal:", error);

      showNotice(error.message, true);

      if (sendButton) {
        sendButton.disabled = true;
      }
    }
  }

  window.addEventListener("pagehide", revokeFileURL);

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }
})();
