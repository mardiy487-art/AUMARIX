/* =====================================================
   AUMARIX ACCOUNTING SYSTEM
   PENYESUAIAN.JS
===================================================== */

var penyesuaianRows = 0;
var editNoBuktiPenyesuaian = null;
var coaListPenyesuaian = [];


/* ==========================
   LOAD HALAMAN
========================== */

async function loadFilterNamaAkunPenyesuaian(){

    const result =
        await apiGet(
            "getCOA"
        );

    if(!result.success){

        return;

    }

    const select =
        document.getElementById(
            "filterNamaAkun"
        );

    select.innerHTML =

        `
        <option value="">
            Semua Akun
        </option>
        `;

    result.data.forEach(akun=>{

        select.innerHTML +=

        `
        <option value="${akun["Nama Akun"]}">
            ${akun["Kode Akun"]}
            -
            ${akun["Nama Akun"]}
        </option>
        `;

    });

}

async function deletePenyesuaian(
    noBukti
){

    if(
        !confirm(
            "Hapus jurnal ini ?"
        )
    ){
        return;
    }

    const result =
        await apiPost(
            "deleteJurnalPenyesuaian",
            {
                noBukti
            }
        );

   if(result.success){

    success(
        "Data berhasil dihapus"
    );

    loadPenyesuaianHistory();
    loadSummaryPenyesuaian();

}

    else{

        error(
            result.message
        );

    }

}
/* ==========================
   EDIT PENYESUAIAN
========================== */

async function editPenyesuaian(
    noBukti
){

    const result =
        await apiGet(
            "getJurnalPenyesuaian"
        );

    if(!result.success){

        return;

    }

    const data =
        result.data.filter(

            row =>

            row["No. Bukti"]
            ===
            noBukti

        );

    if(data.length === 0){

        return;

    }

editNoBuktiPenyesuaian =
        noBukti;

    document.getElementById(
        "tanggalJurnal"
    ).value =
    formatDateInput(
        data[0]["Tanggal"]
    );

    document.getElementById(
        "noBukti"
    ).value =
    data[0]["No. Bukti"];

    document.getElementById(
        "keterangan"
    ).value =
    data[0]["Keterangan"];

    document.getElementById(
    "penyesuaianDetail"
).innerHTML = "";
document.getElementById(
    "noBukti"
).readOnly = true;

await loadCOAForPenyesuaian();

penyesuaianRows = 0;

    data.forEach(item=>{

        addPenyesuaianRow();

        const row =
            penyesuaianRows;

        const select =
            document
            .querySelector(
                `#row${row} select`
            );

        select.value =
            item["Kode Akun"];

        setNamaAkunPenyesuaian(
            select,
            row
        );

        document
        .querySelector(
            `#row${row} .debit`
        )
        .value =
        item["Debit"];

        document
        .querySelector(
            `#row${row} .kredit`
        )
        .value =
        item["Kredit"];

    });

    calculateBalancePenyesuaian();

}


function generateNoBuktiPenyesuaian(){

    const now = new Date();

    document.getElementById(
        "tanggalJurnal"
    ).value =
    now.toISOString().split("T")[0];

    document.getElementById(
        "noBukti"
    ).value =

        "JP-" +

        now.getFullYear() +

        String(
            now.getMonth()+1
        ).padStart(2,"0") +

        String(
            now.getDate()
        ).padStart(2,"0") +

        "-" +

        Date.now()
        .toString()
        .slice(-5);

}

/* ==========================
   LOAD COA
========================== */

async function loadCOAForPenyesuaian(){

    const result =
        await apiGet(
            "getCOA"
        );

    if(result.success){

        coaListPenyesuaian=
            result.data || [];

    }

}

/* ==========================
   TAMBAH BARIS
========================== */

function addPenyesuaianRow(){

    penyesuaianRows++;

    const tbody =
    document.getElementById(
        "penyesuaianDetail"
    );

    let options = "";

    coaListPenyesuaian.forEach(akun=>{

        options +=

        `
        <option value="${akun["Kode Akun"]}">
            ${akun["Kode Akun"]}
            -
            ${akun["Nama Akun"]}
        </option>
        `;

    });

    tbody.insertAdjacentHTML(

        "beforeend",

        `
        <tr id="row${penyesuaianRows}">

            <td>

                <select
                    class="form-control"
                    onchange="
                    setNamaAkunPenyesuaian(
                        this,
                        ${penyesuaianRows}
                    )">

                    <option value="">
                        Pilih Akun
                    </option>

                    ${options}

                </select>

            </td>

            <td>

                <input
                    type="text"
                    id="namaAkun${penyesuaianRows}"
                    class="form-control"
                    readonly>

            </td>

            <td>

                <input
                    type="number"
                    value="0"
                    class="form-control debit"
                    oninput="
                    calculateBalancePenyesuaian()
                    ">

            </td>

            <td>

                <input
                    type="number"
                    value="0"
                    class="form-control kredit"
                    oninput="
                    calculateBalancePenyesuaian()
                    ">

            </td>

            <td>

                <button
                    class="btn btn-danger"
                    onclick="
                    removePenyesuaianRow(
                        ${penyesuaianRows}
                    )">

                    Hapus

                </button>

            </td>

        </tr>
        `

    );

    calculateBalancePenyesuaian();

}

/* ==========================
   SET NAMA AKUN
========================== */

function setNamaAkunPenyesuaian(
    select,
    row
){

    const akun =
        coaListPenyesuaian.find(

            x =>

            String(
                x["Kode Akun"]
            )

            ===

            String(
                select.value
            )

        );

    document.getElementById(
        `namaAkun${row}`
    ).value =

    akun
    ?
    akun["Nama Akun"]
    :
    "";

}

/* ==========================
   HAPUS BARIS
========================== */

function removePenyesuaianRow(row){

    const el =
        document.getElementById(
            `row${row}`
        );

    if(el){

        el.remove();

    }

    calculateBalancePenyesuaian();

}

/* ==========================
   BALANCE
========================== */

function calculateBalancePenyesuaian(){

    let totalDebit = 0;
    let totalKredit = 0;

    document
    .querySelectorAll(".debit")
    .forEach(el=>{

        totalDebit +=
        Number(
            el.value || 0
        );

    });

    document
    .querySelectorAll(".kredit")
    .forEach(el=>{

        totalKredit +=
        Number(
            el.value || 0
        );

    });

    document.getElementById(
        "totalDebit"
    ).innerText =
    rupiah(totalDebit);

    document.getElementById(
        "totalKredit"
    ).innerText =
    rupiah(totalKredit);

    const status =
        document.getElementById(
            "balanceInfo"
        );

    const statusField =
        document.getElementById(
            "statusBalance"
        );

    if(totalDebit === totalKredit){

        status.innerHTML =
        "✅ BALANCE";

        status.className =
        "balance-status balance-ok";

        statusField.innerHTML =
"✅ BALANCE";


        document.getElementById(
    "summaryStatus"
).innerHTML =
"✅ Balance";

    }else{

        status.innerHTML =
        "❌ TIDAK BALANCE";

        status.className =
        "balance-status balance-error";

       statusField.innerHTML =
"❌ TIDAK BALANCE";

        document.getElementById(
    "summaryStatus"
).innerHTML =
"❌ Tidak Balance";

    }

}

/* ==========================
   SIMPAN
========================== */

async function savePenyesuaian(){

    try{

        const rows =
    document.querySelectorAll(
        "#penyesuaianDetail tr"
    );

        if(rows.length === 0){

            alert(
                "Detail jurnal kosong"
            );

            return;

        }

        const detail = [];

        let totalDebit = 0;
        let totalKredit = 0;

        rows.forEach(row=>{

            const akun =
                row.querySelector(
                    "select"
                );

            const nama =
                row.querySelector(
                    'input[readonly]'
                );

            const debit =
                row.querySelector(
                    ".debit"
                );

            const kredit =
                row.querySelector(
                    ".kredit"
                );

            if(!akun.value){

                throw new Error(
                    "Masih ada akun yang belum dipilih"
                );

            }

            const item = {

                kodeAkun:
                    akun.value,

                namaAkun:
                    nama.value,

                debit:
                    Number(
                        debit.value || 0
                    ),

                kredit:
                    Number(
                        kredit.value || 0
                    )

            };

            totalDebit +=
                item.debit;

            totalKredit +=
                item.kredit;

            detail.push(item);

        });

        if(totalDebit !== totalKredit){

            alert(
                "Debit dan Kredit harus balance"
            );

            return;

        }

       const data = {

    oldNoBukti:
        editNoBuktiPenyesuaian,

    tanggal:
    document.getElementById(
        "tanggalJurnal"
    ).value,

    noBukti:
    document.getElementById(
        "noBukti"
    ).value,

    keterangan:
    document.getElementById(
        "keterangan"
    ).value,

    detail:
    detail

};

        const result =
            await apiPost(
                "saveJurnalPenyesuaian",
                data
            );

        if(result.success){

    success(
        "Jurnal Penyesuaian berhasil disimpan"
    );
editNoBuktiPenyesuaian= null;

    loadPenyesuaian();

}else{

            error(
                result.message
            );

        }

    }catch(err){

        error(
            err.message
        );

        console.error(err);

    }

}

/* ==========================
   HISTORY
========================== */


async function loadPenyesuaian(){

    generateNoBuktiPenyesuaian();
 editNoBuktiPenyesuaian = null;

document.getElementById(
    "noBukti"
).readOnly = false;

    await loadCOAForPenyesuaian();

    await loadFilterNamaAkunPenyesuaian();

    document.getElementById(
        "penyesuaianDetail"
    ).innerHTML = "";

    penyesuaianRows = 0;

    addPenyesuaianRow();
    addPenyesuaianRow();

    calculateBalancePenyesuaian();

    await loadPenyesuaianHistory();
await loadSummaryPenyesuaian();

}

async function loadPenyesuaianHistory(){

    const result =
        await apiGet(
            "getJurnalPenyesuaian"
        );

    if(!result.success){

        return;

    }



    const tbody =
    document.getElementById(
        "penyesuaianHistory"
    );

    tbody.innerHTML = "";

    result.data.forEach(row=>{

    tbody.innerHTML +=

    `
    <tr>

        <td>
            ${formatTanggal(
                row["Tanggal"]
            )}
        </td>

        <td>
            ${row["No. Bukti"]}
        </td>

        <td>
            ${row["Keterangan"]}
        </td>

        <td>
            ${row["Kode Akun"]}
        </td>

        <td>
            ${row["Nama Akun"]}
        </td>

        <td>
            ${numberFormat(
                row["Debit"]
            )}
        </td>

        <td>
            ${numberFormat(
                row["Kredit"]
            )}
        </td>

        <td>

<button
class="btn-action btn-edit"
onclick="editPenyesuaian('${row["No. Bukti"]}')">

<i class="fas fa-pen"></i>

</button>

<button
class="btn-action btn-delete"
onclick="deletePenyesuaian('${row["No. Bukti"]}')">

<i class="fas fa-trash"></i>

</button>

        </td>

    </tr>
    `;

});
}

async function loadSummaryPenyesuaian(){

    const result =
        await apiGet(
            "getJurnalPenyesuaian"
        );

    if(!result.success){
        return;
    }

    let totalDebit = 0;
    let totalKredit = 0;

    const transaksi =
        new Set();

    result.data.forEach(row=>{

        transaksi.add(
            row["No. Bukti"]
        );

        totalDebit +=
            Number(
                row["Debit"] || 0
            );

        totalKredit +=
            Number(
                row["Kredit"] || 0
            );

    });

    document.getElementById(
    "summaryBaris"
).innerText =
result.data.length;

    document.getElementById(
        "totalDebitCard"
    ).innerText =
    rupiah(totalDebit);

    document.getElementById(
        "totalKreditCard"
    ).innerText =
    rupiah(totalKredit);

    document.getElementById(
        "summaryStatus"
    ).innerHTML =

        totalDebit === totalKredit

        ? "✅ Balance"

        : "❌ Tidak Balance";

}


function filterPenyesuaian(){

    const tanggalAwal =
        document.getElementById(
            "tanggalAwal"
        ).value;

    const tanggalAkhir =
        document.getElementById(
            "tanggalAkhir"
        ).value;

    const noBukti =
        document.getElementById(
            "filterNoBukti"
        ).value.toLowerCase();

    const namaAkun =
        document.getElementById(
            "filterNamaAkun"
        ).value.toLowerCase();

    const keterangan =
        document.getElementById(
            "filterKeterangan"
        ).value.toLowerCase();

    const rows =
        document.querySelectorAll(
            "#penyesuaianHistory tr"
        );

    rows.forEach(row=>{

        const tanggal =
            row.cells[0].innerText;

        const text =
            row.innerText.toLowerCase();

        let tampil = true;

        if(
            noBukti &&
            !text.includes(noBukti)
        ){
            tampil = false;
        }

        if(
            namaAkun &&
            !text.includes(namaAkun)
        ){
            tampil = false;
        }

        if(
            keterangan &&
            !text.includes(keterangan)
        ){
            tampil = false;
        }

        row.style.display =
            tampil
            ? ""
            : "none";

    });

}

function resetFilterPenyesuaian(){

    document.getElementById(
        "tanggalAwal"
    ).value = "";

    document.getElementById(
        "tanggalAkhir"
    ).value = "";

    document.getElementById(
        "filterNoBukti"
    ).value = "";

    document.getElementById(
        "filterNamaAkun"
    ).value = "";

    document.getElementById(
        "filterKeterangan"
    ).value = "";

    loadPenyesuaianHistory();
    document.getElementById(
    "noBukti"
).readOnly = false;

}

function exportPenyesuaianExcel(){

    const table =
        document
        .querySelector(
            "#penyesuaianHistory"
        )
        .closest("table");

    const wb =
        XLSX.utils.book_new();

    const ws =
        XLSX.utils.table_to_sheet(
            table
        );

    XLSX.utils.book_append_sheet(
        wb,
        ws,
        "Penyesuaian"
    );

    XLSX.writeFile(
        wb,
        "Jurnal_Penyesuaian.xlsx"
    );

}

function exportPenyesuaianPDF(){

    const { jsPDF } =
        window.jspdf;

    const doc =
        new jsPDF();

    doc.text(
        "Jurnal Penyesuaian",
        14,
        15
    );

    doc.autoTable({

        html:
        document
        .querySelector(
            "#penyesuaianHistory"
        )
        .closest("table"),

        startY: 20

    });

    doc.save(
        "Jurnal_Penyesuaian.pdf"
    );

}

document.addEventListener(

    "DOMContentLoaded",

    ()=>{

        if(
            document.getElementById(
                "penyesuaianHistory"
            )
        ){

            loadPenyesuaian();

        }

    }

);

function formatDateInput(date){

    const d =
        new Date(date);

    return d
        .toISOString()
        .split("T")[0];

}


