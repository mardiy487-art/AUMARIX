/* =====================================================
   AUMARIX ACCOUNTING SYSTEM
   FILE : perubahanmodal.js
===================================================== */

let perubahanModalData = null;

/* ==========================================
   LOAD PERUBAHAN MODAL
========================================== */

async function loadPerubahanModal() {

    try {

        showLoading();

        const tanggalAwal =
            document.getElementById("tanggalAwalPM")?.value || "";

        const tanggalAkhir =
            document.getElementById("tanggalAkhirPM")?.value || "";

        if (
            tanggalAwal &&
            tanggalAkhir &&
            new Date(tanggalAwal) > new Date(tanggalAkhir)
        ) {
            throw new Error("Tanggal awal tidak boleh lebih besar dari tanggal akhir");
        }

        const res =
            await apiPost(
                "getPerubahanModal",
                {
                    tanggalAwal,
                    tanggalAkhir
                }
            );

        if (!res.success) {
            throw new Error(res.message || "Gagal memuat laporan perubahan modal");
        }

        perubahanModalData = res.data;

        renderPerubahanModal(res.data);

    } catch (err) {

        console.error(err);

        document
            .getElementById("perubahanModalContent")
            .innerHTML = `
                <div class="error-box">
                    ❌ ${err.message || err}
                </div>
            `;

    } finally {

        hideLoading();

    }

}

/* ==========================================
   FORMAT
========================================== */

function rupiahPM(value) {
    if (typeof rupiah === "function") {
        return rupiah(value);
    }

    return Number(value || 0).toLocaleString("id-ID", {
        style: "currency",
        currency: "IDR",
        maximumFractionDigits: 0
    });
}

function persenPM(value) {
    return Number(value || 0).toFixed(2) + " %";
}

function tanggalPM(value) {
    if (!value) return "-";

    const d = new Date(value);

    if (isNaN(d.getTime())) {
        return value;
    }

    return d.toLocaleString("id-ID");
}

/* ==========================================
   RENDER DETAIL LIST
========================================== */

function renderDetailPM(title, rows) {

    let html = `
        <div class="pm-detail-section">
            <div class="pm-detail-title">
                ${title}
            </div>
    `;

    if (!rows || rows.length === 0) {

        html += `
            <div class="pm-detail-row empty-row">
                <span>Tidak ada data</span>
                <span>-</span>
            </div>
        `;

    } else {

        rows.forEach(row => {

            html += `
                <div class="pm-detail-row">
                    <span>
                        <strong>${row.kodeAkun || ""}</strong>
                        ${row.namaAkun || ""}
                    </span>

                    <span>
                        ${rupiahPM(row.saldo || 0)}
                    </span>
                </div>
            `;

        });

    }

    html += `
        </div>
    `;

    return html;

}

/* ==========================================
   RENDER
========================================== */

function renderPerubahanModal(data) {

    if (!data) {
        document.getElementById("perubahanModalContent").innerHTML = `
            <div class="error-box">
                Data perubahan modal kosong
            </div>
        `;
        return;
    }

    /* =========================
       PERIODE
    ========================= */

    const periodeEl =
        document.getElementById("periodePerubahanModal");

    if (periodeEl) {

        if (data.tanggalAwal || data.tanggalAkhir) {

            periodeEl.innerHTML =
                `Periode : ${data.tanggalAwal || "-"} s/d ${data.tanggalAkhir || "-"}`;

        } else {

            periodeEl.innerHTML =
                "Periode : Semua Data";

        }

    }

    /* =========================
       SUMMARY
    ========================= */

    document.getElementById("pmModalAwal").innerHTML =
        rupiahPM(data.modalAwal);

    document.getElementById("pmInvestasi").innerHTML =
        rupiahPM(data.investasiPemilik);

    document.getElementById("pmLabaBersih").innerHTML =
        rupiahPM(data.labaBersih);

    document.getElementById("pmPrive").innerHTML =
        rupiahPM(data.prive);

    document.getElementById("pmModalAkhir").innerHTML =
        rupiahPM(data.modalAkhir);

    document.getElementById("growthModal").innerHTML =
        persenPM(data.growthModal);

    document.getElementById("jumlahAkunEkuitas").innerHTML =
        data.jumlahAkunEkuitas || 0;

    document.getElementById("tanggalCetakPM").innerHTML =
        tanggalPM(data.tanggalCetak);

    /* =========================
       STATUS
    ========================= */

    const statusEl =
        document.getElementById("statusModal");

    if (statusEl) {

        statusEl.innerHTML =
            data.statusModal || "-";

        statusEl.className =
            data.statusModal === "MODAL NAIK"
                ? "pm-summary-value badge-success"
                : "pm-summary-value badge-danger";

    }

    /* =========================
       DETAIL
    ========================= */

    let html = "";

    html += renderDetailPM(
        "Detail Modal Awal",
        data.detailModalAwal
    );

    html += renderDetailPM(
        "Detail Investasi Pemilik",
        data.detailInvestasi
    );

    html += renderDetailPM(
        "Detail Prive",
        data.detailPrive
    );

    html += `
        <div class="pm-card">

            <div class="pm-row">
                <span>Modal Awal</span>
                <span>${rupiahPM(data.modalAwal)}</span>
            </div>

            <div class="pm-row">
                <span>(+) Investasi Pemilik</span>
                <span>${rupiahPM(data.investasiPemilik)}</span>
            </div>

            <div class="pm-row">
                <span>(+) Laba Bersih</span>
                <span>${rupiahPM(data.labaBersih)}</span>
            </div>

            <div class="pm-row minus">
                <span>(-) Prive</span>
                <span>${rupiahPM(data.prive)}</span>
            </div>

            <div class="pm-total">
                <span>MODAL AKHIR</span>
                <span>${rupiahPM(data.modalAkhir)}</span>
            </div>

        </div>
    `;

    document
        .getElementById("perubahanModalContent")
        .innerHTML = html;

}

/* ==========================================
   RESET
========================================== */

function resetPerubahanModal() {

    const awal =
        document.getElementById("tanggalAwalPM");

    const akhir =
        document.getElementById("tanggalAkhirPM");

    if (awal) awal.value = "";
    if (akhir) akhir.value = "";

    loadPerubahanModal();

}

/* ==========================================
   REFRESH
========================================== */

function refreshPerubahanModal() {

    loadPerubahanModal();

}

/* ==========================================
   EXPORT EXCEL
========================================== */

function exportPerubahanModalExcel() {

    if (!perubahanModalData) {
        alert("Silakan tampilkan laporan terlebih dahulu");
        return;
    }

    const data = [
        {
            Keterangan: "Modal Awal",
            Nilai: Number(perubahanModalData.modalAwal || 0)
        },
        {
            Keterangan: "Investasi Pemilik",
            Nilai: Number(perubahanModalData.investasiPemilik || 0)
        },
        {
            Keterangan: "Laba Bersih",
            Nilai: Number(perubahanModalData.labaBersih || 0)
        },
        {
            Keterangan: "Prive",
            Nilai: Number(perubahanModalData.prive || 0)
        },
        {
            Keterangan: "Modal Akhir",
            Nilai: Number(perubahanModalData.modalAkhir || 0)
        },
        {
            Keterangan: "Status Modal",
            Nilai: perubahanModalData.statusModal || "-"
        },
        {
            Keterangan: "Pertumbuhan Modal",
            Nilai: Number(perubahanModalData.growthModal || 0)
        }
    ];

    const ws =
        XLSX.utils.json_to_sheet(data);

    const wb =
        XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(
        wb,
        ws,
        "Perubahan Modal"
    );

    XLSX.writeFile(
        wb,
        `Perubahan_Modal_${new Date().toISOString().slice(0,10)}.xlsx`
    );

}

/* ==========================================
   EXPORT PDF
========================================== */

async function exportPerubahanModalPDF() {

    try {

        if (!perubahanModalData) {
            alert("Silakan tampilkan laporan terlebih dahulu");
            return;
        }

        const { jsPDF } =
            window.jspdf;

        const pdf =
            new jsPDF("p", "mm", "a4");

        let y = 15;

        pdf.setFillColor(37, 99, 235);
        pdf.rect(0, 0, 210, 26, "F");

        pdf.setTextColor(255, 255, 255);
        pdf.setFontSize(17);
        pdf.setFont("helvetica", "bold");
        pdf.text("AUMARIX ACCOUNTING SYSTEM", 15, 12);

        pdf.setFontSize(11);
        pdf.text("Laporan Perubahan Modal", 15, 20);

        y = 38;

        pdf.setTextColor(0, 0, 0);
        pdf.setFontSize(10);

        pdf.text(
            `Periode : ${perubahanModalData.tanggalAwal || "-"} s/d ${perubahanModalData.tanggalAkhir || "-"}`,
            15,
            y
        );

        y += 12;

        function row(label, value, bold = false) {

            if (bold) {
                pdf.setFont("helvetica", "bold");
            } else {
                pdf.setFont("helvetica", "normal");
            }

            pdf.text(label, 20, y);

            pdf.text(
                value,
                185,
                y,
                {
                    align: "right"
                }
            );

            y += 10;

        }

        row("Modal Awal", rupiahPM(perubahanModalData.modalAwal));
        row("(+) Investasi Pemilik", rupiahPM(perubahanModalData.investasiPemilik));
        row("(+) Laba Bersih", rupiahPM(perubahanModalData.labaBersih));
        row("(-) Prive", rupiahPM(perubahanModalData.prive));

        y += 4;

        pdf.setFillColor(30, 41, 59);
        pdf.rect(15, y - 7, 180, 12, "F");

        pdf.setTextColor(255, 255, 255);

        row(
            "MODAL AKHIR",
            rupiahPM(perubahanModalData.modalAkhir),
            true
        );

        y += 8;

        pdf.setTextColor(0, 0, 0);
        pdf.setFontSize(10);

        row("Status Modal", perubahanModalData.statusModal || "-");
        row("Pertumbuhan Modal", persenPM(perubahanModalData.growthModal));
        row("Jumlah Akun Ekuitas", String(perubahanModalData.jumlahAkunEkuitas || 0));

        pdf.setFontSize(8);
        pdf.setTextColor(120, 120, 120);

        pdf.text(
            "Generated by AUMARIX Accounting System",
            15,
            290
        );

        pdf.save(
            `Perubahan_Modal_${new Date().toISOString().slice(0,10)}.pdf`
        );

    } catch (err) {

        console.error(err);
        alert("Gagal export PDF");

    }

}