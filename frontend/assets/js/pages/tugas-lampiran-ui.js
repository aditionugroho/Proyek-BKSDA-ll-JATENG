/*
 * Lampiran Tugas - E-Office SKSDA
 * Backend: GET/POST /api/tugas/{id}/lampiran
 *          GET /api/tugas/{id}/lampiran/{fileId}/download
 *
 * Tidak mengubah fungsi JSON request() pada api.js.
 */

const isStaff = location.pathname.includes("/pegawai/");
const params = new URLSearchParams(location.search);
const taskText = params.get("id");
const taskId = Number(taskText);

const MAX_FILE = 10 * 1024 * 1024;
const allowed = new Set(["pdf", "jpg", "jpeg", "png"]);

function byId(id) {
  return document.getElementById(id);
}

function create(tag, text) {
  const node = document.createElement(tag);
  if (text !== undefined) node.textContent = String(text);
  return node;
}

function notify(message) {
  const node = byId("lampiran-info");

  if (node) {
    node.textContent = message;
  } else {
    alert(message);
  }
}

function fileSize(bytes) {
  const value = Number(bytes || 0);

  return value >= 1024 * 1024
    ? (value / (1024 * 1024)).toFixed(2) + " MB"
    : Math.ceil(value / 1024) + " KB";
}

function apiBase() {
  const base = window.EOfficeAPI?.config?.BASE_URL;

  if (!base || typeof base !== "string") {
    throw new Error("Alamat API belum tersedia.");
  }

  return base.replace(/\/+$/, "");
}

function token() {
  const value = (sessionStorage.getItem("eoffice_token") || localStorage.getItem("eoffice_token"));

  if (!value) {
    throw new Error("Sesi login tidak ditemukan. Login ulang.");
  }

  return value;
}

function endpoint(suffix = "") {
  return (
    apiBase() +
    "/tugas/" +
    encodeURIComponent(taskId) +
    "/lampiran" +
    suffix
  );
}

async function checkResponse(res, defaultMessage) {
  if (res.ok) return res;

  const data = await res.json().catch(() => ({}));
  const error = new Error(data.message || defaultMessage);
  error.status = res.status;
  throw error;
}

async function listFiles() {
  const res = await fetch(endpoint(), {
    method: "GET",
    headers: {
      Accept: "application/json",
      Authorization: "Bearer " + token()
    },
    cache: "no-store"
  });

  await checkResponse(res, "Gagal mengambil lampiran.");

  const data = await res.json();

  if (data?.status !== true || !Array.isArray(data.data)) {
    throw new Error("Format daftar lampiran tidak valid.");
  }

  return data.data;
}

async function uploadFile(file) {
  const name = String(file.name || "");
  const ext = name.split(".").pop().toLowerCase();

  if (!allowed.has(ext)) {
    throw new Error(
      "Format tidak didukung. Gunakan PDF, JPG, atau PNG."
    );
  }

  if (!file.size || file.size > MAX_FILE) {
    throw new Error("Ukuran file harus antara 1 byte dan 10 MB.");
  }

  const form = new FormData();
  form.append("file", file, file.name);

  const res = await fetch(endpoint(), {
    method: "POST",
    headers: {
      Accept: "application/json",
      Authorization: "Bearer " + token()
    },
    body: form
  });

  // Jangan mengatur Content-Type:
  // browser harus membuat multipart boundary sendiri.
  await checkResponse(res, "Gagal mengunggah lampiran.");

  const data = await res.json();

  if (data?.status !== true) {
    throw new Error(data?.message || "Upload gagal.");
  }

  return data;
}

async function downloadFile(item) {
  const id = Number(item.id);

  if (!Number.isSafeInteger(id) || id <= 0) {
    throw new Error("ID lampiran tidak valid.");
  }

  const res = await fetch(
    endpoint("/" + encodeURIComponent(id) + "/download"),
    {
      method: "GET",
      headers: {
        Accept: "application/octet-stream, */*",
        Authorization: "Bearer " + token()
      }
    }
  );

  await checkResponse(res, "Gagal mengunduh lampiran.");

  const blob = await res.blob();

  if (!blob.size) {
    throw new Error("File unduhan kosong.");
  }

  const filename = String(
    item.nama_asli || "lampiran-tugas"
  ).replace(/[\\/\r\n]/g, "_");

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = filename;
  link.style.display = "none";

  document.body.appendChild(link);
  link.click();
  link.remove();

  setTimeout(() => URL.revokeObjectURL(url), 30000);
}

function renderFile(item) {
  const row = create("div");

  row.style.cssText = [
    "display:flex",
    "align-items:center",
    "justify-content:space-between",
    "gap:12px",
    "padding:12px 0",
    "border-bottom:1px solid #E5E7EB"
  ].join(";");

  const detail = create("div");

  detail.style.cssText =
    "min-width:0;flex:1;overflow-wrap:anywhere";

  const name = create(
    "div",
    item.nama_asli || "Tanpa nama"
  );

  name.style.cssText =
    "font-size:13px;font-weight:700;color:#1F2937";

  const meta = create(
    "small",
    [
      fileSize(item.ukuran),
      item.pengunggah || "Pengguna"
    ].join(" ? ")
  );

  meta.style.cssText =
    "display:block;color:#64748B;margin-top:4px";

  detail.append(name, meta);

  const button = create("button", "Unduh");

  button.type = "button";
  button.style.cssText = [
    "padding:8px 12px",
    "border:1px solid #93C5FD",
    "border-radius:8px",
    "background:#EFF6FF",
    "color:#1D4ED8",
    "font-size:12px",
    "font-weight:700",
    "cursor:pointer"
  ].join(";");

  button.addEventListener("click", async () => {
    button.disabled = true;
    button.textContent = "Mengunduh...";

    try {
      await downloadFile(item);
      notify("File berhasil diunduh.");
    } catch (error) {
      console.error("Download lampiran:", error);
      notify(error.message || "Unduhan gagal.");
    } finally {
      button.disabled = false;
      button.textContent = "Unduh";
    }
  });

  row.append(detail, button);

  return row;
}

let listContainer = null;

async function refreshList() {
  if (!listContainer) return;

  listContainer.replaceChildren();
  listContainer.appendChild(create("p", "Memuat lampiran..."));

  try {
    const items = await listFiles();

    listContainer.replaceChildren();

    if (!items.length) {
      listContainer.appendChild(
        create("p", "Belum ada lampiran tugas.")
      );
      return;
    }

    items.forEach((item) => {
      listContainer.appendChild(renderFile(item));
    });

    notify(items.length + " lampiran tersedia.");
  } catch (error) {
    console.error("Daftar lampiran:", error);

    listContainer.replaceChildren();

    listContainer.appendChild(
      create(
        "p",
        "Gagal memuat lampiran: " +
          (error.message || "Kesalahan server")
      )
    );
  }
}

function setupStaff() {
  listContainer = byId("pgdt-files");

  const uploadLink = byId("pgdt-upload-link");
  const input = byId("pgdt-file-input");

  if (!listContainer || !uploadLink || !input) {
    throw new Error("Komponen lampiran Pegawai tidak lengkap.");
  }

  uploadLink.disabled = false;
  uploadLink.style.display = "";
  uploadLink.textContent = "? Upload File";

  // Handler lama di file detail-tugas-pg.js sudah
  // tidak dipasang lagi setelah integrasi API LIVE.
  input.disabled = false;
  input.accept = ".pdf,.jpg,.jpeg,.png";

  uploadLink.addEventListener("click", () => {
    input.click();
  });

  input.addEventListener("change", async () => {
    const file = input.files?.[0];

    if (!file) return;

    uploadLink.disabled = true;
    uploadLink.textContent = "Mengunggah...";

    try {
      await uploadFile(file);
      notify("Lampiran berhasil disimpan di server.");
      await refreshList();
    } catch (error) {
      console.error("Upload lampiran:", error);
      notify(error.message || "Upload gagal.");
    } finally {
      input.value = "";
      uploadLink.disabled = false;
      uploadLink.textContent = "? Upload File";
    }
  });
}

function setupKS() {
  listContainer = byId("dt-lampiran");

  if (!listContainer) {
    throw new Error(
      "Komponen lampiran Kepala Seksi tidak ditemukan."
    );
  }
}

async function init() {
  if (
    !taskText ||
    !Number.isSafeInteger(taskId) ||
    taskId <= 0
  ) {
    return;
  }

  if (!window.EOfficeAPI?.config?.LIVE) return;

  try {
    if (isStaff) setupStaff();
    else setupKS();

    const info = create("p", "");
    info.id = "lampiran-info";
    info.style.cssText =
      "font-size:12px;color:#64748B;margin-top:10px";

    listContainer.parentElement.appendChild(info);

    await refreshList();
  } catch (error) {
    console.error("Inisialisasi lampiran:", error);
  }
}

init();
