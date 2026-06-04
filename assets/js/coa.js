let coaData = [];

/* ==========================
   LOAD COA
========================== */

async function loadCOA() {

    try {

        const result =
            await apiGet(
                "getCOA"
            );

        if (!result.success) {

            error(
                result.message ||
                "Gagal mengambil data COA"
            );

            return;

        }

        coaData =
            result.data || [];

        renderCOATable(
            coaData
        );

        updateCOASummary(
            coaData
        );

        loadKelompokFilter();

    }

    catch (err) {

        console.error(err);

        error(
            err.message
        );

    }

}

/* ==========================
   SUMMARY
========================== */

function updateCOASummary(data){

    let totalDebit = 0;
    let totalKredit = 0;

    data.forEach(row => {

        totalDebit += Number(
            row["Saldo Awal Debit"] || 0
        );

        totalKredit += Number(
            row["Saldo Awal Kredit"] || 0
        );

    });

    document.getElementById(
        "totalAkun"
    ).innerHTML =
    data.length;

    document.getElementById(
        "totalDebitAwal"
    ).innerHTML =
    numberFormat(
        totalDebit
    );

    document.getElementById(
        "totalKreditAwal"
    ).innerHTML =
    numberFormat(
        totalKredit
    );

    const status =
        document.getElementById(
            "statusBalance"
        );

    if(
        totalDebit === totalKredit
    ){

        status.innerHTML =
        "🟢 BALANCE";

        status.style.color =
        "#16a34a";

    }

    else{

        status.innerHTML =
        "🔴 TIDAK BALANCE";

        status.style.color =
        "#dc2626";

    }

}

/* ==========================
   TABLE
========================== */

function renderCOATable(data) {

    const tbody =
        document.getElementById(
            "coaTable"
        );

    if (!tbody) return;

    tbody.innerHTML = "";

    data.forEach(row => {

        tbody.innerHTML += `

        <tr>

            <td>
                ${row["Kode Akun"] || ""}
            </td>

            <td>
                ${row["Nama Akun"] || ""}
            </td>

            <td>
                ${row["Kelompok Akun"] || ""}
            </td>

            <td>
                ${row["Pos Saldo"] || ""}
            </td>

            <td>
                ${row["Pos Laporan"] || ""}
            </td>

            <td style="text-align:right;">
                ${numberFormat(
                    row["Saldo Awal Debit"] || 0
                )}
            </td>

            <td style="text-align:right;">
                ${numberFormat(
                    row["Saldo Awal Kredit"] || 0
                )}
            </td>

            <td>

                <button
                    class="btn btn-warning btn-sm"
                    onclick="editCOA('${row["Kode Akun"]}')">

                    ✏ Edit

                </button>

                <button
                    class="btn btn-danger btn-sm"
                    onclick="deleteCOA('${row["Kode Akun"]}')">

                    🗑 Hapus

                </button>

            </td>

        </tr>

        `;

    });

}

/* ==========================
   FILTER KELOMPOK
========================== */

function loadKelompokFilter(){

    const select =
        document.getElementById(
            "filterKelompok"
        );

    if(!select) return;

    const kelompokList =

        [...new Set(

            coaData.map(

                row =>

                row["Kelompok Akun"]

            )

        )];

    select.innerHTML =

    `<option value="">
        Semua Kelompok
    </option>`;

    kelompokList.forEach(
        kelompok => {

        select.innerHTML +=

        `<option value="${kelompok}">
            ${kelompok}
        </option>`;

    });

}

/* ==========================
   SEARCH + FILTER
========================== */

function filterCOA(){

    const keyword =
        document
        .getElementById(
            "searchCOA"
        )
        .value
        .toLowerCase();

    const kelompok =
        document
        .getElementById(
            "filterKelompok"
        )
        .value;

    const filtered =
        coaData.filter(row => {

            const matchSearch =

                String(
                    row["Kode Akun"] || ""
                )
                .toLowerCase()
                .includes(keyword)

                ||

                String(
                    row["Nama Akun"] || ""
                )
                .toLowerCase()
                .includes(keyword);

            const matchKelompok =

                !kelompok

                ||

                row["Kelompok Akun"]
                ===
                kelompok;

            return (

                matchSearch

                &&

                matchKelompok

            );

        });

    renderCOATable(
        filtered
    );

    updateCOASummary(
        filtered
    );

}

/* ==========================
   MODAL
========================== */

function showCOAModal(){

    document
    .getElementById(
        "modalTitle"
    )
    .innerHTML =
    "Tambah COA";

    document
    .getElementById(
        "editMode"
    )
    .value = "";

    document
    .getElementById(
        "coaKode"
    )
    .value = "";

    document
    .getElementById(
        "coaNama"
    )
    .value = "";

    document
    .getElementById(
        "coaKelompok"
    )
    .value = "";

    document
    .getElementById(
        "coaDebit"
    )
    .value = 0;

    document
    .getElementById(
        "coaKredit"
    )
    .value = 0;

    document
    .getElementById(
        "coaModal"
    )
    .style.display =
    "flex";

}

function closeCOAModal(){

    document
    .getElementById(
        "coaModal"
    )
    .style.display =
    "none";

}

/* ==========================
   EDIT
========================== */

function editCOA(
    kodeAkun
){

    const akun =
        coaData.find(

            row =>

            String(
                row["Kode Akun"]
            )

            ===

            String(
                kodeAkun
            )

        );

    if(!akun) return;

    document
    .getElementById(
        "modalTitle"
    )
    .innerHTML =
    "Edit COA";

    document
    .getElementById(
        "editMode"
    )
    .value =
    kodeAkun;

    document
    .getElementById(
        "coaKode"
    )
    .value =
    akun["Kode Akun"];

    document
    .getElementById(
        "coaNama"
    )
    .value =
    akun["Nama Akun"];

    document
    .getElementById(
        "coaKelompok"
    )
    .value =
    akun["Kelompok Akun"];

    document
    .getElementById(
        "coaPosSaldo"
    )
    .value =
    akun["Pos Saldo"];

    document
    .getElementById(
        "coaPosLaporan"
    )
    .value =
    akun["Pos Laporan"];

    document
    .getElementById(
        "coaDebit"
    )
    .value =
    akun["Saldo Awal Debit"];

    document
    .getElementById(
        "coaKredit"
    )
    .value =
    akun["Saldo Awal Kredit"];

    showCOAModal();

}

/* ==========================
   SAVE
========================== */

async function saveCOAData(){

    const data = {

        "Kode Akun":
        document.getElementById(
            "coaKode"
        ).value,

        "Nama Akun":
        document.getElementById(
            "coaNama"
        ).value,

        "Kelompok Akun":
        document.getElementById(
            "coaKelompok"
        ).value,

        "Pos Saldo":
        document.getElementById(
            "coaPosSaldo"
        ).value,

        "Pos Laporan":
        document.getElementById(
            "coaPosLaporan"
        ).value,

        "Saldo Awal Debit":
        Number(
            document.getElementById(
                "coaDebit"
            ).value || 0
        ),

        "Saldo Awal Kredit":
        Number(
            document.getElementById(
                "coaKredit"
            ).value || 0
        )

    };

    const editMode =
document.getElementById(
    "editMode"
).value;

const action =

    editMode

    ?

    "updateCOA"

    :

    "saveCOA";

const result =
await apiPost(
    action,
    data
);

    if(result.success){

        success(
            "COA berhasil disimpan"
        );

        closeCOAModal();

        loadCOA();

    }

    else{

        error(
            result.message
        );

    }

}

/* ==========================
   DELETE
========================== */

async function deleteCOA(
    kodeAkun
){

    const konfirmasi =
    confirm(

        `Hapus akun ${kodeAkun}?`

    );

    if(!konfirmasi){

        return;

    }

    const result =
    await apiPost(

        "deleteCOA",

        {
            kodeAkun
        }

    );

    if(result.success){

        success(
            "COA berhasil dihapus"
        );

        loadCOA();

    }

    else{

        error(
            result.message
        );

    }

}

/* ==========================
   EXPORT EXCEL
========================== */

function exportCOAExcel(){

    const data = coaData;

    if(!data.length){

        alert(
            "Data COA kosong"
        );

        return;

    }

    const worksheet =
        XLSX.utils.json_to_sheet(
            data
        );

    const workbook =
        XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(

        workbook,

        worksheet,

        "COA"

    );

    XLSX.writeFile(

        workbook,

        `COA_${new Date()
            .toISOString()
            .slice(0,10)}.xlsx`

    );

}

/* ==========================
   EXPORT PDF
========================== */

function exportCOAPDF(){

    if(!coaData.length){

        alert(
            "Data COA kosong"
        );

        return;

    }

    const { jsPDF } =
        window.jspdf;

    const doc =
        new jsPDF({
            orientation: "landscape",
            unit: "mm",
            format: "a4"
        });

    /* ==========================
       HEADER
    ========================== */

    doc.setFontSize(16);

    doc.text(
        "AUMARIX ACCOUNTING SYSTEM",
        14,
        15
    );

    doc.setFontSize(12);

    doc.text(
        "CHART OF ACCOUNTS",
        14,
        22
    );

    doc.setFontSize(9);

    doc.text(
        "Tanggal Cetak : " +
        new Date().toLocaleDateString(
            "id-ID"
        ),
        14,
        28
    );

    /* ==========================
       DATA TABEL
    ========================== */

    const body = coaData.map(row => [

        row["Kode Akun"] || "",

        row["Nama Akun"] || "",

        row["Kelompok Akun"] || "",

        row["Pos Saldo"] || "",

        row["Pos Laporan"] || "",

        numberFormat(
            row["Saldo Awal Debit"] || 0
        ),

        numberFormat(
            row["Saldo Awal Kredit"] || 0
        )

    ]);

    /* ==========================
       TABLE
    ========================== */

    doc.autoTable({

        startY: 35,

        head: [[

            "Kode Akun",

            "Nama Akun",

            "Kelompok Akun",

            "Pos Saldo",

            "Pos Laporan",

            "Saldo Awal Debit",

            "Saldo Awal Kredit"

        ]],

        body: body,

        theme: "grid",

        styles: {

            fontSize: 8,

            cellPadding: 2,

            overflow: "linebreak"

        },

        headStyles: {

            fillColor: [41,128,185],

            textColor: 255,

            fontStyle: "bold"

        },

        columnStyles: {

            0: {
                cellWidth: 25
            },

            1: {
                cellWidth: 60
            },

            2: {
                cellWidth: 45
            },

            3: {
                cellWidth: 25
            },

            4: {
                cellWidth: 30
            },

            5: {
                halign: "right"
            },

            6: {
                halign: "right"
            }

        },

        margin: {

            top: 35,

            left: 10,

            right: 10

        }

    });

    /* ==========================
       FOOTER
    ========================== */

    const totalPages =
        doc.internal.getNumberOfPages();

    for(
        let i = 1;
        i <= totalPages;
        i++
    ){

        doc.setPage(i);

        doc.setFontSize(8);

        doc.text(

            `Halaman ${i} dari ${totalPages}`,

            260,

            200

        );

    }

    /* ==========================
       SAVE FILE
    ========================== */

    const tanggal =

        new Date()
        .toISOString()
        .slice(0,10);

    doc.save(
        `COA_${tanggal}.pdf`
    );

}