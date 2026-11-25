import { createDraftSession, downloadDraftAttachment, validateSuratAttachment } from "./surat-keluar-draft.js";

"use strict";

(() => {
  const $ = (id) => document.getElementById(id);

  const draftSession = createDraftSession();

  const form = $("form-surat");
  const fileInput = $("file-input");
  const sendButton = $("btn-send");
  const draftButton = $("btn-draft");
  const toast = $("toast");
  const toastText = $("toast-text");

  let selectedFile = null;
  let fileObjectURL = null;

  let isBusy = false;
  let ready = false;
  let submitted = false;
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
    return (sessionStorage.getItem("eoffice_token") || localStorage.getItem("eoffice_token"));
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

  /* ===========================
     FITUR YANG BELUM DIDUKUNG
  =========================== */

  function setupPlainTextForm() {
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
      sendButton.textContent = "Ajukan Surat Keluar";
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
      ["tanggal-surat", "Tanggal surat"],
      ["tujuan-surat", "Tujuan surat"],
      ["perihal", "Perihal"],
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

    if (!$("editor-body").innerText.trim()) {
      showNotice("Isi surat wajib diisi.", true);
      $("editor-body").focus();
      return false;
    }

    return true;
  }

  function buildPayload() {
    return {
      no_surat: fieldValue("nomor-surat"),

      tanggal: fieldValue("tanggal-surat"),

      tujuan: fieldValue("tujuan-surat"),

      perihal: fieldValue("perihal"),

      klasifikasi: fieldValue("klasifikasi") || "",

      resort_id: Number(fieldValue("resort-id")),
      isi: $("editor-body").innerText.trim(),
    };
  }

  /* ===========================
     FILE VALIDATION
  =========================== */

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
      count.textContent = selectedFile || draftSession.draft?.file_path ? "1" : "0";
    }

    if (!list) return;

    list.replaceChildren();

    if (!selectedFile) {
      const empty = document.createElement("p");

      empty.className = "form-hint";
      empty.textContent = "Belum ada berkas terlampir.";
      if (draftSession.draft?.file_path) {
        const download = document.createElement("button");
        download.type = "button";
        download.textContent = "Unduh lampiran tersimpan";
        download.addEventListener("click", async () => {
          try {
            await downloadDraftAttachment(draftSession.draft.id);
          } catch (error) {
            showNotice(error.message, true);
          }
        });
        list.append(download);
        return;
      }

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

    meta.textContent = formatSize(selectedFile.size);

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

    removeButton.disabled = isBusy;

    removeButton.addEventListener("click", () => {
      if (isBusy) return;

      ocrController?.abort();
      ocrController = null;
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

  let ocrController = null;

  async function extractSurat(file) {
    ocrController?.abort();
    ocrController = null;

    const extension = file.name.split(".").pop().toLowerCase();

    if (!["pdf", "jpg", "jpeg", "png"].includes(extension)) {
      return;
    }

    const token = getToken();

    if (!token) {
      showNotice("Token login tidak ditemukan.", true);
      return;
    }

    const controller = new AbortController();
    ocrController = controller;

    const timeout = setTimeout(
      () => controller.abort(),
      90000
    );

    const formData = new FormData();
    formData.append("file", file, file.name);

    try {
      showNotice(
        "Sedang membaca dokumen dengan OCR. Mohon tunggu..."
      );

      const response = await fetch(
        `${EOfficeAPI.config.BASE_URL}/surat-keluar/extract`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
          body: formData,
          signal: controller.signal,
        }
      );

      const result = await response.json();

      if (
        selectedFile !== file ||
        ocrController !== controller ||
        isBusy
      ) {
        return;
      }

      if (!response.ok || result?.status !== true) {
        throw new Error(
          result?.message || "Ekstraksi OCR gagal."
        );
      }

      const data = result.data || {};
      const fields = data.fields || {};
      let filled = 0;

      const values = {
        "nomor-surat":
          fields.no_surat || data.nomor_surat_saran,
        "tanggal-surat": fields.tanggal,
        "tujuan-surat": fields.tujuan,
        "perihal": fields.perihal,
        "klasifikasi": fields.klasifikasi,
      };

      for (const [id, value] of Object.entries(values)) {
        const element = $(id);

        if (!element || !value) continue;

        if (String(element.value || "").trim()) continue;

        const text = String(value).trim();

        if (id === "tanggal-surat" &&
            !/^\d{4}-\d{2}-\d{2}$/.test(text)) {
          continue;
        }

        if (element.tagName === "SELECT") {
          const option = Array.from(element.options).find(
            (item) =>
              item.value.toLowerCase() === text.toLowerCase() ||
              item.textContent.trim().toLowerCase() === text.toLowerCase()
          );

          if (!option) continue;

          element.value = option.value;
        } else {
          element.value = text;
        }

        if (element.value) {
          element.dispatchEvent(
            new Event("input", { bubbles: true })
          );

          element.dispatchEvent(
            new Event("change", { bubbles: true })
          );

          filled++;
        }
      }

      const editor = $("editor-body");

      if (
        editor &&
        fields.isi &&
        !String(editor.textContent || "").trim()
      ) {
        editor.textContent = String(fields.isi);
        filled++;
      }

      const warnings = Array.isArray(data.peringatan)
        ? data.peringatan.filter(Boolean).join(" ")
        : "";

      showNotice(
        (
          filled > 0
            ? `OCR selesai. ${filled} kolom berhasil diisi. `
            : "OCR selesai, tetapi tidak ada kolom kosong yang berhasil diisi. "
        ) +
        "Periksa kembali informasi surat sebelum menyimpan. " +
        warnings
      );

      showToast("Pembacaan dokumen selesai.");

    } catch (error) {
      if (
        selectedFile !== file ||
        ocrController !== controller ||
        isBusy
      ) {
        return;
      }

      showNotice(
        error.name === "AbortError"
          ? "OCR melewati batas waktu. Silakan isi form secara manual."
          : "OCR gagal: " + error.message +
            " Lampiran tetap dapat digunakan.",
        true
      );

    } finally {
      clearTimeout(timeout);

      if (ocrController === controller) {
        ocrController = null;
      }
    }
  }


  function chooseFile(file) {
    if (isBusy || !ready) return;

    try {
      validateSuratAttachment(file);

      selectedFile = file;

      // Satu key per percobaan unggah logis.
      // Tetap sama bila request upload diulang.
      uploadKey = crypto.randomUUID();

      renderAttachment();

      showNotice(
        `Berkas "${file.name}" siap diunggah ` + "setelah surat disimpan.",
      );
      void extractSurat(file);
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

  function setBusy(busy) {
    isBusy = busy;
    sendButton.disabled = busy || !ready || submitted;
    draftButton.disabled = sendButton.disabled;
    $("browse-btn").disabled = sendButton.disabled;
    sendButton.textContent = busy ? "Memproses..." : "Ajukan Surat Keluar";
    renderAttachment();
  }

  async function loadDraftFromUrl() {
    const draft = await draftSession.load();
    if (!draft) return;
    for (const [field, value] of Object.entries({
      "nomor-agenda": draft.no_agenda,
      "nomor-surat": draft.no_surat,
      "tanggal-surat": draft.tanggal,
      "tujuan-surat": draft.tujuan,
      perihal: draft.perihal,
      klasifikasi: draft.klasifikasi,
      "resort-id": draft.resort_id,
    })) {
      $(field).value = value ?? "";
    }

    $("resort-id").disabled = true;
    $("editor-body").textContent = draft.isi ?? "";
  }

  async function save(submit) {
    if (isBusy || !ready || submitted) return;
    if (ocrController) {
      showNotice("OCR masih berjalan. Tunggu hingga selesai.", true);
      return;
    }
    if (submit && !validateForm()) return;
    if (!fieldValue("resort-id") && !draftSession.draft) {
      showNotice("Pilih resort / unit kerja.", true);
      return;
    }
    setBusy(true);
    try {
      const payload = buildPayload();
      if (draftSession.draft) delete payload.resort_id;
      const record = await draftSession.save(payload, selectedFile, uploadKey, submit);
      selectedFile = null;
      showNotice(submit ? "Surat berhasil diajukan." : "Draft berhasil disimpan.");
      showToast(submit ? "Surat berhasil diajukan." : "Draft berhasil disimpan.");
      if (submit) {
        submitted = true;
        location.href = `detail-surat-admin.html?id=${record.id}&jenis=KELUAR`;
      }
    } catch (error) {
      showNotice(error.message, true);
    } finally {
      if (draftSession.draft) {
        $("nomor-agenda").value = draftSession.draft.no_agenda ?? "";
        $("resort-id").disabled = true;
      }
      setBusy(false);
    }
  }

  /* ===========================
     INIT
  =========================== */

  async function init() {
    try {
      requireAdmin();

      setupNomorSurat();
      $("nomor-agenda").readOnly = true;
      $("nomor-agenda").placeholder = "Ditetapkan saat surat disimpan";
      $("tanggal-surat").value = "";

      createResortField();
      setupPlainTextForm();

      setupFileInput();

      form.addEventListener("submit", (event) => {
        event.preventDefault();
        save(true);
      });
      draftButton.addEventListener("click", () => save(false));

      $("btn-cancel")?.addEventListener("click", () => {
        window.location.href = "input-surat.html";
      });

      renderAttachment();

      setBusy(true);
      await loadResorts();
      await loadDraftFromUrl();
      ready = true;
      setBusy(false);

      console.info("Form Surat Keluar Admin siap.");
    } catch (error) {
      console.error("Inisialisasi form gagal:", error);

      showNotice(error.message, true);

      if (sendButton) {
        sendButton.disabled = true;
      }
    }
  }

  window.addEventListener("pagehide", () => {
    ocrController?.abort();
    revokeFileURL();
  });

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }
})();
