/* =====================================================
   AUMARIX ACCOUNTING SYSTEM
   NERACA LAJUR
===================================================== */

/* =========================================
   LOAD NERACA LAJUR
========================================= */

async function loadNeracaLajur() {

    try {

        showLoading();

        const tanggalAwal =
            document.getElementById(
                "tanggalAwalNeracaLajur"
            )?.value || "";

        const tanggalAkhir =
            document.getElementById(
                "tanggalAkhirNeracaLajur"
            )?.value || "";

        const result =
await apiPost(
    "getNeracaLajur",
    {

        tanggalAwal:
            tanggalAwal,

        tanggalAkhir:
            tanggalAkhir

    }
);

        if(!result.success){

            throw new Error(
                result.message
            );

        }

        renderNeracaLajur(
            result.data.detail,
            result.data.total
        );

        loadWorksheetStatus();

    }catch(err){

        console.error(err);

        error(err.message);

    }finally{

        hideLoading();

    }

}




function exportNeracaLajurExcel(){

    const table =
        document.getElementById(
            "tblNeracaLajur"
        );

    const wb =
        XLSX.utils.book_new();

    const ws =
        XLSX.utils.table_to_sheet(
            table
        );

    XLSX.utils.book_append_sheet(
        wb,
        ws,
        "Neraca Lajur"
    );

    XLSX.writeFile(
        wb,
        "Neraca_Lajur.xlsx"
    );

}


function exportNeracaLajurPDF(){

    const { jsPDF } =
        window.jspdf;

    const doc =
        new jsPDF(
            "l",
            "mm",
            "a4"
        );

    doc.text(
        "NERACA LAJUR",
        14,
        15
    );

    doc.autoTable({

        html:
        "#tblNeracaLajur",

        startY:20,

        styles:{
            fontSize:7
        }

    });

    doc.save(
        "Neraca_Lajur.pdf"
    );

}

/* =========================================
   RENDER TABLE
========================================= */

function renderNeracaLajur(
    data,
    total
) {

    const tbody =
        document.getElementById(
            "neracaLajurBody"
        );

    tbody.innerHTML = "";

    data.forEach(row => {

        tbody.innerHTML += `

        <tr>

            <td>
                ${row.kodeAkun}
            </td>

            <td>
                ${row.namaAkun}
            </td>

            <td class="text-right">
                ${numberFormat(
                    row.nsDebit
                )}
            </td>

            <td class="text-right">
                ${numberFormat(
                    row.nsKredit
                )}
            </td>

            <td class="text-right">
                ${numberFormat(
                    row.adjDebit
                )}
            </td>

            <td class="text-right">
                ${numberFormat(
                    row.adjKredit
                )}
            </td>

            <td class="text-right">
                ${numberFormat(
                    row.sapDebit
                )}
            </td>

            <td class="text-right">
                ${numberFormat(
                    row.sapKredit
                )}
            </td>

            <td class="text-right">
                ${numberFormat(
                    row.lrDebit
                )}
            </td>

            <td class="text-right">
                ${numberFormat(
                    row.lrKredit
                )}
            </td>

            <td class="text-right">
                ${numberFormat(
                    row.neracaDebit
                )}
            </td>

            <td class="text-right">
                ${numberFormat(
                    row.neracaKredit
                )}
            </td>

        </tr>

        `;

    });

    renderFooterNeracaLajur(
        total
    );

}

/* =========================================
   FOOTER TOTAL
========================================= */

function renderFooterNeracaLajur(
    total
) {

    document
        .getElementById(
            "neracaLajurFooter"
        )
        .innerHTML = `

        <tr class="total-row">

            <th colspan="2">

                TOTAL

            </th>

            <th class="text-right">

                ${numberFormat(
                    total.nsDebit
                )}

            </th>

            <th class="text-right">

                ${numberFormat(
                    total.nsKredit
                )}

            </th>

            <th class="text-right">

                ${numberFormat(
                    total.adjDebit
                )}

            </th>

            <th class="text-right">

                ${numberFormat(
                    total.adjKredit
                )}

            </th>

            <th class="text-right">

                ${numberFormat(
                    total.sapDebit
                )}

            </th>

            <th class="text-right">

                ${numberFormat(
                    total.sapKredit
                )}

            </th>

            <th class="text-right">

                ${numberFormat(
                    total.lrDebit
                )}

            </th>

            <th class="text-right">

                ${numberFormat(
                    total.lrKredit
                )}

            </th>

            <th class="text-right">

                ${numberFormat(
                    total.neracaDebit
                )}

            </th>

            <th class="text-right">

                ${numberFormat(
                    total.neracaKredit
                )}

            </th>

        </tr>

    `;

}

/* =========================================
   STATUS WORKSHEET
========================================= */

async function loadWorksheetStatus() {

    try {

        const result =
            await apiGet(
                "validateWorksheet"
            );

        if (!result.success) {

            return;

        }

        const data =
            result.data;

        document
            .getElementById(
                "worksheetStatus"
            )
            .innerHTML = `

            <div class="status-grid">

                <div class="status-item">

                    Neraca Saldo

                    <br>

                    ${
                        data.neracaSaldoBalance
                        ?
                        "✅ Balance"
                        :
                        "❌ Tidak Balance"
                    }

                </div>

                <div class="status-item">

                    Penyesuaian

                    <br>

                    ${
                        data.penyesuaianBalance
                        ?
                        "✅ Balance"
                        :
                        "❌ Tidak Balance"
                    }

                </div>

                <div class="status-item">

                    Saldo Setelah Penyesuaian

                    <br>

                    ${
                        data.saldoSetelahBalance
                        ?
                        "✅ Balance"
                        :
                        "❌ Tidak Balance"
                    }

                </div>

                <div class="status-item">

                    Laba Rugi

                    <br>

                    ${
                        data.labaRugiBalance
                        ?
                        "✅ Balance"
                        :
                        "❌ Tidak Balance"
                    }

                </div>

                <div class="status-item">

                    Neraca

                    <br>

                    ${
                        data.neracaBalance
                        ?
                        "✅ Balance"
                        :
                        "❌ Tidak Balance"
                    }

                </div>

            </div>

        `;

    } catch (err) {

        console.error(
            err
        );

    }

}