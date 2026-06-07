/********************************************************
 * AUMARIX ACCOUNTING SYSTEM
 * FILE : coa.js
 ********************************************************/

let coaData = [];
let coaFilteredData = [];

/* ==========================
   HELPER
========================== */

function rupiah(value) {
    return numberFormat(Number(value || 0));
}

function escapeHTML(value) {
    return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

function getValue(id) {
    return document.getElementById(id)?.value?.trim() || "";
}

function setValue(id, value) {
    const el = document.getElementById(id);
    if (el) el.value = value ?? "";
}

function setText(id, value) {
    const el = document.getElementById(id);
    if (el) el.innerHTML = value;
}

function toNumberCOA(value) {
    return Number(value || 0);
}

/* ==========================
   LOAD COA
========================== */

async function loadCOA() {
    try {
        const result = await apiGet("getCOA");

        if (!result.success) {
            error(result.message || "Gagal mengambil data COA");
            return;
        }

        coaData = result.data?.rows || result.data || [];
        coaFilteredData = [...coaData];

        renderCOATable(coaFilteredData);
        updateCOASummary(coaFilteredData);
        loadKelompokFilter();

    } catch (err) {
        console.error(err);
        error(err.message || "Terjadi kesalahan saat mengambil COA");
    }
}

/* ==========================
   SUMMARY
========================== */

function updateCOASummary(data) {
    let totalDebit = 0;
    let totalKredit = 0;

    data.forEach(row => {
        totalDebit += toNumberCOA(row["Saldo Awal Debit"]);
        totalKredit += toNumberCOA(row["Saldo Awal Kredit"]);
    });

    setText("totalAkun", data.length);
    setText("totalDebitAwal", rupiah(totalDebit));
    setText("totalKreditAwal", rupiah(totalKredit));

    const status = document.getElementById("statusBalance");
    if (!status) return;

    if (Math.round(totalDebit) === Math.round(totalKredit)) {
        status.innerHTML = "🟢 BALANCE";
        status.style.color = "#16a34a";
    } else {
        status.innerHTML = "🔴 TIDAK BALANCE";
        status.style.color = "#dc2626";
    }
}

/* ==========================
   TABLE
========================== */

function renderCOATable(data) {
    const tbody = document.getElementById("coaTable");
    if (!tbody) return;

    if (!data.length) {
        tbody.innerHTML = `
            <tr>
                <td colspan="9" class="empty-table">
                    Data COA tidak ditemukan
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = data.map(row => {
        const kode = escapeHTML(row["Kode Akun"]);

        return `
            <tr>
                <td><strong>${kode}</strong></td>
                <td>${escapeHTML(row["Nama Akun"])}</td>
                <td>${escapeHTML(row["Kelompok Akun"])}</td>
                <td>${escapeHTML(row["Pos Saldo"])}</td>
                <td>${escapeHTML(row["Pos Laporan"])}</td>

                <td class="text-right">
                    ${rupiah(row["Saldo Awal Debit"])}
                </td>

                <td class="text-right">
                    ${rupiah(row["Saldo Awal Kredit"])}
                </td>

                <td>
                    ${escapeHTML(row["Jenis Akun"] || "NON KAS")}
                </td>

                <td class="table-actions">
                    <button
                        type="button"
                        class="btn btn-warning btn-sm"
                        onclick="editCOA('${kode}')">
                        ✏ Edit
                    </button>

                    <button
                        type="button"
                        class="btn btn-danger btn-sm"
                        onclick="deleteCOA('${kode}')">
                        🗑 Hapus
                    </button>
                </td>
            </tr>
        `;
    }).join("");
}

/* ==========================
   FILTER KELOMPOK
========================== */

function loadKelompokFilter() {
    const select = document.getElementById("filterKelompok");
    if (!select) return;

    const selected = select.value;

    const kelompokList = [
        ...new Set(
            coaData
                .map(row => row["Kelompok Akun"])
                .filter(Boolean)
        )
    ].sort();

    select.innerHTML = `<option value="">Semua Kelompok</option>`;

    kelompokList.forEach(kelompok => {
        select.innerHTML += `
            <option value="${escapeHTML(kelompok)}">
                ${escapeHTML(kelompok)}
            </option>
        `;
    });

    select.value = selected;
}

/* ==========================
   SEARCH + FILTER
========================== */

function filterCOA() {
    const keyword = getValue("searchCOA").toLowerCase();
    const kelompok = getValue("filterKelompok");

    coaFilteredData = coaData.filter(row => {
        const kode = String(row["Kode Akun"] || "").toLowerCase();
        const nama = String(row["Nama Akun"] || "").toLowerCase();
        const group = String(row["Kelompok Akun"] || "");

        const matchSearch =
            kode.includes(keyword) ||
            nama.includes(keyword);

        const matchKelompok =
            !kelompok || group === kelompok;

        return matchSearch && matchKelompok;
    });

    renderCOATable(coaFilteredData);
    updateCOASummary(coaFilteredData);
}

/* ==========================
   MODAL
========================== */

function showCOAModal(mode = "add") {
    setText(
        "modalTitle",
        mode === "edit" ? "Edit COA" : "Tambah COA"
    );

    if (mode === "add") {
        resetCOAForm();
    }

    const modal = document.getElementById("coaModal");
    if (modal) modal.style.display = "flex";
}

function closeCOAModal() {
    const modal = document.getElementById("coaModal");
    if (modal) modal.style.display = "none";

    resetCOAForm();
}

function resetCOAForm() {
    setValue("editMode", "");
    setValue("oldKodeAkun", "");
    setValue("coaKode", "");
    setValue("coaNama", "");
    setValue("coaKelompok", "");
    setValue("coaPosSaldo", "Debit");
    setValue("coaPosLaporan", "Neraca");
    setValue("coaDebit", 0);
    setValue("coaKredit", 0);
    setValue("coaJenisAkun", "NON KAS");
}

/* ==========================
   EDIT
========================== */

function editCOA(kodeAkun) {
    const akun = coaData.find(row =>
        String(row["Kode Akun"]) === String(kodeAkun)
    );

    if (!akun) {
        error("Data akun tidak ditemukan");
        return;
    }

    setValue("editMode", "EDIT");
    setValue("oldKodeAkun", akun["Kode Akun"]);
    setValue("coaKode", akun["Kode Akun"]);
    setValue("coaNama", akun["Nama Akun"]);
    setValue("coaKelompok", akun["Kelompok Akun"]);
    setValue("coaPosSaldo", akun["Pos Saldo"]);
    setValue("coaPosLaporan", akun["Pos Laporan"]);
    setValue("coaDebit", akun["Saldo Awal Debit"] || 0);
    setValue("coaKredit", akun["Saldo Awal Kredit"] || 0);
    setValue("coaJenisAkun", akun["Jenis Akun"] || "NON KAS");

    showCOAModal("edit");
}

/* ==========================
   BUILD DATA
========================== */

function getCOAFormData() {
    const kodeAkun = getValue("coaKode");
    const namaAkun = getValue("coaNama");
    const kelompok = getValue("coaKelompok");
    const posSaldo = getValue("coaPosSaldo");
    const posLaporan = getValue("coaPosLaporan");
    const jenisAkun = getValue("coaJenisAkun") || "NON KAS";

    const debit = toNumberCOA(getValue("coaDebit"));
    const kredit = toNumberCOA(getValue("coaKredit"));

    if (!kodeAkun) {
        error("Kode akun wajib diisi");
        return null;
    }

    if (!namaAkun) {
        error("Nama akun wajib diisi");
        return null;
    }

    if (!kelompok) {
        error("Kelompok akun wajib diisi");
        return null;
    }

    if (!posSaldo) {
        error("Pos saldo wajib diisi");
        return null;
    }

    if (!posLaporan) {
        error("Pos laporan wajib diisi");
        return null;
    }

    if (!jenisAkun) {
        error("Jenis akun wajib diisi");
        return null;
    }

    if (debit > 0 && kredit > 0) {
        error("Saldo awal tidak boleh debit dan kredit sekaligus");
        return null;
    }

    return {
        "Kode Akun": kodeAkun,
        "Nama Akun": namaAkun,
        "Kelompok Akun": kelompok,
        "Pos Saldo": posSaldo,
        "Pos Laporan": posLaporan,
        "Saldo Awal Debit": debit,
        "Saldo Awal Kredit": kredit,
        "Jenis Akun": jenisAkun
    };
}

/* ==========================
   SAVE
========================== */

async function saveCOAData() {
    const data = getCOAFormData();
    if (!data) return;

    const editMode = getValue("editMode");
    const oldKodeAkun = getValue("oldKodeAkun");

    const action = editMode === "EDIT" ? "updateCOA" : "saveCOA";

    const payload = editMode === "EDIT"
        ? {
            ...data,
            kodeAkun: oldKodeAkun,
            oldKodeAkun: oldKodeAkun
        }
        : data;

    try {
        const result = await apiPost(action, payload);

        if (result.success) {
            success(
                editMode === "EDIT"
                    ? "COA berhasil diperbarui"
                    : "COA berhasil disimpan"
            );

            closeCOAModal();
            await loadCOA();

        } else {
            error(result.message || "Gagal menyimpan COA");
        }

    } catch (err) {
        console.error(err);
        error(err.message || "Terjadi kesalahan saat menyimpan COA");
    }
}

/* ==========================
   DELETE
========================== */

async function deleteCOA(kodeAkun) {
    const konfirmasi = confirm(`Hapus akun ${kodeAkun}?`);

    if (!konfirmasi) return;

    try {
        const result = await apiPost("deleteCOA", {
            kodeAkun: kodeAkun
        });

        if (result.success) {
            success("COA berhasil dihapus");
            await loadCOA();

        } else {
            error(result.message || "Gagal menghapus COA");
        }

    } catch (err) {
        console.error(err);
        error(err.message || "Terjadi kesalahan saat menghapus COA");
    }
}

/* ==========================
   EXPORT EXCEL
========================== */

function exportCOAExcel() {
    const data = coaFilteredData.length ? coaFilteredData : coaData;

    if (!data.length) {
        alert("Data COA kosong");
        return;
    }

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(
        workbook,
        worksheet,
        "COA"
    );

    XLSX.writeFile(
        workbook,
        `COA_${new Date().toISOString().slice(0, 10)}.xlsx`
    );
}

/* ==========================
   EXPORT PDF
========================== */

function exportCOAPDF() {
    const data = coaFilteredData.length ? coaFilteredData : coaData;

    if (!data.length) {
        alert("Data COA kosong");
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
    doc.text("CHART OF ACCOUNTS", 14, 22);

    doc.setFontSize(9);
    doc.text(
        "Tanggal Cetak : " + new Date().toLocaleDateString("id-ID"),
        14,
        28
    );

    const body = data.map(row => [
        row["Kode Akun"] || "",
        row["Nama Akun"] || "",
        row["Kelompok Akun"] || "",
        row["Pos Saldo"] || "",
        row["Pos Laporan"] || "",
        rupiah(row["Saldo Awal Debit"]),
        rupiah(row["Saldo Awal Kredit"]),
        row["Jenis Akun"] || "NON KAS"
    ]);

    doc.autoTable({
        startY: 35,

        head: [[
            "Kode Akun",
            "Nama Akun",
            "Kelompok Akun",
            "Pos Saldo",
            "Pos Laporan",
            "Saldo Awal Debit",
            "Saldo Awal Kredit",
            "Jenis Akun"
        ]],

        body: body,
        theme: "grid",

        styles: {
            fontSize: 8,
            cellPadding: 2,
            overflow: "linebreak"
        },

        headStyles: {
            fillColor: [41, 128, 185],
            textColor: 255,
            fontStyle: "bold"
        },

        columnStyles: {
            0: { cellWidth: 22 },
            1: { cellWidth: 55 },
            2: { cellWidth: 40 },
            3: { cellWidth: 22 },
            4: { cellWidth: 28 },
            5: { halign: "right" },
            6: { halign: "right" },
            7: { cellWidth: 25 }
        },

        margin: {
            top: 35,
            left: 10,
            right: 10
        }
    });

    const totalPages = doc.internal.getNumberOfPages();

    for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        doc.setFontSize(8);

        doc.text(
            `Halaman ${i} dari ${totalPages}`,
            260,
            200
        );
    }

    const tanggal = new Date().toISOString().slice(0, 10);

    doc.save(`COA_${tanggal}.pdf`);
}

/* ==========================
   AUTO LOAD
========================== */

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", loadCOA);
} else {
    loadCOA();
}