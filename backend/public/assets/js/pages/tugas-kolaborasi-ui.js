
/*
 * Kolaborasi Tugas SKSDA
 * Komentar dan aktivitas disimpan oleh API.
 * Digunakan halaman Pegawai dan Kepala Seksi.
 */

const $ = (id) => document.getElementById(id);
const isStaff = location.pathname.includes("/pegawai/");

const taskIdText = new URLSearchParams(
  location.search
).get("id");

const taskId = Number(taskIdText);

function formatTime(value) {
  if (!value) return "";

  const d = new Date(
    String(value).replace(" ", "T")
  );

  return Number.isNaN(d.getTime())
    ? String(value)
    : d.toLocaleString("id-ID");
}

function create(tag, text, className) {
  const node = document.createElement(tag);

  if (text !== undefined) {
    node.textContent = String(text);
  }

  if (className) node.className = className;

  return node;
}

function message(text) {
  const box = create("div", text);

  box.style.cssText = [
    "padding:10px 12px",
    "margin:10px 0",
    "border:1px solid #DBEAFE",
    "border-radius:8px",
    "background:#EFF6FF",
    "color:#1E40AF",
    "font-size:12px"
  ].join(";");

  return box;
}

function clear(node) {
  if (node) node.replaceChildren();
}

function getArray(response) {
  if (
    response?.status !== true ||
    !Array.isArray(response.data)
  ) {
    throw new Error(
      response?.message || "Respons API tidak valid."
    );
  }

  return response.data;
}

function commentCard(item) {
  const card = create("div");

  card.style.cssText = [
    "border-bottom:1px solid #E5E7EB",
    "padding:12px 0"
  ].join(";");

  const header = create(
    "div",
    item.nama || "Pengguna"
  );

  header.style.cssText =
    "font-weight:700;font-size:13px;color:#111827";

  const date = create(
    "div",
    formatTime(item.created_at)
  );

  date.style.cssText =
    "font-size:11px;color:#64748B;margin-top:3px";

  const body = create("p", item.isi || "");

  body.style.cssText =
    "font-size:13px;white-space:pre-wrap;" +
    "overflow-wrap:anywhere;margin:9px 0 0";

  card.append(header, date, body);

  return card;
}

function activityCard(item) {
  const card = create("div");

  card.style.cssText = [
    "padding:10px 0",
    "border-bottom:1px solid #E5E7EB"
  ].join(";");

  const actor = create(
    "strong",
    item.nama || "Pengguna"
  );

  const action = create(
    "p",
    item.keterangan || item.jenis || "Aktivitas"
  );

  action.style.cssText =
    "font-size:12px;margin:5px 0";

  const date = create(
    "small",
    formatTime(item.created_at)
  );

  date.style.color = "#64748B";

  card.append(actor, action, date);

  return card;
}

async function loadComments(target) {
  clear(target);

  try {
    const response =
      await EOfficeAPI.getKomentarTugas(taskId);

    const items = getArray(response);

    if (!items.length) {
      target.appendChild(
        message("Belum ada diskusi pada tugas ini.")
      );
      return;
    }

    items.forEach((item) => {
      target.appendChild(commentCard(item));
    });
  } catch (error) {
    console.error("Komentar tugas:", error);

    target.appendChild(
      message(
        "Gagal mengambil diskusi: " +
        (error.message || "Kesalahan API")
      )
    );
  }
}

async function loadActivities(target) {
  clear(target);

  try {
    const response =
      await EOfficeAPI.getAktivitasTugas(taskId);

    const items = getArray(response);

    if (!items.length) {
      target.appendChild(
        message(
          "Belum ada aktivitas yang tercatat sejak " +
          "fitur riwayat diaktifkan."
        )
      );
      return;
    }

    items.forEach((item) => {
      target.appendChild(activityCard(item));
    });
  } catch (error) {
    console.error("Aktivitas tugas:", error);

    target.appendChild(
      message(
        "Gagal mengambil aktivitas: " +
        (error.message || "Kesalahan API")
      )
    );
  }
}

function connectForm(input, button, comments, activities) {
  if (!input || !button) return;

  input.disabled = false;
  button.disabled = false;
  input.placeholder = "Tulis komentar tugas...";

  button.addEventListener("click", async () => {
    const isi = input.value.trim();

    if (!isi) {
      alert("Isi komentar terlebih dahulu.");
      return;
    }

    if (isi.length > 2000) {
      alert("Komentar maksimal 2000 karakter.");
      return;
    }

    button.disabled = true;
    button.textContent = "Mengirim...";

    try {
      const result =
        await EOfficeAPI.kirimKomentarTugas(
          taskId,
          isi
        );

      if (result?.status !== true) {
        throw new Error(
          result?.message || "Komentar gagal disimpan."
        );
      }

      input.value = "";

      await Promise.all([
        loadComments(comments),
        loadActivities(activities)
      ]);
    } catch (error) {
      console.error("Kirim komentar:", error);
      alert(
        error.message || "Gagal mengirim komentar."
      );
    } finally {
      button.disabled = false;
      button.textContent = "Kirim Komentar";
    }
  });
}

function setupStaff() {
  const comments = $("pgdt-chat");
  const activities = $("pgdt-timeline");

  if (!comments || !activities) return;

  connectForm(
    $("pgdt-chat-text"),
    $("pgdt-chat-send"),
    comments,
    activities
  );

  return { comments, activities };
}

function setupKS() {
  const activities = $("dt-aktivitas");
  const main = document.querySelector(".main-content");

  if (!activities || !main) return;

  const card = create("section");
  card.className = "pgdt-card";

  card.style.cssText = [
    "background:white",
    "border:1px solid #E5E7EB",
    "border-radius:12px",
    "padding:18px",
    "margin:20px 0"
  ].join(";");

  const title = create("h2", "Diskusi Tugas");

  title.style.cssText =
    "font-size:15px;font-weight:700;margin-bottom:12px";

  const comments = create("div");
  comments.id = "ktg-komentar-list";

  const input = create("textarea");
  input.placeholder = "Tulis balasan Kepala Seksi...";
  input.maxLength = 2000;
  input.rows = 3;

  input.style.cssText = [
    "width:100%",
    "box-sizing:border-box",
    "padding:12px",
    "border:1px solid #CBD5E1",
    "border-radius:8px",
    "margin-top:14px",
    "font:inherit"
  ].join(";");

  const button = create(
    "button",
    "Kirim Komentar"
  );

  button.type = "button";

  button.style.cssText = [
    "margin-top:10px",
    "padding:10px 18px",
    "background:#2563EB",
    "color:white",
    "border:0",
    "border-radius:8px",
    "cursor:pointer"
  ].join(";");

  card.append(title, comments, input, button);
  main.appendChild(card);

  connectForm(
    input,
    button,
    comments,
    activities
  );

  return { comments, activities };
}

async function init() {
  if (
    !taskIdText ||
    !Number.isSafeInteger(taskId) ||
    taskId <= 0
  ) {
    return;
  }

  if (!window.EOfficeAPI?.config?.LIVE) return;

  if (
    typeof EOfficeAPI.getKomentarTugas !== "function" ||
    typeof EOfficeAPI.kirimKomentarTugas !== "function" ||
    typeof EOfficeAPI.getAktivitasTugas !== "function"
  ) {
    console.error(
      "API kolaborasi belum tersedia pada api.js."
    );
    return;
  }

  const ui = isStaff ? setupStaff() : setupKS();

  if (!ui) return;

  await Promise.all([
    loadComments(ui.comments),
    loadActivities(ui.activities)
  ]);
}

init();
