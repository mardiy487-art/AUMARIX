/* =====================================================
   AUMARIX ACCOUNTING SYSTEM
   FILE : neraca.js
===================================================== */

let neracaData = null;

/* ==========================================
   LOAD NERACA
========================================== */

async function loadNeraca() {

    try {

        showLoading();

        const tanggalAwal =
            document.getElementById("tanggalAwalNeraca")?.value || "";

        const tanggalAkhir =
            document.getElementById("tanggalAkhirNeraca")?.value || "";

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
                "getNeraca",
                {
                    tanggalAwal,
                    tanggalAkhir
                }
            );

        if (!res.success) {
            throw new Error(
                res.message ||
                "Gagal memuat laporan neraca"
            );
        }

        neracaData =
            res.data;

        renderNeraca(
            res.data
        );

    } catch(err) {

        console.error(err);

        const aktiva =
            document.getElementById("aktivaContent");

        const passiva =
            document.getElementById("passivaContent");

        if (aktiva) {
            aktiva.innerHTML = `
                <div class="error-box">
                    ❌ ${err.message || err}
                </div>
            `;
        }

        if (passiva) {
            passiva.innerHTML = `
                <div class="error-box">
                    ❌ ${err.message || err}
                </div>
            `;
        }

    } finally {

        hideLoading();

    }

}

/* ==========================================
   FORMAT
========================================== */

function rupiahNeraca(value) {

    if (
        typeof rupiah === "function"
    ) {
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

function persenNeraca(value) {

    return Number(value || 0)
        .toFixed(2) + " %";

}

function angkaNeraca(value) {

    return Number(value || 0)
        .toFixed(2);

}

function tanggalNeraca(value) {

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

/* ==========================================
   RESET
========================================== */

function resetNeraca() {

    const awal =
        document.getElementById("tanggalAwalNeraca");

    const akhir =
        document.getElementById("tanggalAkhirNeraca");

    if (awal) {
        awal.value = "";
    }

    if (akhir) {
        akhir.value = "";
    }

    loadNeraca();

}

/* ==========================================
   HELPER SET TEXT
========================================== */

function setNeracaText(
    id,
    value
) {

    const el =
        document.getElementById(id);

    if (el) {
        el.innerHTML = value;
    }

}

/* ==========================================
   RENDER NERACA
========================================== */

function renderNeraca(data) {

    if (!data) {
        return;
    }

    const periodeText =
        data.tanggalAwal || data.tanggalAkhir
            ? `Periode : ${data.tanggalAwal || "-"} s/d ${data.tanggalAkhir || "-"}`
            : "Periode : Semua Data";

    setNeracaText(
        "periodeNeraca",
        periodeText
    );

    setNeracaText(
        "totalAktiva",
        rupiahNeraca(data.totalAktiva)
    );

    setNeracaText(
        "totalPassiva",
        rupiahNeraca(data.totalPassiva)
    );

    setNeracaText(
        "statusNeraca",
        data.seimbang
            ? "🟢 SEIMBANG"
            : "🔴 TIDAK SEIMBANG"
    );

    setNeracaText(
        "selisihNeraca",
        rupiahNeraca(data.selisihNeraca)
    );

    setNeracaText(
        "currentRatio",
        angkaNeraca(data.currentRatio)
    );

    setNeracaText(
        "debtRatio",
        persenNeraca(data.debtRatio)
    );

    setNeracaText(
        "equityRatio",
        persenNeraca(data.equityRatio)
    );

    setNeracaText(
        "modalKerja",
        rupiahNeraca(data.modalKerja)
    );

    setNeracaText(
        "tingkatKesehatan",
        data.tingkatKesehatan || "-"
    );

    setNeracaText(
        "jumlahAkunNeraca",
        data.jumlahAkunNeraca || 0
    );

    setNeracaText(
        "jumlahAktiva",
        data.jumlahAktiva || 0
    );

    setNeracaText(
        "tanggalCetakNeraca",
        tanggalNeraca(data.tanggalCetak)
    );

    renderAktiva(data);
    renderPassiva(data);

}

/* ==========================================
   RENDER SECTION
========================================== */

function renderNeracaSection(
    title,
    rows,
    total
) {

    let html = `
        <div class="group-title">
            ${title}
        </div>
    `;

    if (
        !rows ||
        rows.length === 0
    ) {

        html += `
            <div class="row empty-row">
                <span>Tidak ada data</span>
                <span>-</span>
            </div>
        `;

    } else {

        rows.forEach(item => {

            html += `
                <div class="row">
                    <span>
                        <strong>${item.kodeAkun || ""}</strong>
                        ${item.namaAkun || ""}
                    </span>

                    <span>
                        ${rupiahNeraca(item.saldo)}
                    </span>
                </div>
            `;

        });

    }

    html += `
        <div class="total-row">
            <span>Total ${title}</span>
            <span>${rupiahNeraca(total)}</span>
        </div>
    `;

    return html;

}

/* ==========================================
   AKTIVA
========================================== */

function renderAktiva(data) {

    let html = "";

    html += renderNeracaSection(
        "Aset Lancar",
        data.asetLancar,
        data.totalAsetLancar
    );

    html += renderNeracaSection(
        "Aset Tetap",
        data.asetTetap,
        data.totalAsetTetap
    );

    html += renderNeracaSection(
        "Akumulasi Penyusutan",
        data.akumulasiPenyusutan,
        data.totalAkumulasi
    );

    html += `
        <div class="grand-total">
            <span>TOTAL AKTIVA</span>
            <span>${rupiahNeraca(data.totalAktiva)}</span>
        </div>
    `;

    setNeracaText(
        "aktivaContent",
        html
    );

}

/* ==========================================
   PASSIVA
========================================== */

function renderPassiva(data) {

    let html = "";

    html += renderNeracaSection(
        "Kewajiban Lancar",
        data.kewajibanLancar,
        data.totalKewajibanLancar
    );

    html += renderNeracaSection(
        "Kewajiban Jangka Panjang",
        data.kewajibanJangkaPanjang,
        data.totalKewajibanJangkaPanjang
    );

    html += `
        <div class="group-title">
            Ekuitas / Modal
        </div>

        <div class="row">
            <span>Modal Akhir</span>
            <span>${rupiahNeraca(data.modalAkhir)}</span>
        </div>

        <div class="total-row">
            <span>Total Ekuitas</span>
            <span>${rupiahNeraca(data.modalAkhir)}</span>
        </div>

        <div class="grand-total">
            <span>TOTAL PASSIVA</span>
            <span>${rupiahNeraca(data.totalPassiva)}</span>
        </div>
    `;

    setNeracaText(
        "passivaContent",
        html
    );

}

/* ==========================================
   EXPORT EXCEL
========================================== */

function exportNeracaExcel() {

    if (!neracaData) {
        alert(
            "Silakan tampilkan laporan terlebih dahulu"
        );
        return;
    }

    const rows = [];

    function pushSection(
        title,
        data,
        total
    ) {

        rows.push({
            Kelompok: title,
            Akun: "",
            Saldo: ""
        });

        if (
            data &&
            data.length
        ) {
            data.forEach(item => {
                rows.push({
                    Kelompok: "",
                    Akun: `${item.kodeAkun || ""} ${item.namaAkun || ""}`,
                    Saldo: Number(item.saldo || 0)
                });
            });
        }

        rows.push({
            Kelompok: "",
            Akun: "Total " + title,
            Saldo: Number(total || 0)
        });

        rows.push({
            Kelompok: "",
            Akun: "",
            Saldo: ""
        });

    }

    pushSection(
        "Aset Lancar",
        neracaData.asetLancar,
        neracaData.totalAsetLancar
    );

    pushSection(
        "Aset Tetap",
        neracaData.asetTetap,
        neracaData.totalAsetTetap
    );

    pushSection(
        "Akumulasi Penyusutan",
        neracaData.akumulasiPenyusutan,
        neracaData.totalAkumulasi
    );

    rows.push({
        Kelompok: "",
        Akun: "TOTAL AKTIVA",
        Saldo: Number(neracaData.totalAktiva || 0)
    });

    rows.push({
        Kelompok: "",
        Akun: "",
        Saldo: ""
    });

    pushSection(
        "Kewajiban Lancar",
        neracaData.kewajibanLancar,
        neracaData.totalKewajibanLancar
    );

    pushSection(
        "Kewajiban Jangka Panjang",
        neracaData.kewajibanJangkaPanjang,
        neracaData.totalKewajibanJangkaPanjang
    );

    rows.push({
        Kelompok: "Ekuitas / Modal",
        Akun: "Modal Akhir",
        Saldo: Number(neracaData.modalAkhir || 0)
    });

    rows.push({
        Kelompok: "",
        Akun: "TOTAL PASSIVA",
        Saldo: Number(neracaData.totalPassiva || 0)
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
        "Neraca"
    );

    XLSX.writeFile(
        wb,
        `Laporan_Neraca_${
            new Date()
            .toISOString()
            .slice(0,10)
        }.xlsx`
    );

}

/* ==========================================
   EXPORT PDF
========================================== */

async function exportNeracaPDF() {

    try {

        if (!neracaData) {
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
            "Laporan Neraca",
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
            `Periode : ${neracaData.tanggalAwal || "-"} s/d ${neracaData.tanggalAkhir || "-"}`,
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

        function section(
            title,
            rows,
            total
        ) {

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

            if (
                !rows ||
                rows.length === 0
            ) {

                pdf.text(
                    "Tidak ada data",
                    25,
                    y
                );

                pdf.text(
                    "-",
                    185,
                    y,
                    {
                        align: "right"
                    }
                );

                y += 8;

            } else {

                rows.forEach(item => {

                    checkPage();

                    pdf.text(
                        `${item.kodeAkun || ""} ${item.namaAkun || ""}`,
                        25,
                        y
                    );

                    pdf.text(
                        rupiahNeraca(item.saldo),
                        185,
                        y,
                        {
                            align: "right"
                        }
                    );

                    y += 8;

                });

            }

            pdf.setFont(
                "helvetica",
                "bold"
            );

            pdf.text(
                "TOTAL " + title.toUpperCase(),
                25,
                y
            );

            pdf.text(
                rupiahNeraca(total),
                185,
                y,
                {
                    align: "right"
                }
            );

            y += 12;

        }

        section(
            "ASET LANCAR",
            neracaData.asetLancar,
            neracaData.totalAsetLancar
        );

        section(
            "ASET TETAP",
            neracaData.asetTetap,
            neracaData.totalAsetTetap
        );

        section(
            "AKUMULASI PENYUSUTAN",
            neracaData.akumulasiPenyusutan,
            neracaData.totalAkumulasi
        );

        pdf.setFont(
            "helvetica",
            "bold"
        );

        pdf.text(
            "TOTAL AKTIVA",
            25,
            y
        );

        pdf.text(
            rupiahNeraca(
                neracaData.totalAktiva
            ),
            185,
            y,
            {
                align: "right"
            }
        );

        y += 14;

        section(
            "KEWAJIBAN LANCAR",
            neracaData.kewajibanLancar,
            neracaData.totalKewajibanLancar
        );

        section(
            "KEWAJIBAN JANGKA PANJANG",
            neracaData.kewajibanJangkaPanjang,
            neracaData.totalKewajibanJangkaPanjang
        );

        checkPage();

        pdf.setFont(
            "helvetica",
            "bold"
        );

        pdf.text(
            "EKUITAS / MODAL",
            25,
            y
        );

        y += 8;

        pdf.setFont(
            "helvetica",
            "normal"
        );

        pdf.text(
            "Modal Akhir",
            25,
            y
        );

        pdf.text(
            rupiahNeraca(
                neracaData.modalAkhir
            ),
            185,
            y,
            {
                align: "right"
            }
        );

        y += 12;

        pdf.setFillColor(
            neracaData.seimbang ? 22 : 220,
            neracaData.seimbang ? 163 : 38,
            neracaData.seimbang ? 74 : 38
        );

        pdf.rect(
            15,
            y,
            180,
            12,
            "F"
        );

        pdf.setTextColor(
            255,
            255,
            255
        );

        pdf.setFontSize(13);

        pdf.setFont(
            "helvetica",
            "bold"
        );

        pdf.text(
            "TOTAL PASSIVA",
            20,
            y + 8
        );

        pdf.text(
            rupiahNeraca(
                neracaData.totalPassiva
            ),
            185,
            y + 8,
            {
                align: "right"
            }
        );

        pdf.setFontSize(8);

        pdf.setTextColor(
            120,
            120,
            120
        );

        pdf.text(
            "Generated by AUMARIX Accounting System",
            15,
            290
        );

        pdf.save(
            `Laporan_Neraca_${
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