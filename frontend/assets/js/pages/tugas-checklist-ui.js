/*
 * CHECKLIST TUGAS - E-Office SKSDA
 * Komponen tambahan pada halaman Detail Tugas.
 * Tidak mengubah progress keseluruhan.
 */

const isStaff = location.pathname.includes("/pegawai/");
const idText = new URLSearchParams(location.search).get("id");
const taskId = Number(idText);

const apiBase = String(
  window.EOfficeAPI?.config?.BASE_URL || ""
).replace(/\/+$/, "");

let statusTugas = "";
let checklistItems = [];

function node(tag, text) {
  const el = document.createElement(tag);
  if (text !== undefined) el.textContent = String(text);
  return el;
}

function token() {
  return localStorage.getItem("eoffice_token") || "";
}

function endpoint(suffix = "") {
  return apiBase + "/tugas/" + taskId + "/checklist" + suffix;
}

async function request(method, suffix = "", body) {
  const res = await fetch(endpoint(suffix), {
    method,
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      Authorization: "Bearer " + token()
    },
    body: body === undefined
      ? undefined
      : JSON.stringify(body),
    cache: "no-store"
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok || data.status !== true) {
    throw new Error(
      data.message || "Permintaan checklist gagal."
    );
  }

  return data;
}

async function getTaskStatus() {
  const data = await EOfficeAPI.getTugasDetail(taskId);

  if (data?.status !== true || !data.data) {
    throw new Error("Gagal membaca status tugas.");
  }

  statusTugas = String(data.data.status || "");
}

let card;
let list;
let counter;
let feedback;
let input;
let addButton;

function showFeedback(message, error = false) {
  if (!feedback) return;
  feedback.textContent = message;
  feedback.style.color = error ? "#DC2626" : "#475569";
}

function render() {
  list.replaceChildren();

  const total = checklistItems.length;
  const done = checklistItems.filter(
    (item) => Number(item.selesai) === 1
  ).length;

  counter.textContent = `${done}/${total} selesai`;

  if (total === 0) {
    list.appendChild(
      node("p", "Belum ada checklist pekerjaan.")
    );
  }

  const locked = [
    "Menunggu Review",
    "Selesai"
  ].includes(statusTugas);

  for (const item of checklistItems) {
    const row = node("label");

    row.style.cssText = [
      "display:flex",
      "align-items:center",
      "gap:10px",
      "padding:10px 0",
      "border-bottom:1px solid #E5E7EB"
    ].join(";");

    const check = node("input");
    check.type = "checkbox";
    check.checked = Number(item.selesai) === 1;
    check.disabled = !isStaff || locked;

    const title = node("span", item.teks);
    title.style.cssText =
      "font-size:13px;color:#334155;overflow-wrap:anywhere";

    if (check.checked) {
      title.style.textDecoration = "line-through";
    }

    check.addEventListener("change", async () => {
      check.disabled = true;

      try {
        await request(
          "PATCH",
          "/" + encodeURIComponent(item.id),
          { selesai: check.checked }
        );

        await refresh();
        showFeedback("Checklist berhasil disimpan.");
      } catch (error) {
        check.checked = !check.checked;
        showFeedback(error.message, true);
        await refresh();
      }
    });

    row.append(check, title);
    list.appendChild(row);
  }

  if (input && addButton) {
    input.disabled = statusTugas === "Selesai";
    addButton.disabled = statusTugas === "Selesai";
  }
}

async function refresh() {
  await getTaskStatus();
  const response = await request("GET");

  if (!Array.isArray(response.data)) {
    throw new Error("Format checklist tidak valid.");
  }

  checklistItems = response.data;
  render();
}

function buildUI() {
  card = node("section");
  card.id = "tugas-checklist-live";

  card.style.cssText = [
    "background:#fff",
    "border:1px solid #E5E7EB",
    "border-radius:12px",
    "padding:20px",
    "margin:20px 0",
    "width:100%",
    "box-sizing:border-box"
  ].join(";");

  const heading = node("h2", "Checklist Pekerjaan");

  heading.style.cssText =
    "font-size:17px;font-weight:700;margin:0 0 8px";

  counter = node("p", "Memuat checklist...");
  counter.style.cssText =
    "font-size:12px;color:#64748B;margin:0 0 14px";

  list = node("div");
  feedback = node("p", "");

  feedback.style.cssText =
    "font-size:12px;margin:12px 0 0";

  card.append(heading, counter, list);

  if (!isStaff) {
    const form = node("div");

    form.style.cssText =
      "display:flex;gap:8px;margin-top:16px;flex-wrap:wrap";

    input = node("input");
    input.type = "text";
    input.maxLength = 500;
    input.placeholder = "Contoh: Menyusun laporan hasil kegiatan";

    input.style.cssText = [
      "flex:1",
      "min-width:220px",
      "padding:10px",
      "border:1px solid #CBD5E1",
      "border-radius:8px",
      "font:inherit"
    ].join(";");

    addButton = node("button", "Tambah Checklist");
    addButton.type = "button";

    addButton.style.cssText = [
      "padding:10px 14px",
      "background:#2563EB",
      "color:white",
      "border:0",
      "border-radius:8px",
      "cursor:pointer"
    ].join(";");

    addButton.addEventListener("click", async () => {
      const teks = input.value.trim();

      if (teks.length < 3 || teks.length > 500) {
        showFeedback(
          "Isi checklist antara 3?500 karakter.",
          true
        );
        return;
      }

      addButton.disabled = true;

      try {
        await request("POST", "", { teks });
        input.value = "";
        await refresh();
        showFeedback("Checklist berhasil ditambahkan.");
      } catch (error) {
        showFeedback(error.message, true);
      } finally {
        addButton.disabled = statusTugas === "Selesai";
      }
    });

    form.append(input, addButton);
    card.append(form);
  }

  card.append(feedback);

  const main = document.querySelector(".main-content");

  if (!main) {
    throw new Error("Kontainer halaman tidak ditemukan.");
  }

  // Gunakan lokasi checklist bawaan halaman.
  // Progress keseluruhan tetap ditampilkan
  // dan tidak dihitung ulang dari checklist.
  const slotId = isStaff
    ? "pgdt-subtasks"
    : "dt-checklist";

  const slot = document.getElementById(slotId);

  if (slot) {
    card.style.background = "transparent";
    card.style.border = "none";
    card.style.borderRadius = "0";
    card.style.padding = "8px 0";
    card.style.margin = "8px 0";

    // Hilangkan teks placeholder checklist lama,
    // lalu letakkan checklist LIVE pada posisi yang sama.
    slot.replaceChildren(card);

    // Jika script detail tugas yang lebih lama
    // merender placeholder setelah modul checklist,
    // pertahankan tampilan checklist LIVE.
    const observer = new MutationObserver(() => {
      if (!slot.contains(card)) {
        slot.replaceChildren(card);
      }
    });

    observer.observe(slot, {
      childList: true
    });
  } else {
    // Fallback: jangan sampai checklist hilang
    // apabila struktur HTML berbeda.
    main.appendChild(card);
    console.warn(
      "Slot checklist bawaan tidak ditemukan:",
      slotId
    );
  }
}

async function init() {
  if (
    !idText ||
    !Number.isSafeInteger(taskId) ||
    taskId <= 0 ||
    !apiBase ||
    !window.EOfficeAPI?.config?.LIVE
  ) {
    return;
  }

  buildUI();

  try {
    await refresh();
  } catch (error) {
    console.error("Checklist tugas:", error);
    showFeedback(error.message, true);
  }
}

init();
