function draftData(response, status, id = null) {
  const data = response?.data;
  const actualId = Number(data?.id);
  if (response?.status !== true || data?.status !== status ||
      !Number.isSafeInteger(actualId) || actualId < 1 || (id !== null && actualId !== id)) {
    throw new Error(response?.status === false && response.message
      ? response.message : "Server tidak mengonfirmasi status surat yang diminta.");
  }
  return data;
}

export async function submitSuratKeluarDraft(id) {
  return draftData(
    await window.EOfficeAPI.updateSuratKeluar(id, { status: "Diajukan" }),
    "Diajukan",
    Number(id),
  );
}

export function createDraftSession() {
  const api = window.EOfficeAPI;
  const url = new URL(location.href);
  let id = null;
  let draft = null;
  let uploadedFile = null;

  return {
    async load() {
      if (!api?.config?.LIVE) throw new Error("API backend belum aktif.");
      if (!url.searchParams.has("draft_id")) return null;
      const requestedId = Number(url.searchParams.get("draft_id"));
      if (!Number.isSafeInteger(requestedId) || requestedId < 1) {
        throw new Error("ID draft tidak valid.");
      }
      draft = draftData(await api.getSuratKeluarDetail(requestedId), "Draft", requestedId);
      id = requestedId;
      return draft;
    },
    get draft() {
      return draft;
    },
    async save(payload, file, key, submit) {
      const fields = { ...payload, status: "Draft" };
      let createKey = history.state?.suratKeluarCreateKey;
      if (!id && !createKey) {
        createKey = crypto.randomUUID();
        history.replaceState({ ...history.state, suratKeluarCreateKey: createKey }, "", url);
      }
      const response = id
        ? await api.updateSuratKeluar(id, fields)
        : await api.createSuratKeluar(fields, createKey);
      draft = draftData(response, "Draft", id);
      if (!id) {
        id = Number(draft.id);
        url.searchParams.set("draft_id", String(id));
        history.replaceState(history.state, "", url);
      }
      if (response.replayed) {
        const { resort_id: resortId, ...editableFields } = fields;
        if (Object.entries(editableFields).some(([field, value]) => (value || null) !== draft[field])) {
          draft = draftData(await api.updateSuratKeluar(id, editableFields), "Draft", id);
        }
      }
      if (file && uploadedFile !== file) {
        await api.uploadLampiranSuratKeluar(id, file, key);
        uploadedFile = file;
        draft.file_path = file.name;
      }
      if (submit) {
        return submitSuratKeluarDraft(id);
      }
      return draft;
    },
  };
}

export function validateSuratAttachment(file) {
  if (!/\.(pdf|docx|jpe?g|png)$/i.test(file.name)) {
    throw new Error("Lampiran harus PDF, DOCX, JPG, JPEG atau PNG.");
  }
  if (!file.size || file.size > 10 * 1024 * 1024) {
    throw new Error("Ukuran lampiran harus lebih dari 0 dan maksimal 10 MB.");
  }
}

export async function downloadDraftAttachment(id) {
  const { blob, filename } = await window.EOfficeAPI.downloadLampiranSuratKeluar(id);
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 60000);
}
