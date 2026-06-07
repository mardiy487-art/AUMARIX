/* =====================================================
   AUMARIX ACCOUNTING SYSTEM
   FILE : labarugi.js
===================================================== */

let labaRugiData = null;

/* ==========================================
   LOAD LABA RUGI
========================================== */

async function loadLabaRugi() {
    try {
        showLoading();

        const tanggalAwal =
            document.getElementById("tanggalAwalLabaRugi")?.value || "";

        const tanggalAkhir =
            document.getElementById("tanggalAkhirLabaRugi")?.value || "";

        if (
            tanggalAwal &&
            tanggalAkhir &&
            new Date(tanggalAwal) > new Date(tanggalAkhir)
        ) {
            throw new Error("Tanggal awal tidak boleh lebih besar dari tanggal akhir");
        }

        const res = await apiPost("getLabaRugi", {
            tanggalAwal: tanggalAwal,
            tanggalAkhir: tanggalAkhir
        });

        if (!res.success) {
            throw new Error(res.message || "Gagal memuat laporan laba rugi");
        }

        renderLabaRugi(res.data);

    } catch (err) {
        console.error(err);

        document.getElementById("labarugiContent").innerHTML = `
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

function rupiahLR(value) {
    return Number(value || 0).toLocaleString("id-ID", {
        style: "currency",
        currency: "IDR",
        maximumFractionDigits: 0
    });
}

function persenLR(value) {
    return Number(value || 0).toFixed(2) + " %";
}

function tanggalLR(value) {
    if (!value) return "-";

    const d = new Date(value);

    if (isNaN(d.getTime())) {
        return value;
    }

    return d.toLocaleDateString("id-ID", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric"
    });
}

/* ==========================================
   RESET
========================================== */

function resetLabaRugi() {
    const awal = document.getElementById("tanggalAwalLabaRugi");
    const akhir = document.getElementById("tanggalAkhirLabaRugi");

    if (awal) awal.value = "";
    if (akhir) akhir.value = "";

    loadLabaRugi();
}

/* ==========================================
   TOTAL SALDO
========================================== */

function getTotalSaldo(data) {
    if (!Array.isArray(data)) return 0;

    return data.reduce((total, row) => {
        return total + Number(row.saldo || 0);
    }, 0);
}

/* ==========================================
   RENDER SECTION
========================================== */

function renderSection(title, data, total) {
    let html = `
        <div class="lr-section">
            <div class="section-header">
                ${title}
            </div>
    `;

    if (!data || data.length === 0) {
        html += `
            <div class="lr-row empty-row">
                <div>Tidak ada data</div>
                <div>-</div>
            </div>
        `;
    } else {
        data.forEach(row => {
            html += `
                <div class="lr-row">
                    <div>
                        <span class="akun-kode">${row.kodeAkun || ""}</span>
                        ${row.namaAkun || ""}
                    </div>

                    <div>
                        ${rupiahLR(row.saldo)}
                    </div>
                </div>
            `;
        });
    }

    html += `
            <div class="lr-total">
                <span>TOTAL</span>
                <span>${rupiahLR(total)}</span>
            </div>
        </div>
    `;

    return html;
}

/* ==========================================
   RENDER LABA RUGI
========================================== */

function renderLabaRugi(data) {
    labaRugiData = data;

    if (!data) {
        document.getElementById("labarugiContent").innerHTML = `
            <div class="error-box">
                Data laporan laba rugi kosong
            </div>
        `;
        return;
    }

    /* =========================
       SUMMARY
    ========================= */

    document.getElementById("summaryPenjualan").innerHTML =
        rupiahLR(data.penjualanBersih);

    document.getElementById("summaryLabaKotor").innerHTML =
        rupiahLR(data.labaKotor);

    document.getElementById("summaryBeban").innerHTML =
        rupiahLR(data.totalBeban);

    document.getElementById("summaryLabaBersih").innerHTML =
        rupiahLR(data.labaBersih);

    document.getElementById("marginKotor").innerHTML =
        persenLR(data.marginKotor);

    document.getElementById("marginBersih").innerHTML =
        persenLR(data.marginBersih);

    document.getElementById("jumlahAkunLabaRugi").innerHTML =
        data.jumlahAkunLabaRugi || 0;

    document.getElementById("tanggalCetak").innerHTML =
        new Date(data.tanggalCetak).toLocaleString("id-ID");

    /* =========================
       PERIODE
    ========================= */

    const periodeEl = document.getElementById("periodeLabaRugi");

    if (periodeEl) {
        if (data.tanggalAwal || data.tanggalAkhir) {
            periodeEl.innerHTML =
                `Periode : ${data.tanggalAwal || "-"} s/d ${data.tanggalAkhir || "-"}`;
        } else {
            periodeEl.innerHTML = "Periode : Semua Data";
        }
    }

    /* =========================
       STATUS
    ========================= */

    const statusEl = document.getElementById("statusLabaRugi");

    if (statusEl) {
        statusEl.innerHTML =
            data.statusLabaRugi === "LABA"
                ? "🟢 LABA"
                : "🔴 RUGI";

        statusEl.className =
            data.statusLabaRugi === "LABA"
                ? "summary-value badge-success"
                : "summary-value badge-danger";
    }

    /* =========================
       DETAIL LAPORAN
    ========================= */

    let html = "";

    html += renderSection(
        "PENDAPATAN",
        data.penjualan,
        data.totalPenjualan
    );

    html += renderSection(
        "RETUR PENJUALAN",
        data.returPenjualan,
        data.totalRetur
    );

    html += renderSection(
        "POTONGAN PENJUALAN",
        data.diskonPenjualan,
        data.totalDiskon
    );

    html += `
        <div class="lr-highlight">
            <span>PENJUALAN BERSIH</span>
            <span>${rupiahLR(data.penjualanBersih)}</span>
        </div>
    `;

    html += renderSection(
        "HARGA POKOK PENJUALAN",
        data.hpp,
        data.totalPembelian
    );

    html += renderSection(
        "POTONGAN PEMBELIAN",
        data.potonganPembelian,
        data.totalPotonganPembelian
    );

    html += `
        <div class="lr-highlight">
            <span>HPP BERSIH</span>
            <span>${rupiahLR(data.totalHPP)}</span>
        </div>
    `;

    html += `
        <div class="lr-highlight">
            <span>LABA KOTOR</span>
            <span>${rupiahLR(data.labaKotor)}</span>
        </div>
    `;

    html += renderSection(
        "BEBAN OPERASIONAL",
        data.bebanOperasional,
        data.totalBebanOperasional
    );

    html += renderSection(
        "BEBAN PENYUSUTAN",
        data.bebanPenyusutan,
        data.totalBebanPenyusutan
    );

    html += renderSection(
        "BEBAN PAJAK",
        data.bebanPajak,
        data.totalBebanPajak
    );

    html += `
        <div class="lr-highlight">
            <span>TOTAL BEBAN OPERASI</span>
            <span>${rupiahLR(data.totalBebanOperasi)}</span>
        </div>
    `;

    const classLaba =
        data.labaBersih >= 0
            ? "profit"
            : "loss";

    html += `
        <div class="lr-final ${classLaba}">
            <span>
                ${data.labaBersih >= 0 ? "LABA BERSIH" : "RUGI BERSIH"}
            </span>

            <span>
                ${rupiahLR(data.labaBersih)}
            </span>
        </div>
    `;

    document.getElementById("labarugiContent").innerHTML = html;
}

/* ==========================================
   EXPORT EXCEL
========================================== */

function exportLabaRugiExcel() {
    if (!labaRugiData) {
        alert("Silakan tampilkan laporan terlebih dahulu");
        return;
    }

    const rows = [];

    function pushSection(title, data, total) {
        rows.push({
            "Keterangan": title,
            "Saldo": ""
        });

        if (data && data.length) {
            data.forEach(row => {
                rows.push({
                    "Keterangan": `${row.kodeAkun || ""} ${row.namaAkun || ""}`,
                    "Saldo": Number(row.saldo || 0)
                });
            });
        }

        rows.push({
            "Keterangan": "TOTAL " + title,
            "Saldo": Number(total || 0)
        });

        rows.push({
            "Keterangan": "",
            "Saldo": ""
        });
    }

    pushSection("PENDAPATAN", labaRugiData.penjualan, labaRugiData.totalPenjualan);
    pushSection("RETUR PENJUALAN", labaRugiData.returPenjualan, labaRugiData.totalRetur);
    pushSection("POTONGAN PENJUALAN", labaRugiData.diskonPenjualan, labaRugiData.totalDiskon);

    rows.push({
        "Keterangan": "PENJUALAN BERSIH",
        "Saldo": Number(labaRugiData.penjualanBersih || 0)
    });

    pushSection("HARGA POKOK PENJUALAN", labaRugiData.hpp, labaRugiData.totalPembelian);
    pushSection("POTONGAN PEMBELIAN", labaRugiData.potonganPembelian, labaRugiData.totalPotonganPembelian);

    rows.push({
        "Keterangan": "HPP BERSIH",
        "Saldo": Number(labaRugiData.totalHPP || 0)
    });

    rows.push({
        "Keterangan": "LABA KOTOR",
        "Saldo": Number(labaRugiData.labaKotor || 0)
    });

    pushSection("BEBAN OPERASIONAL", labaRugiData.bebanOperasional, labaRugiData.totalBebanOperasional);
    pushSection("BEBAN PENYUSUTAN", labaRugiData.bebanPenyusutan, labaRugiData.totalBebanPenyusutan);
    pushSection("BEBAN PAJAK", labaRugiData.bebanPajak, labaRugiData.totalBebanPajak);

    rows.push({
        "Keterangan": "TOTAL BEBAN OPERASI",
        "Saldo": Number(labaRugiData.totalBebanOperasi || 0)
    });

    rows.push({
        "Keterangan": labaRugiData.labaBersih >= 0 ? "LABA BERSIH" : "RUGI BERSIH",
        "Saldo": Number(labaRugiData.labaBersih || 0)
    });

    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(
        wb,
        ws,
        "Laba Rugi"
    );

    XLSX.writeFile(
        wb,
        `Laporan_Laba_Rugi_${new Date().toISOString().slice(0,10)}.xlsx`
    );
}

/* ==========================================
   EXPORT PDF
========================================== */

async function exportLabaRugiPDF() {
    try {
        if (!labaRugiData) {
            alert("Silakan tampilkan laporan terlebih dahulu");
            return;
        }

        const { jsPDF } = window.jspdf;

        const pdf = new jsPDF("p", "mm", "a4");

        let y = 15;

        pdf.setFillColor(37, 99, 235);
        pdf.rect(0, 0, 210, 26, "F");

        pdf.setTextColor(255, 255, 255);
        pdf.setFontSize(17);
        pdf.setFont("helvetica", "bold");
        pdf.text("AUMARIX ACCOUNTING SYSTEM", 15, 12);

        pdf.setFontSize(11);
        pdf.text("Laporan Laba Rugi", 15, 20);

        y = 36;

        pdf.setTextColor(0, 0, 0);
        pdf.setFontSize(10);

        pdf.text(
            `Periode : ${labaRugiData.tanggalAwal || "-"} s/d ${labaRugiData.tanggalAkhir || "-"}`,
            15,
            y
        );

        y += 10;

        pdf.setFillColor(245, 247, 250);
        pdf.roundedRect(15, y, 180, 38, 3, 3, "F");

        pdf.text(`Penjualan Bersih : ${rupiahLR(labaRugiData.penjualanBersih)}`, 20, y + 8);
        pdf.text(`Laba Kotor : ${rupiahLR(labaRugiData.labaKotor)}`, 20, y + 16);
        pdf.text(`Total Beban : ${rupiahLR(labaRugiData.totalBeban)}`, 20, y + 24);
        pdf.text(`Laba Bersih : ${rupiahLR(labaRugiData.labaBersih)}`, 20, y + 32);

        y += 50;

        function checkPage() {
            if (y > 270) {
                pdf.addPage();
                y = 20;
            }
        }

        function section(title, rows, total) {
            checkPage();

            pdf.setFillColor(30, 41, 59);
            pdf.rect(15, y, 180, 8, "F");

            pdf.setTextColor(255, 255, 255);
            pdf.setFont("helvetica", "bold");
            pdf.text(title, 20, y + 5.5);

            y += 13;

            pdf.setTextColor(0, 0, 0);
            pdf.setFont("helvetica", "normal");

            if (!rows || rows.length === 0) {
                pdf.text("Tidak ada data", 25, y);
                pdf.text("-", 185, y, { align: "right" });
                y += 7;
            } else {
                rows.forEach(item => {
                    checkPage();

                    pdf.text(item.namaAkun || "", 25, y);
                    pdf.text(rupiahLR(item.saldo), 185, y, { align: "right" });

                    y += 7;
                });
            }

            pdf.setFont("helvetica", "bold");
            pdf.text("TOTAL", 25, y);
            pdf.text(rupiahLR(total), 185, y, { align: "right" });

            y += 12;
        }

        section("PENDAPATAN", labaRugiData.penjualan, labaRugiData.totalPenjualan);
        section("RETUR PENJUALAN", labaRugiData.returPenjualan, labaRugiData.totalRetur);
        section("POTONGAN PENJUALAN", labaRugiData.diskonPenjualan, labaRugiData.totalDiskon);

        pdf.setFont("helvetica", "bold");
        pdf.text("PENJUALAN BERSIH", 25, y);
        pdf.text(rupiahLR(labaRugiData.penjualanBersih), 185, y, { align: "right" });

        y += 12;

        section("HARGA POKOK PENJUALAN", labaRugiData.hpp, labaRugiData.totalPembelian);
        section("POTONGAN PEMBELIAN", labaRugiData.potonganPembelian, labaRugiData.totalPotonganPembelian);

        pdf.setFont("helvetica", "bold");
        pdf.text("HPP BERSIH", 25, y);
        pdf.text(rupiahLR(labaRugiData.totalHPP), 185, y, { align: "right" });

        y += 12;

        pdf.text("LABA KOTOR", 25, y);
        pdf.text(rupiahLR(labaRugiData.labaKotor), 185, y, { align: "right" });

        y += 12;

        section("BEBAN OPERASIONAL", labaRugiData.bebanOperasional, labaRugiData.totalBebanOperasional);
        section("BEBAN PENYUSUTAN", labaRugiData.bebanPenyusutan, labaRugiData.totalBebanPenyusutan);
        section("BEBAN PAJAK", labaRugiData.bebanPajak, labaRugiData.totalBebanPajak);

        checkPage();

        pdf.setFillColor(
            labaRugiData.labaBersih >= 0 ? 22 : 220,
            labaRugiData.labaBersih >= 0 ? 163 : 38,
            labaRugiData.labaBersih >= 0 ? 74 : 38
        );

        pdf.rect(15, y, 180, 12, "F");

        pdf.setTextColor(255, 255, 255);
        pdf.setFontSize(13);
        pdf.setFont("helvetica", "bold");

        pdf.text(
            labaRugiData.labaBersih >= 0 ? "LABA BERSIH" : "RUGI BERSIH",
            20,
            y + 8
        );

        pdf.text(
            rupiahLR(labaRugiData.labaBersih),
            185,
            y + 8,
            { align: "right" }
        );

        const pages = pdf.internal.getNumberOfPages();

        for (let i = 1; i <= pages; i++) {
            pdf.setPage(i);
            pdf.setFontSize(8);
            pdf.setTextColor(120, 120, 120);
            pdf.text(
                `Generated by AUMARIX Accounting System | Page ${i} of ${pages}`,
                15,
                290
            );
        }

        pdf.save(
            `Laporan_Laba_Rugi_${new Date().toISOString().slice(0,10)}.pdf`
        );

    } catch (err) {
        console.error(err);
        alert("Gagal export PDF");
    }
}