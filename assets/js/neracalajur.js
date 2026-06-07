/* =====================================================
   AUMARIX ACCOUNTING SYSTEM
   FILE : neracalajur.js
===================================================== */

/* =========================================
   LOAD NERACA LAJUR
========================================= */

async function loadNeracaLajur() {

    try {

        showLoading();

        const tanggalAwal =
            document.getElementById("tanggalAwalNeracaLajur")?.value || "";

        const tanggalAkhir =
            document.getElementById("tanggalAkhirNeracaLajur")?.value || "";

        if (
            tanggalAwal &&
            tanggalAkhir &&
            new Date(tanggalAwal) > new Date(tanggalAkhir)
        ) {
            throw new Error("Tanggal awal tidak boleh lebih besar dari tanggal akhir");
        }

        const result =
            await apiPost(
                "getNeracaLajur",
                {
                    tanggalAwal: tanggalAwal,
                    tanggalAkhir: tanggalAkhir
                }
            );

        if (!result.success) {
            throw new Error(result.message || "Gagal memuat Neraca Lajur");
        }

        const data =
            result.data.rows ||
            result.data.detail ||
            [];

        renderNeracaLajur(
            data,
            result.data.total
        );

        await loadWorksheetStatus();

    } catch (err) {

        console.error(err);
        error(err.message);

    } finally {

        hideLoading();

    }

}

/* =========================================
   RENDER TABLE
========================================= */

function renderNeracaLajur(data, total) {

    const tbody =
        document.getElementById("neracaLajurBody");

    if (!tbody) return;

    tbody.innerHTML = "";

    if (!data || data.length === 0) {

        tbody.innerHTML = `
            <tr>
                <td colspan="13" class="empty-table">
                    Data neraca lajur belum tersedia
                </td>
            </tr>
        `;

        renderFooterNeracaLajur({
            nsDebit: 0,
            nsKredit: 0,
            adjDebit: 0,
            adjKredit: 0,
            sapDebit: 0,
            sapKredit: 0,
            lrDebit: 0,
            lrKredit: 0,
            neracaDebit: 0,
            neracaKredit: 0
        });

        updateSummaryNeracaLajur(
            [],
            {
                nsDebit: 0,
                nsKredit: 0,
                adjDebit: 0,
                adjKredit: 0,
                sapDebit: 0,
                sapKredit: 0
            }
        );

        return;
    }

    data.forEach(row => {

        tbody.innerHTML += `

            <tr>

                <td>
                    ${row.kodeAkun || ""}
                </td>

                <td>
                    ${row.namaAkun || ""}
                </td>

                <td>
                    ${row.kelompok || ""}
                </td>

                <td class="text-right">
                    ${numberFormat(row.nsDebit || 0)}
                </td>

                <td class="text-right">
                    ${numberFormat(row.nsKredit || 0)}
                </td>

                <td class="text-right">
                    ${numberFormat(row.adjDebit || 0)}
                </td>

                <td class="text-right">
                    ${numberFormat(row.adjKredit || 0)}
                </td>

                <td class="text-right">
                    ${numberFormat(row.sapDebit || 0)}
                </td>

                <td class="text-right">
                    ${numberFormat(row.sapKredit || 0)}
                </td>

                <td class="text-right">
                    ${numberFormat(row.lrDebit || 0)}
                </td>

                <td class="text-right">
                    ${numberFormat(row.lrKredit || 0)}
                </td>

                <td class="text-right">
                    ${numberFormat(row.neracaDebit || 0)}
                </td>

                <td class="text-right">
                    ${numberFormat(row.neracaKredit || 0)}
                </td>

            </tr>

        `;

    });

    renderFooterNeracaLajur(total);
    updateSummaryNeracaLajur(data, total);

}

/* =========================================
   FOOTER TOTAL
========================================= */

function renderFooterNeracaLajur(total) {

    const footer =
        document.getElementById("neracaLajurFooter");

    if (!footer) return;

    footer.innerHTML = `

        <tr class="total-row">

            <th colspan="3">
                TOTAL
            </th>

            <th class="text-right">
                ${numberFormat(total.nsDebit || 0)}
            </th>

            <th class="text-right">
                ${numberFormat(total.nsKredit || 0)}
            </th>

            <th class="text-right">
                ${numberFormat(total.adjDebit || 0)}
            </th>

            <th class="text-right">
                ${numberFormat(total.adjKredit || 0)}
            </th>

            <th class="text-right">
                ${numberFormat(total.sapDebit || 0)}
            </th>

            <th class="text-right">
                ${numberFormat(total.sapKredit || 0)}
            </th>

            <th class="text-right">
                ${numberFormat(total.lrDebit || 0)}
            </th>

            <th class="text-right">
                ${numberFormat(total.lrKredit || 0)}
            </th>

            <th class="text-right">
                ${numberFormat(total.neracaDebit || 0)}
            </th>

            <th class="text-right">
                ${numberFormat(total.neracaKredit || 0)}
            </th>

        </tr>

    `;

}

/* =========================================
   SUMMARY CARD
========================================= */

function updateSummaryNeracaLajur(data, total) {

    const jumlahAkun =
        document.getElementById("nlJumlahAkun");

    const statusNS =
        document.getElementById("nlStatusNS");

    const statusAdj =
        document.getElementById("nlStatusAdj");

    const statusSAP =
        document.getElementById("nlStatusSAP");

    if (jumlahAkun) {
        jumlahAkun.innerText = data.length;
    }

    if (statusNS) {
        statusNS.innerHTML =
            Math.round(total.nsDebit || 0) === Math.round(total.nsKredit || 0)
                ? "✅ Balance"
                : "❌ Tidak Balance";
    }

    if (statusAdj) {
        statusAdj.innerHTML =
            Math.round(total.adjDebit || 0) === Math.round(total.adjKredit || 0)
                ? "✅ Balance"
                : "❌ Tidak Balance";
    }

    if (statusSAP) {
        statusSAP.innerHTML =
            Math.round(total.sapDebit || 0) === Math.round(total.sapKredit || 0)
                ? "✅ Balance"
                : "❌ Tidak Balance";
    }

}

/* =========================================
   STATUS WORKSHEET
========================================= */

async function loadWorksheetStatus() {

    try {

        const tanggalAwal =
            document.getElementById("tanggalAwalNeracaLajur")?.value || "";

        const tanggalAkhir =
            document.getElementById("tanggalAkhirNeracaLajur")?.value || "";

        const result =
            await apiPost(
                "validateWorksheet",
                {
                    tanggalAwal: tanggalAwal,
                    tanggalAkhir: tanggalAkhir
                }
            );

        if (!result.success) {
            return;
        }

        const data =
            result.data;

        const status =
            document.getElementById("worksheetStatus");

        if (!status) return;

        status.innerHTML = `

            <div class="status-grid">

                <div class="status-item">
                    <strong>Neraca Saldo</strong>
                    <br>
                    ${
                        data.neracaSaldoBalance
                            ? "✅ Balance"
                            : "❌ Tidak Balance"
                    }
                </div>

                <div class="status-item">
                    <strong>Penyesuaian</strong>
                    <br>
                    ${
                        data.penyesuaianBalance
                            ? "✅ Balance"
                            : "❌ Tidak Balance"
                    }
                </div>

                <div class="status-item">
                    <strong>Saldo Setelah Penyesuaian</strong>
                    <br>
                    ${
                        data.saldoSetelahBalance
                            ? "✅ Balance"
                            : "❌ Tidak Balance"
                    }
                </div>

                <div class="status-item">
                    <strong>Laba Rugi</strong>
                    <br>
                    ${
                        data.labaRugiBalance
                            ? "✅ Balance"
                            : "❌ Tidak Balance"
                    }
                </div>

                <div class="status-item">
                    <strong>Neraca</strong>
                    <br>
                    ${
                        data.neracaBalance
                            ? "✅ Balance"
                            : "❌ Tidak Balance"
                    }
                </div>

            </div>

        `;

    } catch (err) {

        console.error(err);

    }

}

/* =========================================
   RESET NERACA LAJUR
========================================= */

function resetNeracaLajur() {

    document.getElementById("tanggalAwalNeracaLajur").value = "";
    document.getElementById("tanggalAkhirNeracaLajur").value = "";

    loadNeracaLajur();

}

/* =========================================
   EXPORT EXCEL
========================================= */

function exportNeracaLajurExcel() {

    const table =
        document.getElementById("tblNeracaLajur");

    if (!table) {
        alert("Tabel Neraca Lajur tidak ditemukan");
        return;
    }

    const wb =
        XLSX.utils.book_new();

    const ws =
        XLSX.utils.table_to_sheet(table);

    XLSX.utils.book_append_sheet(
        wb,
        ws,
        "Neraca Lajur"
    );

    XLSX.writeFile(
        wb,
        `Neraca_Lajur_${new Date().toISOString().slice(0,10)}.xlsx`
    );

}

/* =========================================
   EXPORT PDF
========================================= */

function exportNeracaLajurPDF() {

    const table =
        document.getElementById("tblNeracaLajur");

    if (!table) {
        alert("Tabel Neraca Lajur tidak ditemukan");
        return;
    }

    const { jsPDF } =
        window.jspdf;

    const doc =
        new jsPDF(
            "l",
            "mm",
            "a4"
        );

    doc.setFontSize(16);

    doc.text(
        "AUMARIX ACCOUNTING SYSTEM",
        14,
        15
    );

    doc.setFontSize(12);

    doc.text(
        "NERACA LAJUR",
        14,
        23
    );

    doc.autoTable({

        html: "#tblNeracaLajur",

        startY: 30,

        theme: "grid",

        styles: {
            fontSize: 6,
            cellPadding: 1.5
        },

        headStyles: {
            fillColor: [37, 99, 235],
            textColor: 255
        }

    });

    doc.save(
        `Neraca_Lajur_${new Date().toISOString().slice(0,10)}.pdf`
    );

}