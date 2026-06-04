/* =====================================================
   AUMARIX ACCOUNTING SYSTEM
   BUKUBESAR.JS
===================================================== */

let bukuBesarData = null;

/* ==========================
   LOAD HALAMAN
========================== */

async function initBukuBesar() {

    console.log(
        "INIT BUKU BESAR"
    );

    await loadCOAFilter();

}

/* ==========================
   LOAD COA
========================== */

async function loadCOAFilter() {

    console.log(
        "LOAD COA FILTER"
    );

    const result =
        await apiGet(
            "getCOA"
        );

    console.log(
        result
    );

    if (!result.success) {

        alert(
            "Gagal memuat COA"
        );

        return;

    }

    const select =
        document.getElementById(
            "filterAkun"
        );

    select.innerHTML =
        `
        <option value="">
            Pilih Akun
        </option>
        `;

    result.data.forEach(row => {

        select.innerHTML +=
        `
        <option value="${row["Kode Akun"]}">
            ${row["Kode Akun"]} -
            ${row["Nama Akun"]}
        </option>
        `;

    });

}

/* ==========================
   LOAD BUKU BESAR
========================== */

async function loadBukuBesar() {

    const kodeAkun =
        document.getElementById(
            "filterAkun"
        ).value;

    if (!kodeAkun) {

        return;

    }

    const tglAwal =
    document.getElementById(
        "bbTanggalAwal"
    ).value;

const tglAkhir =
    document.getElementById(
        "bbTanggalAkhir"
    ).value;

const result =
    await apiGet(
        "getBukuBesar",
        {
            kodeAkun,
            tglAwal,
            tglAkhir
        }
    );

    if (!result.success) {

        alert(
            result.message
        );

        return;

    }

    bukuBesarData =
        result.data;

    renderBukuBesar();

}

/* ==========================
   RENDER
========================== */

function renderBukuBesar() {

    if (!bukuBesarData)
        return;

    document.getElementById(
        "bbKodeAkun"
    ).innerText =
    bukuBesarData.akun["Kode Akun"];

    document.getElementById(
        "bbNamaAkun"
    ).innerText =
    bukuBesarData.akun["Nama Akun"];

    document.getElementById(
        "bbKelompok"
    ).innerText =
    bukuBesarData.akun["Kelompok Akun"];

    document.getElementById(
        "bbSaldoAwal"
    ).innerText =
    rupiah(
        bukuBesarData.saldoAwal
    );

    document.getElementById(
        "bbDebit"
    ).innerText =
    rupiah(
        bukuBesarData.totalDebit
    );

    document.getElementById(
        "bbKredit"
    ).innerText =
    rupiah(
        bukuBesarData.totalKredit
    );

    document.getElementById(
        "bbSaldoAkhir"
    ).innerText =
    rupiah(
        bukuBesarData.saldoAkhir
    );

    renderTable();

    document.getElementById(
    "bbJumlah"
).innerText =

bukuBesarData.transaksi.length;

}

/* ==========================
   TABLE
========================== */

function renderTable(){

    const tbody =
        document.getElementById(
            "bbTable"
        );

    tbody.innerHTML = "";

    /* ==========================
       SALDO AWAL
    ========================== */

    tbody.innerHTML += `

        <tr
            style="
                background:#f8fafc;
                font-weight:bold;
            "
        >

            <td>-</td>

            <td>-</td>

            <td>
                SALDO AWAL
            </td>

            <td class="text-end">
                -
            </td>

            <td class="text-end">
                -
            </td>

            <td class="text-end">
                ${rupiah(
                    bukuBesarData.saldoAwal
                )}
            </td>

        </tr>

    `;

    bukuBesarData.transaksi
    .forEach(row=>{

        tbody.innerHTML += `

            <tr>

                <td>
                    ${formatTanggal(
                        row["Tanggal"]
                    )}
                </td>

                <td>
                    ${row["No. Bukti"] || ""}
                </td>

                <td>
                    ${row["Keterangan"] || ""}
                </td>

                <td class="text-end">
                    ${rupiah(
                        row["Debit"] || 0
                    )}
                </td>

                <td class="text-end">
                    ${rupiah(
                        row["Kredit"] || 0
                    )}
                </td>

                <td class="text-end">
                    ${rupiah(
                        row.saldo || 0
                    )}
                </td>

            </tr>

        `;

    });

}

function resetBukuBesar(){

    document.getElementById(
        "filterAkun"
    ).value = "";

    document.getElementById(
        "bbTanggalAwal"
    ).value = "";

    document.getElementById(
        "bbTanggalAkhir"
    ).value = "";

    document.getElementById(
        "bbTable"
    ).innerHTML = "";

    bukuBesarData = null;

}


/* ==========================
   EXPORT EXCEL
========================== */

function exportBukuBesarExcel(){

    if(!bukuBesarData){

        alert(
            "Data Buku Besar kosong"
        );

        return;

    }

    const wb =
        XLSX.utils.book_new();

    const ws =
        XLSX.utils.table_to_sheet(

            document.querySelector(
    ".table"
)

        );

    XLSX.utils.book_append_sheet(

        wb,

        ws,

        "Buku Besar"

    );

    XLSX.writeFile(

        wb,

        `BukuBesar_${
            new Date()
            .toISOString()
            .slice(0,10)
        }.xlsx`

    );

}

/* ==========================
   EXPORT PDF
========================== */

function exportBukuBesarPDF(){

    if(!bukuBesarData){

        alert(
            "Data Buku Besar kosong"
        );

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
        "BUKU BESAR",
        14,
        22
    );

    const rows = [];

    rows.push([

        "-",

        "-",

        "SALDO AWAL",

        "-",

        "-",

        rupiah(
            bukuBesarData.saldoAwal
        )

    ]);
    
bukuBesarData.transaksi
.forEach(row=>{

    rows.push([

        formatTanggal(
            row["Tanggal"]
        ),

        row["No. Bukti"],

        row["Keterangan"],

        rupiah(
            row["Debit"] || 0
        ),

        rupiah(
            row["Kredit"] || 0
        ),

        rupiah(
            row.saldo || 0
        )

    ]);

});

    doc.autoTable({

        startY:30,

        head:[[
            "Tanggal",
            "No Bukti",
            "Keterangan",
            "Debit",
            "Kredit",
            "Saldo"
        ]],

        body:rows

    });

    doc.save(

        `BukuBesar_${
            new Date()
            .toISOString()
            .slice(0,10)
        }.pdf`

    );

}