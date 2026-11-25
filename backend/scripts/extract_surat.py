
"""
E-Office BKSDA Jawa Tengah

Fitur:
- Ekstraksi nomor surat dari PDF digital
- OCR PDF hasil scan
- OCR gambar PNG/JPG/JPEG
- Pembacaan QR Code
- Validasi batas halaman PDF
- Timeout OCR
- Tidak membuka URL eksternal
"""

import json
import re
import sys

from pathlib import Path

import cv2
import numpy as np
import pymupdf as fitz

try:
    import pytesseract
except ImportError:
    pytesseract = None


# ==========================================
# 1. POLA NOMOR SURAT
# ==========================================

PATTERN = re.compile(
    r"(?im)^\s*"
    r"(?:nomor(?:\s+surat)?|no\.?(?:\s+surat)?)"
    r"\s*[:=\-]\s*"
    r"([A-Za-z0-9][A-Za-z0-9./_\-]{2,99})"
)



MONTHS_ID = {
    "januari": 1, "februari": 2, "maret": 3,
    "april": 4, "mei": 5, "juni": 6,
    "juli": 7, "agustus": 8, "september": 9,
    "oktober": 10, "november": 11, "desember": 12,
}


def extract_fields(text: str, nomor_saran=None) -> dict:
    """Ekstraksi konservatif informasi surat Indonesia."""

    import datetime

    fields = {
        "no_surat": nomor_saran,
        "tanggal": None,
        "tujuan": None,
        "perihal": None,
        "isi": None,
        "klasifikasi": None,
    }

    if not isinstance(text, str) or not text.strip():
        return fields

    lines = [line.strip() for line in text.splitlines() if line.strip()]
    normalized = "\n".join(lines)

    # Tanggal Indonesia: 24 November 2026.
    date_pattern = (
        r"\b(\d{1,2})\s+"
        r"(januari|februari|maret|april|mei|juni|juli|"
        r"agustus|september|oktober|november|desember)"
        r"\s+(\d{4})\b"
    )

    for match in re.finditer(date_pattern, normalized, re.I):
        day = int(match.group(1))
        month = MONTHS_ID[match.group(2).lower()]
        year = int(match.group(3))

        try:
            fields["tanggal"] = datetime.date(
                year, month, day
            ).isoformat()
            break
        except ValueError:
            continue

    # Tanggal numerik hanya diambil jika memiliki label tanggal.
    if not fields["tanggal"]:
        match = re.search(
            r"(?im)^\s*(?:tanggal|tgl\.?)\s*[:=-]\s*"
            r"(\d{1,2})[-/](\d{1,2})[-/](\d{4})\s*$",
            normalized
        )
        if match:
            try:
                fields["tanggal"] = datetime.date(
                    int(match.group(3)),
                    int(match.group(2)),
                    int(match.group(1))
                ).isoformat()
            except ValueError:
                pass

    # Tujuan: baris Yth./Kepada.
    for index, line in enumerate(lines):
        if re.search(r"\b(?:yth\.?|yang terhormat)\b", line, re.I):
            value = re.sub(
                r"(?i)^.*?\b(?:yth\.?|yang terhormat)\b",
                "",
                line
            ).strip(" .,:;-")

            if not value and index + 1 < len(lines):
                value = lines[index + 1]

            if value and len(value) <= 255:
                fields["tujuan"] = value
            break

    # Perihal atau Hal.
    match = re.search(
        r"(?im)^\s*(?:perihal|hal)\s*[:=-]\s*(.+)$",
        normalized
    )
    if match:
        value = match.group(1).strip()
        if value and len(value) <= 1000:
            fields["perihal"] = value

    # Klasifikasi atau sifat surat jika tertulis eksplisit.
    match = re.search(
        r"(?im)^\s*(?:klasifikasi|sifat)\s*[:=-]\s*(.+)$",
        normalized
    )
    if match:
        fields["klasifikasi"] = match.group(1).strip()[:100]

    # Isi surat dimulai pada salam pembuka yang dikenali.
    body_match = re.search(
        r"(?im)^\s*(?:dengan hormat[,.:]?|"
        r"assalamu['’]alaikum(?:\s+warahmatullahi)?[,.:]?)\s*$",
        normalized
    )

    if body_match:
        body = normalized[body_match.start():].strip()
        if body and len(body) <= 12000:
            fields["isi"] = body
        elif body:
            fields["isi"] = body[:12000]

    return fields


# ==========================================
# 2. FUNGSI UTAMA
# ==========================================

def main(path: str, kind: str) -> dict:

    result = {
        "status": True,
        "nomor_surat_saran": None,
        "kandidat": [],
        "qrcodes": [],
        "teks_terbaca": "",
        "ocr_tersedia": False,
        "peringatan": []
    }

    seen = set()
    qr_seen = set()
    ocr_language = None

    # ======================================
    # 3. SIMPAN KANDIDAT NOMOR SURAT
    # ======================================

    def add_candidate(
        number: str,
        source: str
    ) -> None:

        number = number.strip().rstrip(
            ".,;:"
        )

        if len(number) < 3 or len(number) > 100:
            return

        key = number.casefold()

        # Maksimal 20 kandidat
        if (
            key not in seen and
            len(result["kandidat"]) < 20
        ):

            seen.add(key)

            result["kandidat"].append({
                "nomor": number,
                "sumber": source
            })

    # ======================================
    # 4. CARI NOMOR DI DALAM TEKS
    # ======================================

    def parse_text(
        text: str,
        source: str
    ) -> None:

        # Simpan teks dokumen digital dan hasil OCR.
        # Jangan masukkan payload QR sebagai isi surat.
        if isinstance(text, str) and not source.startswith("qr_"):
            cleaned_text = text.strip()

            if cleaned_text:
                remaining = 30000 - len(result["teks_terbaca"])

                if remaining > 0:
                    result["teks_terbaca"] += (
                        "\n" + cleaned_text[:remaining]
                    )

        # Pertahankan deteksi kandidat nomor surat.
        for match in PATTERN.finditer(text):

            add_candidate(
                match.group(1),
                source
            )

    # ======================================
    # 5. BACA ISI QR CODE
    # ======================================

    def parse_qr(
        payload: str,
        source: str
    ) -> None:

        payload = payload.strip()

        if (
            not payload or
            payload in qr_seen or
            len(qr_seen) >= 10
        ):
            return

        qr_seen.add(payload)

        result["qrcodes"].append({
            "isi": payload[:2000],
            "sumber": source
        })

        # QR Code yang berisi URL verifikasi
        # tidak dibuka otomatis.

        if payload.lower().startswith(
            ("http://", "https://")
        ):
            return

        # ==================================
        # 6. QR BERISI JSON
        # ==================================

        if payload.startswith("{"):

            try:

                data = json.loads(payload)

                if isinstance(data, dict):

                    for key in (
                        "no_surat",
                        "nomor_surat",
                        "nomor"
                    ):

                        value = data.get(key)

                        if isinstance(value, str):

                            add_candidate(
                                value,
                                "qr_json"
                            )

            except json.JSONDecodeError:
                pass

        # ==================================
        # 7. QR BERISI TEKS
        # ==================================

        parse_text(
            payload,
            "qr_teks"
        )

        # ==================================
        # 8. QR BERISI NOMOR LANGSUNG
        # ==================================

        if re.fullmatch(
            r"[A-Za-z0-9][A-Za-z0-9./_\-]{4,99}",
            payload
        ) and (
            "/" in payload or
            "-" in payload
        ):

            add_candidate(
                payload,
                "qr_langsung"
            )

    # ======================================
    # 9. SIAPKAN QR CODE DETECTOR
    # ======================================

    detector = cv2.QRCodeDetector()

    # ======================================
    # 10. PROSES GAMBAR
    # ======================================

    def process_image(
        image: np.ndarray,
        source: str
    ) -> None:

        if image is None or image.size == 0:
            return

        height, width = image.shape[:2]

        # Batasi ukuran pemrosesan gambar
        if max(height, width) > 2500:

            factor = 2500 / max(
                height,
                width
            )

            image = cv2.resize(
                image,
                None,
                fx=factor,
                fy=factor
            )

        # ==================================
        # 11. DETEKSI QR CODE
        # ==================================

        try:

            multi_ok, decoded, _, _ = (
                detector.detectAndDecodeMulti(
                    image
                )
            )

            if multi_ok:

                for value in decoded:

                    parse_qr(
                        value,
                        source
                    )

            single, _, _ = (
                detector.detectAndDecode(
                    image
                )
            )

            parse_qr(
                single,
                source
            )

        except cv2.error:

            result["peringatan"].append(
                "Sebagian QR tidak bisa dipindai."
            )

        # ==================================
        # 12. OCR GAMBAR
        # ==================================

        if (
            pytesseract is not None and
            result["ocr_tersedia"]
        ):

            try:

                rgb = cv2.cvtColor(
                    image,
                    cv2.COLOR_BGR2RGB
                )

                text = pytesseract.image_to_string(
                    rgb,
                    lang=ocr_language,
                    config="--psm 3",
                    timeout=5
                )

                parse_text(
                    text,
                    "ocr_" + source
                )

            except Exception:

                result["peringatan"].append(
                    "OCR tidak berhasil pada " +
                    source + "."
                )

    # ======================================
    # 13. CEK TESSERACT OCR
    # ======================================

    if pytesseract is not None:

        try:

            windows_bin = Path(
                r"C:\Program Files\Tesseract-OCR\tesseract.exe"
            )

            if (
                sys.platform == "win32" and
                windows_bin.is_file()
            ):

                pytesseract.pytesseract.tesseract_cmd = str(
                    windows_bin
                )

            pytesseract.get_tesseract_version()

            installed = set(pytesseract.get_languages(config=""))
            selected = [lang for lang in ("ind", "eng") if lang in installed]
            if selected:
                ocr_language = "+".join(selected)
                result["ocr_tersedia"] = True
            if "ind" not in installed:
                result["peringatan"].append(
                    "Data bahasa Indonesia Tesseract belum tersedia."
                )

        except Exception:
            pass

    # ======================================
    # 14. EKSTRAKSI PDF
    # ======================================

    if kind == "pdf":

        with fitz.open(
            stream=Path(path).read_bytes(),
            filetype="pdf"
        ) as doc:

            # PDF dengan password
            if doc.needs_pass:

                return {
                    "status": False,
                    "message": "PDF dilindungi password."
                }

            # Batas jumlah halaman
            if len(doc) > 25:

                return {
                    "status": False,
                    "message": "PDF maksimal 25 halaman."
                }

            # Ambil maksimal:
            # - 2 halaman pertama
            # - 2 halaman terakhir

            indexes = sorted(
                set(
                    list(
                        range(
                            min(2, len(doc))
                        )
                    ) +
                    list(
                        range(
                            max(
                                0,
                                len(doc) - 2
                            ),
                            len(doc)
                        )
                    )
                )
            )

            for index in indexes:

                page = doc[index]

                # ==========================
                # 15. BACA TEKS PDF DIGITAL
                # ==========================

                text = page.get_text(
                    "text",
                    sort=True
                )

                parse_text(
                    text,
                    "pdf_teks_halaman_" +
                    str(index + 1)
                )

                # ==========================
                # 16. RENDER PDF KE GAMBAR
                # ==========================

                scale = min(
                    2.0,
                    2000 / max(
                        page.rect.width,
                        page.rect.height
                    )
                )

                pix = page.get_pixmap(
                    matrix=fitz.Matrix(
                        scale,
                        scale
                    ),
                    colorspace=fitz.csRGB,
                    alpha=False
                )

                rgb = np.frombuffer(
                    pix.samples,
                    dtype=np.uint8
                ).reshape(
                    pix.height,
                    pix.width,
                    pix.n
                )

                bgr = cv2.cvtColor(
                    rgb,
                    cv2.COLOR_RGB2BGR
                )

                # ==========================
                # 17. BACA QR DAN OCR PDF
                # ==========================

                process_image(
                    bgr,
                    "pdf_halaman_" +
                    str(index + 1)
                )

            # Beri informasi jika tidak semua
            # halaman PDF diperiksa

            if len(doc) > len(indexes):

                result["peringatan"].append(
                    "Hanya 2 halaman awal dan 2 halaman akhir dipindai."
                )

    # ======================================
    # 18. EKSTRAKSI GAMBAR PNG/JPG
    # ======================================

    elif kind in (
        "png",
        "jpg",
        "jpeg"
    ):

        image = cv2.imdecode(
            np.fromfile(
                path,
                dtype=np.uint8
            ),
            cv2.IMREAD_COLOR
        )

        if image is None:

            return {
                "status": False,
                "message": "Gambar tidak dapat dibaca."
            }

        process_image(
            image,
            "gambar"
        )

    # ======================================
    # 19. FORMAT TIDAK DIDUKUNG
    # ======================================

    else:

        return {
            "status": False,
            "message": "Jenis file tidak didukung."
        }

    # ======================================
    # 20. INFORMASI KETERSEDIAAN OCR
    # ======================================

    if not result["ocr_tersedia"]:

        result["peringatan"].append(
            "Tesseract OCR belum tersedia; "
            "teks pada gambar/scan mungkin tidak terbaca."
        )

    # ======================================
    # 21. TENTUKAN NOMOR SURAT SARAN
    # ======================================

    if result["kandidat"]:

        result["nomor_surat_saran"] = (
            result["kandidat"][0]["nomor"]
        )

    result["fields"] = extract_fields(
        result["teks_terbaca"],
        result["nomor_surat_saran"]
    )

    return result


# ==========================================
# 22. ENTRY POINT
# ==========================================

if __name__ == "__main__":

    try:

        result = main(
            sys.argv[1],
            sys.argv[2]
        )

    except Exception:

        # Hindari membocorkan traceback atau
        # lokasi file internal server.

        result = {
            "status": False,
            "message": "Dokumen tidak bisa diproses."
        }

    print(
        json.dumps(
            result,
            ensure_ascii=False
        )
    )
