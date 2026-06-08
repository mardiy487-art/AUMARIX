/* =====================================================
   AUMARIX ACCOUNTING SYSTEM
   FILE : asettetap.js
===================================================== */

let asetData = [];

/* ==========================================
   HELPER
========================================== */

function getAsetValue(id) {
    return document.getElementById(id)?.value?.trim() || "";
}

function setAsetValue(id, value) {
    const el = document.getElementById(id);
    if (el) el.value = value ?? "";
}

function setAsetText(id, value) {
    const el = document.getElementById(id);
    if (el) el.innerHTML = value;
}

function rupiahAset(value) {
    if (typeof rupiah === "function") {
        return rupiah(value);
    }

    return Number(value || 0).toLocaleString("id-ID", {
        style: "currency",
        currency: "IDR",
        maximumFractionDigits: 0
    });
}

function escapeAset(value) {
    return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

function toNumberAset(value) {
    return Number(value || 0);
}

function formatDateInputAset(value) {
    if (!value) return "";

    const d = new Date(value);

    if (isNaN(d.getTime())) {
        return value;
    }

    return d.toISOString().slice(0, 10);
}

/* ==========================================
   LOAD ASET
========================================== */

async function loadAsetTetap() {
    try {
        showLoading();

        const result = await apiGet("getAsetTetap");

        if (!result.success) {
            throw new Error(result.message || "Gagal memuat aset tetap");
        }

        asetData =
            result.data?.rows ||
            result.data?.data ||
            result.data ||
            [];

        renderAsetTable();
        updateAsetSummary();

    } catch (err) {
        console.error(err);

        const tbody = document.getElementById("asetTable");

        if (tbody) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="14" class="empty-table">
                        ❌ ${err.message || err}
                    </td>
                </tr>
            `;
        }

    } finally {
        hideLoading();
    }
}

/* ==========================================
   SUMMARY
========================================== */

function updateAsetSummary() {
    let totalHarga = 0;
    let totalAkumulasi = 0;
    let totalNilaiBuku = 0;

    asetData.forEach(aset => {
        totalHarga += toNumberAset(
            aset.hargaPerolehan ||
            aset["Harga Perolehan"]
        );

        totalAkumulasi += toNumberAset(
            aset.akumulasiPenyusutan
        );

        totalNilaiBuku += toNumberAset(
            aset.nilaiBuku
        );
    });

    setAsetText("asetTotal", asetData.length);
    setAsetText("asetHargaTotal", rupiahAset(totalHarga));
    setAsetText("asetAkumulasiTotal", rupiahAset(totalAkumulasi));
    setAsetText("asetNilaiBukuTotal", rupiahAset(totalNilaiBuku));
}

/* ==========================================
   RENDER TABLE
========================================== */

function renderAsetTable() {
    const tbody = document.getElementById("asetTable");
    if (!tbody) return;

    if (!asetData.length) {
        tbody.innerHTML = `
            <tr>
                <td colspan="14" class="empty-table">
                    Tidak ada data aset tetap
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = asetData.map(aset => {
        const kode =
            aset["Kode Aset"] ||
            aset.kodeAset ||
            "";

        return `
            <tr>
                <td><strong>${escapeAset(kode)}</strong></td>

                <td>${escapeAset(aset["Nama Aset"] || aset.namaAset || "")}</td>

                <td>${escapeAset(aset["Kode Akun Aset"] || aset.kodeAkunAset || "")}</td>

                <td>${escapeAset(aset["Kode Akun Akumulasi"] || aset.kodeAkunAkumulasi || "")}</td>

                <td>${escapeAset(aset["Kode Akun Beban Penyusutan"] || aset.kodeAkunBebanPenyusutan || "")}</td>

                <td>${escapeAset(aset["Tanggal Perolehan"] || aset.tanggalPerolehan || "")}</td>

                <td class="text-right">
                    ${rupiahAset(aset["Harga Perolehan"] || aset.hargaPerolehan)}
                </td>

                <td class="text-right">
                    ${rupiahAset(aset["Nilai Residu"] || aset.nilaiResidu)}
                </td>

                <td>
                    ${escapeAset(aset["Umur Ekonomis (Tahun)"] || aset.umurEkonomis || 0)} Tahun
                </td>

                <td class="text-right">
                    ${rupiahAset(aset.penyusutanBulanan)}
                </td>

                <td class="text-right">
                    ${rupiahAset(aset.akumulasiPenyusutan)}
                </td>

                <td class="text-right">
                    ${rupiahAset(aset.nilaiBuku)}
                </td>

                <td>
                    ${escapeAset(aset["Status"] || aset.status || "AKTIF")}
                </td>

                <td class="table-actions">
                    <button
                        type="button"
                        class="btn btn-warning btn-sm"
                        onclick="editAset('${escapeAset(kode)}')">
                        ✏ Edit
                    </button>

                    <button
                        type="button"
                        class="btn btn-danger btn-sm"
                        onclick="deleteAset('${escapeAset(kode)}')">
                        🗑 Hapus
                    </button>
                </td>
            </tr>
        `;
    }).join("");
}

/* ==========================================
   MODAL
========================================== */

function showAsetModal(mode = "add") {
    setAsetText(
        "asetModalTitle",
        mode === "edit"
            ? "Edit Aset Tetap"
            : "Tambah Aset Tetap"
    );

    if (mode === "add") {
        resetAsetForm();
    }

    const modal = document.getElementById("asetModal");
    if (modal) modal.style.display = "flex";
}

function closeAsetModal() {
    const modal = document.getElementById("asetModal");
    if (modal) modal.style.display = "none";

    resetAsetForm();
}

function resetAsetForm() {
    setAsetValue("editModeAset", "");
    setAsetValue("oldKodeAset", "");
    setAsetValue("asetKode", "");
    setAsetValue("asetNama", "");
    setAsetValue("asetKodeAkun", "");
    setAsetValue("asetKodeAkumulasi", "");
    setAsetValue("asetKodeBeban", "");
    setAsetValue("asetTanggal", "");
    setAsetValue("asetHarga", 0);
    setAsetValue("asetResidu", 0);
    setAsetValue("asetUmur", 1);
    setAsetValue("asetMetode", "GARIS_LURUS");
    setAsetValue("asetStatus", "AKTIF");
}

/* ==========================================
   EDIT
========================================== */

function editAset(kodeAset) {
    const aset = asetData.find(row =>
        String(row["Kode Aset"] || row.kodeAset) === String(kodeAset)
    );

    if (!aset) {
        error("Data aset tidak ditemukan");
        return;
    }

    setAsetValue("editModeAset", "EDIT");
    setAsetValue("oldKodeAset", aset["Kode Aset"] || aset.kodeAset || "");
    setAsetValue("asetKode", aset["Kode Aset"] || aset.kodeAset || "");
    setAsetValue("asetNama", aset["Nama Aset"] || aset.namaAset || "");
    setAsetValue("asetKodeAkun", aset["Kode Akun Aset"] || aset.kodeAkunAset || "");
    setAsetValue("asetKodeAkumulasi", aset["Kode Akun Akumulasi"] || aset.kodeAkunAkumulasi || "");
    setAsetValue("asetKodeBeban", aset["Kode Akun Beban Penyusutan"] || aset.kodeAkunBebanPenyusutan || "");
    setAsetValue("asetTanggal", formatDateInputAset(aset["Tanggal Perolehan"] || aset.tanggalPerolehan || ""));
    setAsetValue("asetHarga", aset["Harga Perolehan"] || aset.hargaPerolehan || 0);
    setAsetValue("asetResidu", aset["Nilai Residu"] || aset.nilaiResidu || 0);
    setAsetValue("asetUmur", aset["Umur Ekonomis (Tahun)"] || aset.umurEkonomis || 1);
    setAsetValue("asetMetode", aset["Metode Penyusutan"] || aset.metodePenyusutan || "GARIS_LURUS");
    setAsetValue("asetStatus", aset["Status"] || aset.status || "AKTIF");

    showAsetModal("edit");
}

/* ==========================================
   BUILD DATA
========================================== */

function getAsetFormData() {
    const kodeAset = getAsetValue("asetKode");
    const namaAset = getAsetValue("asetNama");
    const kodeAkunAset = getAsetValue("asetKodeAkun");
    const kodeAkunAkumulasi = getAsetValue("asetKodeAkumulasi");
    const kodeAkunBeban = getAsetValue("asetKodeBeban");
    const tanggal = getAsetValue("asetTanggal");
    const harga = toNumberAset(getAsetValue("asetHarga"));
    const residu = toNumberAset(getAsetValue("asetResidu"));
    const umur = toNumberAset(getAsetValue("asetUmur"));

    if (!kodeAset) {
        error("Kode aset wajib diisi");
        return null;
    }

    if (!namaAset) {
        error("Nama aset wajib diisi");
        return null;
    }

    if (!kodeAkunAset) {
        error("Kode akun aset wajib diisi");
        return null;
    }

    if (!kodeAkunAkumulasi) {
        error("Kode akun akumulasi wajib diisi");
        return null;
    }

    if (!kodeAkunBeban) {
        error("Kode akun beban penyusutan wajib diisi");
        return null;
    }

    if (!tanggal) {
        error("Tanggal perolehan wajib diisi");
        return null;
    }

    if (harga <= 0) {
        error("Harga perolehan harus lebih dari 0");
        return null;
    }

    if (residu < 0) {
        error("Nilai residu tidak boleh negatif");
        return null;
    }

    if (residu >= harga) {
        error("Nilai residu tidak boleh lebih besar/sama dengan harga perolehan");
        return null;
    }

    if (umur <= 0) {
        error("Umur ekonomis harus lebih dari 0");
        return null;
    }

    return {
        "Kode Aset": kodeAset,
        "Nama Aset": namaAset,
        "Kode Akun Aset": kodeAkunAset,
        "Kode Akun Akumulasi": kodeAkunAkumulasi,
        "Kode Akun Beban Penyusutan": kodeAkunBeban,
        "Tanggal Perolehan": tanggal,
        "Harga Perolehan": harga,
        "Nilai Residu": residu,
        "Umur Ekonomis (Tahun)": umur,
        "Metode Penyusutan": getAsetValue("asetMetode") || "GARIS_LURUS",
        "Status": getAsetValue("asetStatus") || "AKTIF"
    };
}

/* ==========================================
   SAVE
========================================== */

async function saveAsetData() {
    const data = getAsetFormData();
    if (!data) return;

    const editMode = getAsetValue("editModeAset");
    const oldKodeAset = getAsetValue("oldKodeAset");

    const action =
        editMode === "EDIT"
            ? "updateAsetTetap"
            : "saveAsetTetap";

    const payload =
        editMode === "EDIT"
            ? {
                ...data,
                kodeAset: oldKodeAset,
                oldKodeAset: oldKodeAset
            }
            : data;

    try {
        const result = await apiPost(action, payload);

        if (result.success) {
            success(
                editMode === "EDIT"
                    ? "Aset berhasil diperbarui"
                    : "Aset berhasil disimpan"
            );

            closeAsetModal();
            await loadAsetTetap();

        } else {
            error(result.message || "Gagal menyimpan aset");
        }

    } catch (err) {
        console.error(err);
        error(err.message || "Terjadi kesalahan saat menyimpan aset");
    }
}

/* ==========================================
   DELETE
========================================== */

async function deleteAset(kodeAset) {
    if (!confirm(`Hapus aset ${kodeAset}?`)) return;

    try {
        const result = await apiPost("deleteAsetTetap", {
            kodeAset: kodeAset
        });

        if (result.success) {
            success("Aset berhasil dihapus");
            await loadAsetTetap();
        } else {
            error(result.message || "Gagal menghapus aset");
        }

    } catch (err) {
        console.error(err);
        error(err.message || "Terjadi kesalahan saat menghapus aset");
    }
}

/* ==========================================
   EXPORT EXCEL
========================================== */

function exportAsetExcel() {
    if (!asetData.length) {
        alert("Data aset kosong");
        return;
    }

    const ws = XLSX.utils.json_to_sheet(asetData);
    const wb = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(wb, ws, "Aset Tetap");

    XLSX.writeFile(
        wb,
        `Aset_Tetap_${new Date().toISOString().slice(0,10)}.xlsx`
    );
}

/* ==========================================
   EXPORT PDF
========================================== */

function exportAsetPDF() {
    if (!asetData.length) {
        alert("Data aset kosong");
        return;
    }

    const { jsPDF } = window.jspdf;

    const doc = new jsPDF({
        orientation: "landscape",
        unit: "mm",
        format: "a4"
    });

    doc.setFontSize(16);
    doc.text("AUMARIX ACCOUNTING SYSTEM", 14, 15);

    doc.setFontSize(12);
    doc.text("LAPORAN ASET TETAP", 14, 23);

    const body = asetData.map(aset => [
        aset["Kode Aset"] || aset.kodeAset || "",
        aset["Nama Aset"] || aset.namaAset || "",
        aset["Tanggal Perolehan"] || aset.tanggalPerolehan || "",
        rupiahAset(aset["Harga Perolehan"] || aset.hargaPerolehan),
        rupiahAset(aset["Nilai Residu"] || aset.nilaiResidu),
        aset["Umur Ekonomis (Tahun)"] || aset.umurEkonomis || "",
        rupiahAset(aset.penyusutanBulanan),
        rupiahAset(aset.akumulasiPenyusutan),
        rupiahAset(aset.nilaiBuku),
        aset["Status"] || aset.status || ""
    ]);

    doc.autoTable({
        startY: 30,
        head: [[
            "Kode",
            "Nama Aset",
            "Tanggal",
            "Harga",
            "Residu",
            "Umur",
            "Susut/Bulan",
            "Akumulasi",
            "Nilai Buku",
            "Status"
        ]],
        body: body,
        theme: "grid",
        styles: {
            fontSize: 7,
            cellPadding: 2
        },
        headStyles: {
            fillColor: [37, 99, 235],
            textColor: 255
        }
    });

    doc.save(
        `Aset_Tetap_${new Date().toISOString().slice(0,10)}.pdf`
    );
}

/* ==========================================
   AUTO LOAD
========================================== */

document.addEventListener("DOMContentLoaded", () => {
    if (
        document.getElementById("asetTable") &&
        typeof loadAsetTetap === "function"
    ) {
        loadAsetTetap();
    }
});