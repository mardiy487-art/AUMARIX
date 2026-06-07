/* =====================================================
   AUMARIX ACCOUNTING SYSTEM
   FILE : aruskas.js
===================================================== */

let arusKasData = null;

/* ==========================================
   LOAD ARUS KAS
========================================== */

async function loadArusKas() {

    try {

        showLoading();

        const tanggalAwal =
            document.getElementById("tanggalAwalArusKas")?.value || "";

        const tanggalAkhir =
            document.getElementById("tanggalAkhirArusKas")?.value || "";

        if (
            tanggalAwal &&
            tanggalAkhir &&
            new Date(tanggalAwal) > new Date(tanggalAkhir)
        ) {
            throw new Error(
                "Tanggal awal tidak boleh lebih besar dari tanggal akhir"
            );
        }

        const res =
            await apiPost(
                "getArusKas",
                {
                    tanggalAwal,
                    tanggalAkhir
                }
            );

        if (!res.success) {
            throw new Error(
                res.message ||
                "Gagal memuat laporan arus kas"
            );
        }

        arusKasData =
            res.data;

        renderArusKas(
            res.data
        );

    } catch (err) {

        console.error(err);

        [
            "saldoAwalKasDetail",
            "operasiContainer",
            "investasiContainer",
            "pendanaanContainer"
        ].forEach(id => {

            const el =
                document.getElementById(id);

            if (el) {
                el.innerHTML = `
                    <div class="error-box">
                        ❌ ${err.message || err}
                    </div>
                `;
            }

        });

    } finally {

        hideLoading();

    }

}

/* ==========================================
   FORMAT
========================================== */

function rupiahArusKas(value) {

    if (typeof rupiah === "function") {
        return rupiah(value);
    }

    return Number(value || 0)
        .toLocaleString(
            "id-ID",
            {
                style: "currency",
                currency: "IDR",
                maximumFractionDigits: 0
            }
        );

}

function tanggalArusKas(value) {

    if (!value) {
        return "-";
    }

    const d =
        new Date(value);

    if (
        isNaN(
            d.getTime()
        )
    ) {
        return value;
    }

    return d.toLocaleString(
        "id-ID"
    );

}

function nilaiArusKas(value) {

    const angka =
        Number(value || 0);

    if (angka < 0) {
        return "(" + rupiahArusKas(Math.abs(angka)) + ")";
    }

    return rupiahArusKas(angka);

}

function escapeHTMLArusKas(value) {

    return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");

}

/* ==========================================
   SET TEXT
========================================== */

function setArusKasText(id, value) {

    const el =
        document.getElementById(id);

    if (el) {
        el.innerHTML = value;
    }

}

/* ==========================================
   RENDER UTAMA
========================================== */

function renderArusKas(data) {

    if (!data) {
        return;
    }

    const periodeText =
        data.tanggalAwal || data.tanggalAkhir
            ? `Periode : ${data.tanggalAwal || "-"} s/d ${data.tanggalAkhir || "-"}`
            : "Periode : Semua Data";

    setArusKasText(
        "periodeArusKas",
        periodeText
    );

    setArusKasText(
        "saldoAwalKas",
        rupiahArusKas(data.saldoAwal)
    );

    setArusKasText(
        "kenaikanKas",
        nilaiArusKas(data.kenaikanKas)
    );

    setArusKasText(
        "saldoAkhirKas",
        rupiahArusKas(data.saldoAkhir)
    );

    setArusKasText(
        "totalOperasi",
        nilaiArusKas(data.totalOperasi)
    );

    setArusKasText(
        "totalInvestasi",
        nilaiArusKas(data.totalInvestasi)
    );

    setArusKasText(
        "totalPendanaan",
        nilaiArusKas(data.totalPendanaan)
    );

    setArusKasText(
        "totalMasuk",
        rupiahArusKas(data.totalMasuk)
    );

    setArusKasText(
        "totalKeluar",
        rupiahArusKas(data.totalKeluar)
    );

    setArusKasText(
        "jumlahTransaksiArusKas",
        data.jumlahTransaksi || 0
    );

    setArusKasText(
        "tanggalCetakArusKas",
        tanggalArusKas(data.tanggalCetak)
    );

    renderSaldoAwalKasDetail(
        data.saldoAwalDetail || [],
        data.saldoAwal || 0
    );

    renderArusKasSection(
        "operasiContainer",
        data.operasi || [],
        data.totalOperasi || 0
    );

    renderArusKasSection(
        "investasiContainer",
        data.investasi || [],
        data.totalInvestasi || 0
    );

    renderArusKasSection(
        "pendanaanContainer",
        data.pendanaan || [],
        data.totalPendanaan || 0
    );

}

/* ==========================================
   RENDER SALDO AWAL KAS DETAIL
========================================== */

function renderSaldoAwalKasDetail(
    rows,
    total
) {

    const container =
        document.getElementById("saldoAwalKasDetail");

    if (!container) {
        return;
    }

    let html = "";

    if (
        !rows ||
        rows.length === 0
    ) {

        html += `
            <div class="cash-row empty-row">
                <div>Tidak ada data saldo awal kas</div>
                <div>-</div>
            </div>
        `;

    } else {

        rows.forEach(item => {

            html += `

                <div class="cash-row">

                    <div>
                        <div>
                            <strong>
                                ${escapeHTMLArusKas(item.namaAkun || "")}
                            </strong>
                        </div>

                        <small>
                            ${escapeHTMLArusKas(item.kodeAkun || "")}
                        </small>
                    </div>

                    <div class="cash-in">
                        ${rupiahArusKas(item.saldo)}
                    </div>

                </div>

            `;

        });

    }

    html += `

        <div class="cash-total">

            <span>
                Total Saldo Awal Kas dan Bank
            </span>

            <span>
                ${rupiahArusKas(total)}
            </span>

        </div>

    `;

    container.innerHTML =
        html;

}

/* ==========================================
   RENDER SECTION
========================================== */

function renderArusKasSection(
    target,
    rows,
    total
) {

    const container =
        document.getElementById(target);

    if (!container) {
        return;
    }

    let html = "";

    if (
        !rows ||
        rows.length === 0
    ) {

        html += `
            <div class="cash-row empty-row">
                <div>Tidak ada data</div>
                <div>-</div>
            </div>
        `;

    } else {

        rows.forEach(item => {

            const isMasuk =
                item.tipe === "MASUK";

            html += `

                <div class="cash-row">

                    <div>
                        <div>
                            <strong>
                                ${escapeHTMLArusKas(item.keterangan || item.namaAkun || "")}
                            </strong>
                        </div>

                        <small>
                            ${escapeHTMLArusKas(item.bukti || "")}
                            ${
                                item.kelompok
                                    ? " | " + escapeHTMLArusKas(item.kelompok)
                                    : ""
                            }
                        </small>
                    </div>

                    <div class="${
                        isMasuk
                            ? "cash-in"
                            : "cash-out"
                    }">
                        ${
                            isMasuk
                                ? rupiahArusKas(item.nominal)
                                : "(" + rupiahArusKas(item.nominal) + ")"
                        }
                    </div>

                </div>

            `;

        });

    }

    html += `

        <div class="cash-total">

            <span>
                Kas Bersih
            </span>

            <span>
                ${nilaiArusKas(total)}
            </span>

        </div>

    `;

    container.innerHTML =
        html;

}

/* ==========================================
   RESET
========================================== */

function resetArusKas() {

    const awal =
        document.getElementById("tanggalAwalArusKas");

    const akhir =
        document.getElementById("tanggalAkhirArusKas");

    if (awal) {
        awal.value = "";
    }

    if (akhir) {
        akhir.value = "";
    }

    loadArusKas();

}

/* ==========================================
   EXPORT EXCEL
========================================== */

function exportArusKasExcel() {

    if (!arusKasData) {
        alert(
            "Silakan tampilkan laporan terlebih dahulu"
        );
        return;
    }

    const rows = [];

    rows.push({
        Aktivitas: "Rincian Saldo Awal Kas dan Bank",
        Bukti: "",
        Keterangan: "",
        Tipe: "",
        Nominal: ""
    });

    (arusKasData.saldoAwalDetail || []).forEach(item => {

        rows.push({
            Aktivitas: "",
            Bukti: item.kodeAkun || "",
            Keterangan: item.namaAkun || "",
            Tipe: "SALDO AWAL",
            Nominal: Number(item.saldo || 0)
        });

    });

    rows.push({
        Aktivitas: "",
        Bukti: "",
        Keterangan: "Total Saldo Awal Kas dan Bank",
        Tipe: "",
        Nominal: Number(arusKasData.saldoAwal || 0)
    });

    rows.push({
        Aktivitas: "",
        Bukti: "",
        Keterangan: "",
        Tipe: "",
        Nominal: ""
    });

    pushArusKasExcelSection(
        rows,
        "Aktivitas Operasi",
        arusKasData.operasi || [],
        arusKasData.totalOperasi || 0
    );

    pushArusKasExcelSection(
        rows,
        "Aktivitas Investasi",
        arusKasData.investasi || [],
        arusKasData.totalInvestasi || 0
    );

    pushArusKasExcelSection(
        rows,
        "Aktivitas Pendanaan",
        arusKasData.pendanaan || [],
        arusKasData.totalPendanaan || 0
    );

    rows.push({
        Aktivitas: "Kenaikan / Penurunan Kas",
        Bukti: "",
        Keterangan: "",
        Tipe: "",
        Nominal: Number(arusKasData.kenaikanKas || 0)
    });

    rows.push({
        Aktivitas: "Saldo Akhir Kas dan Bank",
        Bukti: "",
        Keterangan: "",
        Tipe: "",
        Nominal: Number(arusKasData.saldoAkhir || 0)
    });

    const ws =
        XLSX.utils.json_to_sheet(
            rows
        );

    const wb =
        XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(
        wb,
        ws,
        "Arus Kas"
    );

    XLSX.writeFile(
        wb,
        `Laporan_Arus_Kas_${
            new Date()
                .toISOString()
                .slice(0,10)
        }.xlsx`
    );

}

function pushArusKasExcelSection(
    rows,
    title,
    data,
    total
) {

    rows.push({
        Aktivitas: title,
        Bukti: "",
        Keterangan: "",
        Tipe: "",
        Nominal: ""
    });

    if (
        data &&
        data.length
    ) {

        data.forEach(item => {

            rows.push({
                Aktivitas: "",
                Bukti: item.bukti || "",
                Keterangan: item.keterangan || item.namaAkun || "",
                Tipe: item.tipe || "",
                Nominal:
                    item.tipe === "KELUAR"
                        ? -Number(item.nominal || 0)
                        : Number(item.nominal || 0)
            });

        });

    }

    rows.push({
        Aktivitas: "",
        Bukti: "",
        Keterangan: "Kas Bersih " + title,
        Tipe: "",
        Nominal: Number(total || 0)
    });

    rows.push({
        Aktivitas: "",
        Bukti: "",
        Keterangan: "",
        Tipe: "",
        Nominal: ""
    });

}

/* ==========================================
   EXPORT PDF
========================================== */

async function exportArusKasPDF() {

    try {

        if (!arusKasData) {
            alert(
                "Silakan tampilkan laporan terlebih dahulu"
            );
            return;
        }

        const { jsPDF } =
            window.jspdf;

        const pdf =
            new jsPDF(
                "p",
                "mm",
                "a4"
            );

        let y = 15;

        pdf.setFillColor(
            37,
            99,
            235
        );

        pdf.rect(
            0,
            0,
            210,
            26,
            "F"
        );

        pdf.setTextColor(
            255,
            255,
            255
        );

        pdf.setFontSize(17);

        pdf.setFont(
            "helvetica",
            "bold"
        );

        pdf.text(
            "AUMARIX ACCOUNTING SYSTEM",
            15,
            12
        );

        pdf.setFontSize(11);

        pdf.text(
            "Laporan Arus Kas",
            15,
            20
        );

        y = 38;

        pdf.setTextColor(
            0,
            0,
            0
        );

        pdf.setFontSize(10);

        pdf.text(
            `Periode : ${arusKasData.tanggalAwal || "-"} s/d ${arusKasData.tanggalAkhir || "-"}`,
            15,
            y
        );

        y += 10;

        function checkPage() {

            if (y > 270) {
                pdf.addPage();
                y = 20;
            }

        }

        function addRow(label, value, bold = false) {

            checkPage();

            pdf.setFont(
                "helvetica",
                bold ? "bold" : "normal"
            );

            const split =
                pdf.splitTextToSize(
                    label,
                    120
                );

            pdf.text(
                split,
                25,
                y
            );

            pdf.text(
                value,
                185,
                y,
                {
                    align: "right"
                }
            );

            y +=
                Math.max(
                    8,
                    split.length * 5
                );

        }

        function saldoAwalSection() {

            checkPage();

            pdf.setFillColor(
                30,
                41,
                59
            );

            pdf.rect(
                15,
                y,
                180,
                8,
                "F"
            );

            pdf.setTextColor(
                255,
                255,
                255
            );

            pdf.setFont(
                "helvetica",
                "bold"
            );

            pdf.text(
                "RINCIAN SALDO AWAL KAS DAN BANK",
                20,
                y + 5.5
            );

            y += 13;

            pdf.setTextColor(
                0,
                0,
                0
            );

            const rows =
                arusKasData.saldoAwalDetail || [];

            if (rows.length === 0) {

                addRow(
                    "Tidak ada data saldo awal kas",
                    "-",
                    false
                );

            } else {

                rows.forEach(item => {

                    addRow(
                        `${item.kodeAkun || ""} - ${item.namaAkun || ""}`,
                        rupiahArusKas(item.saldo),
                        false
                    );

                });

            }

            addRow(
                "TOTAL SALDO AWAL KAS DAN BANK",
                rupiahArusKas(arusKasData.saldoAwal),
                true
            );

            y += 4;

        }

        function section(title, rows, total) {

            checkPage();

            pdf.setFillColor(
                30,
                41,
                59
            );

            pdf.rect(
                15,
                y,
                180,
                8,
                "F"
            );

            pdf.setTextColor(
                255,
                255,
                255
            );

            pdf.setFont(
                "helvetica",
                "bold"
            );

            pdf.text(
                title,
                20,
                y + 5.5
            );

            y += 13;

            pdf.setTextColor(
                0,
                0,
                0
            );

            pdf.setFont(
                "helvetica",
                "normal"
            );

            if (!rows || rows.length === 0) {

                addRow(
                    "Tidak ada data",
                    "-",
                    false
                );

            } else {

                rows.forEach(item => {

                    const label =
                        `${item.bukti || ""} - ${item.keterangan || item.namaAkun || ""}`;

                    addRow(
                        label,
                        item.tipe === "MASUK"
                            ? rupiahArusKas(item.nominal)
                            : "(" + rupiahArusKas(item.nominal) + ")",
                        false
                    );

                });

            }

            addRow(
                "KAS BERSIH",
                nilaiArusKas(total),
                true
            );

            y += 4;

        }

        saldoAwalSection();

        section(
            "AKTIVITAS OPERASI",
            arusKasData.operasi || [],
            arusKasData.totalOperasi || 0
        );

        section(
            "AKTIVITAS INVESTASI",
            arusKasData.investasi || [],
            arusKasData.totalInvestasi || 0
        );

        section(
            "AKTIVITAS PENDANAAN",
            arusKasData.pendanaan || [],
            arusKasData.totalPendanaan || 0
        );

        addRow(
            "KENAIKAN / PENURUNAN KAS",
            nilaiArusKas(arusKasData.kenaikanKas),
            true
        );

        addRow(
            "SALDO AKHIR KAS DAN BANK",
            rupiahArusKas(arusKasData.saldoAkhir),
            true
        );

        const pages =
            pdf.internal.getNumberOfPages();

        for (let i = 1; i <= pages; i++) {

            pdf.setPage(i);

            pdf.setFontSize(8);

            pdf.setTextColor(
                120,
                120,
                120
            );

            pdf.text(
                `Generated by AUMARIX Accounting System | Page ${i} of ${pages}`,
                15,
                290
            );

        }

        pdf.save(
            `Laporan_Arus_Kas_${
                new Date()
                    .toISOString()
                    .slice(0,10)
            }.pdf`
        );

    } catch (err) {

        console.error(err);

        alert(
            "Gagal export PDF"
        );

    }

}

/* ==========================================
   AUTO LOAD
========================================== */

document.addEventListener(
    "DOMContentLoaded",
    () => {

        if (
            document.getElementById("operasiContainer") &&
            typeof loadArusKas === "function"
        ) {
            loadArusKas();
        }

    }
);