import { showToast } from "../components/toast.js";
import { openModal } from "../components/modal.js";
import { createDraftSession, downloadDraftAttachment, submitSuratKeluarDraft } from "./surat-keluar-draft.js";

const paper = document.getElementById("pgv-paper");
const submit = document.getElementById("pgv-ajukan");
const edit = document.getElementById("pgv-edit");
const download = document.getElementById("pgv-att-eye");
let scale = 1;
const params = new URLSearchParams(location.search);
const session = createDraftSession();

function render(record) {
  const heading = document.createElement("h2");
  heading.textContent = record.perihal || "Tanpa perihal";
  const items = [
    ["Nomor surat", record.no_surat],
    ["Nomor agenda", record.no_agenda],
    ["Tanggal", record.tanggal],
    ["Tujuan", record.tujuan],
  ];
  const fields = items.map(([label, value]) => {
    const line = document.createElement("p");
    line.textContent = `${label}: ${value || "?"}`;
    return line;
  });
  const body = document.createElement("p");
  body.style.whiteSpace = "pre-wrap";
  body.textContent = record.isi || "";
  paper.replaceChildren(heading, ...fields, body);
  document.getElementById("pgv-status").textContent = record.status || "Terdaftar";
  document.getElementById("pgv-maker").textContent = record.created_by_name || "?";
  document.getElementById("pgv-created").textContent = record.created_at || "?";
  document.getElementById("pgv-attachment-count").textContent = record.file_path ? "1" : "0";
}

for (const [id, delta] of [["pgv-zoom-in", 0.1], ["pgv-zoom-out", -0.1]]) {
  document.getElementById(id).addEventListener("click", () => {
    scale = Math.max(0.7, Math.min(1.4, scale + delta));
    paper.style.setProperty("--doc-scale", scale);
  });
}
document.getElementById("pgv-print").addEventListener("click", () => window.print());

async function init() {
  try {
    const id = Number(params.get("id"));
    let record;
    if (params.has("draft_id")) {
      record = await session.load();
    } else if (Number.isSafeInteger(id) && id > 0) {
      const response = await window.EOfficeAPI.getSuratKeluarDetail(id);
      if (response?.status !== true || Number(response.data?.id) !== id) {
        throw new Error(response?.message || "Detail surat tidak tersedia.");
      }
      record = response.data;
    }
    if (!record) throw new Error("ID surat tidak tersedia.");
    render(record);
    if (record.file_path) {
      download.hidden = false;
      download.addEventListener("click", async () => {
        try {
          await downloadDraftAttachment(record.id);
        } catch (error) {
          showToast(error.message);
        }
      });
    }
    if (record.status === "Draft") {
      edit.href = `buat-surat.html?draft_id=${record.id}`;
      edit.hidden = false;
      submit.hidden = false;
      submit.addEventListener("click", () => openModal({
        title: "Ajukan Surat Keluar",
        desc: "Surat akan diajukan dengan data Draft yang tersimpan.",
        confirmLabel: "Ya, Ajukan",
        onConfirm: async () => {
          if (submit.disabled) return;
          submit.disabled = true;
          try {
            await submitSuratKeluarDraft(record.id);
            location.href = "surat.html";
          } catch (error) {
            showToast(error.message);
            submit.disabled = false;
          }
        },
      }));
    }
  } catch (error) {
    paper.textContent = error.message;
  }
}

init();
