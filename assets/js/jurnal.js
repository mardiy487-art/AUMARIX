/* =====================================================
   AUMARIX ACCOUNTING SYSTEM
   JURNAL.JS
===================================================== */

let coaList = [];
let jurnalRows = 0;

let editMode = false;
let editNoBukti = "";

/* ==========================
   LOAD HALAMAN
========================== */

async function loadJurnal(){

    await loadCOAForJurnal();

    loadFilterNamaAkun();

    addJurnalRow();

    document
    .getElementById(
        "tanggalJurnal"
    )
    .value =

    new Date()
    .toISOString()
    .split("T")[0];

    await loadSummaryJurnal();

    await loadJurnalHistory();

}

/* ==========================
   LOAD COA
========================== */

async function loadCOAForJurnal(){

    const result =
        await apiGet(
            "getCOA"
        );

    if(result.success){

        coaList =
            result.data || [];

    }

}

function loadFilterNamaAkun(){

    const select =
        document.getElementById(
            "filterNamaAkun"
        );

    if(!select) return;

    select.innerHTML = `
        <option value="">
            Semua Akun
        </option>
    `;

    const akunUnik =

        [...new Set(

            coaList.map(
                akun =>
                akun["Nama Akun"]
            )

        )];

    akunUnik.sort();

    akunUnik.forEach(nama=>{

        select.innerHTML += `

            <option value="${nama}">
                ${nama}
            </option>

        `;

    });

}

/* ==========================
   TAMBAH BARIS
========================== */

function addJurnalRow(){

    jurnalRows++;

    const tbody =
        document.getElementById(
            "jurnalDetail"
        );

    const options =
        coaList.map(a =>

            `<option value="${a["Kode Akun"]}">
                ${a["Kode Akun"]} -
                ${a["Nama Akun"]}
            </option>`

        ).join("");

    tbody.insertAdjacentHTML(

        "beforeend",

        `
        <tr id="row${jurnalRows}">

            <td>

                <select
                    class="form-control"
                    onchange="setNamaAkun(this,${jurnalRows})">

                    <option value="">
                        Pilih Akun
                    </option>

                    ${options}

                </select>

            </td>

            <td>

                <input
                    type="text"
                    id="namaAkun${jurnalRows}"
                    class="form-control"
                    readonly>

            </td>

            <td>

                <input
                    type="number"
                    value="0"
                    class="form-control debit"
                    oninput="calculateBalance()">

            </td>

            <td>

                <input
                    type="number"
                    value="0"
                    class="form-control kredit"
                    oninput="calculateBalance()">

            </td>

            <td>

                <button
                    class="btn btn-danger"
                    onclick="removeRow(${jurnalRows})">

                    Hapus

                </button>

            </td>

        </tr>
        `

    );

}

/* ==========================
   SET NAMA AKUN
========================== */

function setNamaAkun(select,row){

    const akun =
        coaList.find(

            x =>
            x["Kode Akun"] ==
            select.value

        );

    document.getElementById(
        `namaAkun${row}`
    ).value =

    akun
    ? akun["Nama Akun"]
    : "";

}

/* ==========================
   HAPUS BARIS
========================== */

function removeRow(row){

    document
    .getElementById(
        `row${row}`
    )
    .remove();

    calculateBalance();

}

/* ==========================
   HITUNG BALANCE
========================== */

function calculateBalance(){

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

    document
    .getElementById(
        "totalDebit"
    )
    .innerText =
    rupiah(totalDebit);

    document
    .getElementById(
        "totalKredit"
    )
    .innerText =
    rupiah(totalKredit);

    const status =
        document.getElementById(
            "balanceInfo"
        );

    const statusField =
        document.getElementById(
            "statusBalance"
        );

 if(

    Math.abs(
        totalDebit -
        totalKredit
    ) < 1

    &&

    totalDebit > 0

)
    {

        status.innerHTML =
        "🟢 BALANCE";

        status.className =
        "balance-status balance-ok";

        statusField.innerHTML =
        "🟢 BALANCE";

    }

    else{

        status.innerHTML =
        "🔴 TIDAK BALANCE";

        status.className =
        "balance-status balance-error";

        statusField.innerHTML =
        "🔴 TIDAK BALANCE";


    }

}
/* ==========================
   SIMPAN JURNAL
========================== */

/* ==========================
   SIMPAN JURNAL
========================== */

async function saveJurnal(){

    try{

        const rows =
            document.querySelectorAll(
                "#jurnalDetail tr"
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

            const select =
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

            const kodeAkun =
                select
                ? select.value
                : "";

            if(!kodeAkun){

                throw new Error(
                    "Masih ada akun yang belum dipilih"
                );

            }

            const item = {

                kodeAkun:
                    kodeAkun,

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

   if(
    Math.abs(
        totalDebit -
        totalKredit
    ) >= 1
){

    alert(
        "Debit dan Kredit harus balance"
    );

    return;

}

        const noBukti =

    document
    .getElementById(
        "noBukti"
    )
    .value
    .trim();

if(!noBukti){

    alert(
        "No Bukti wajib diisi"
    );

    return;

}

const data = {

    tanggal:
    document.getElementById(
        "tanggalJurnal"
    ).value,

    noBukti:
    noBukti,

    keterangan:
    document.getElementById(
        "keterangan"
    ).value,

    detail:
    detail

};


        console.log(
            "DATA KIRIM",
            data
        );

        const action =

    editMode

    ?

    "updateJurnalUmum"

    :

    "saveJurnalUmum";

const result =

    await apiPost(
        action,
        data
    );

      if(result.success){

    editMode = false;

    editNoBukti = "";

    alert(
        "✅ Jurnal berhasil disimpan"
    );

    document
    .getElementById(
        "jurnalDetail"
    )
    .innerHTML = "";

    document
    .getElementById(
        "noBukti"
    )
    .value = "";

    document
    .getElementById(
        "keterangan"
    )
    .value = "";

    jurnalRows = 0;

    addJurnalRow();

    calculateBalance();

    await loadSummaryJurnal();

    await loadJurnalHistory();

}
        else{

            alert(
                "❌ " +
                result.message
            );

        }

    }catch(err){

        alert(
            "❌ " +
            err.message
        );

        console.error(err);

    }

}

/* ==========================
   HISTORY
========================== */

async function loadJurnalHistory(){

    const result =
        await apiGet(
            "getJurnalUmum"
        );

    if(!result.success)
        return;

    const tbody =
        document.getElementById(
            "jurnalHistory"
        );

    tbody.innerHTML = "";

    result.data.forEach(row=>{

        tbody.innerHTML += `

        <tr>

            <td>
    ${formatTanggal(
        row["Tanggal"]
    )}
</td>

            <td>${row["No. Bukti"]}</td>

            <td>${row["Keterangan"]}</td>

            <td>${row["Kode Akun"]}</td>

            <td>${row["Nama Akun"]}</td>

            <td class="text-right">
                ${numberFormat(row["Debit"])}
            </td>

            <td class="text-right">
    ${numberFormat(row["Kredit"])}
</td>

<td>

    <button
        class="btn btn-warning btn-sm"
        onclick="editJurnal(
            '${row["No. Bukti"]}'
        )">

        ✏️

    </button>

    <button
        class="btn btn-danger btn-sm"
        onclick="deleteJurnal(
            '${row["No. Bukti"]}'
        )">

        🗑️

    </button>

</td>

        </tr>

        `;

    });

}

async function loadSummaryJurnal(){

    const result =
        await apiGet(
            "getJurnalUmum"
        );

    if(!result.success)
        return;

    let totalDebit = 0;
    let totalKredit = 0;

    result.data.forEach(row=>{

        totalDebit +=
        Number(
            row["Debit"] || 0
        );

        totalKredit +=
        Number(
            row["Kredit"] || 0
        );

    });

    document
    .getElementById(
        "totalDebitCard"
    )
    .innerText =
    rupiah(totalDebit);

    document
    .getElementById(
        "totalKreditCard"
    )
    .innerText =
    rupiah(totalKredit);

    document
.getElementById(
    "summaryBaris"
)
.innerText =
result.data.length;

const summaryStatus =

    document.getElementById(
        "summaryStatus"
    );

if(
    Math.abs(
        totalDebit -
        totalKredit
    ) < 1
){

    summaryStatus.innerHTML =
        "🟢 Balance";

}
else{

    summaryStatus.innerHTML =
        "🔴 Tidak Balance";

}
}



async function deleteJurnal(
    noBukti
){

    if(
        !confirm(
            "Hapus jurnal ini?"
        )
    ){
        return;
    }

    const result =
        await apiPost(

            "deleteJurnalUmum",

            {
                noBukti
            }

        );

   if(result.success){

    alert(
        "Jurnal berhasil dihapus"
    );

    await loadSummaryJurnal();

    await loadJurnalHistory();

}
    else{

        alert(
            result.message
        );

    }

}

async function editJurnal(
    noBukti
){

    const result =
        await apiGet(
            "getJurnalUmum"
        );

    if(!result.success)
        return;

    const data =

        result.data.filter(

            x =>
            x["No. Bukti"] ===
            noBukti

        );

    if(data.length === 0)
        return;

    editMode = true;

    editNoBukti = noBukti;

    document
    .getElementById(
        "tanggalJurnal"
    )
    .value =
    new Date(
        data[0]["Tanggal"]
    )
    .toISOString()
    .split("T")[0];

    document
    .getElementById(
        "noBukti"
    )
    .value =
    noBukti;

    document
    .getElementById(
        "keterangan"
    )
    .value =
    data[0]["Keterangan"];

    document
    .getElementById(
        "jurnalDetail"
    )
    .innerHTML = "";

    jurnalRows = 0;

    data.forEach(item=>{

        addJurnalRow();

        const row =
            jurnalRows;

        const select =
            document.querySelector(
                `#row${row} select`
            );

        select.value =
            item["Kode Akun"];

        setNamaAkun(
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

    calculateBalance();

    window.scrollTo({

        top:0,

        behavior:"smooth"

    });

}

function filterJurnal(){

    const tglAwal =
        document
        .getElementById(
            "tanggalAwal"
        )
        .value;

    const tglAkhir =
        document
        .getElementById(
            "tanggalAkhir"
        )
        .value;

    const keywordNoBukti =
        document
        .getElementById(
            "filterNoBukti"
        )
        .value
        .toLowerCase();

    const keywordNama =
        document
        .getElementById(
            "filterNamaAkun"
        )
        .value
        .toLowerCase();

    const keywordKet =
        document
        .getElementById(
            "filterKeterangan"
        )
        .value
        .toLowerCase();

    document
    .querySelectorAll(
        "#jurnalHistory tr"
    )
    .forEach(tr=>{

        const tanggal =
            tr.cells[0]
            .innerText;

        const text =
            tr.innerText
            .toLowerCase();

        let tampil = true;

        if(keywordNoBukti){

            tampil =
            tampil &&
            text.includes(
                keywordNoBukti
            );

        }

        if(keywordNama){

            tampil =
            tampil &&
            text.includes(
                keywordNama
            );

        }

        if(keywordKet){

            tampil =
            tampil &&
            text.includes(
                keywordKet
            );

        }

        if(tglAwal || tglAkhir){

            const parts =
                tanggal.split("/");

            const rowDate =
                new Date(
                    parts[2],
                    parts[1]-1,
                    parts[0]
                );

            if(tglAwal){

                tampil =
                tampil &&
                rowDate >=
                new Date(tglAwal);

            }

            if(tglAkhir){

                tampil =
                tampil &&
                rowDate <=
                new Date(tglAkhir);

            }

        }

        tr.style.display =
            tampil
            ? ""
            : "none";

    });

}

function resetFilterJurnal(){

    document
    .getElementById(
        "filterNoBukti"
    )
    .value = "";

    document
    .getElementById(
        "filterNamaAkun"
    )
    .value = "";

    document
    .getElementById(
        "filterKeterangan"
    )
    .value = "";

    document
    .querySelectorAll(
        "#jurnalHistory tr"
    )
    .forEach(tr=>{

        tr.style.display = "";

    });

    document
.getElementById(
    "tanggalAwal"
)
.value = "";

document
.getElementById(
    "tanggalAkhir"
)
.value = "";

}

async function exportJurnalExcel(){

    const result =
        await apiGet(
            "getJurnalUmum"
        );

    if(!result.success){

        alert(
            "Data jurnal tidak ditemukan"
        );

        return;

    }

    const data =

        result.data.map(row=>({

            "Tanggal":
            formatTanggal(
                row["Tanggal"]
            ),

            "No Bukti":
            row["No. Bukti"],

            "Keterangan":
            row["Keterangan"],

            "Kode Akun":
            row["Kode Akun"],

            "Nama Akun":
            row["Nama Akun"],

            "Debit":
            Number(
                row["Debit"] || 0
            ),

            "Kredit":
            Number(
                row["Kredit"] || 0
            )

        }));

    const wb =
        XLSX.utils.book_new();

    const ws =
        XLSX.utils.json_to_sheet(
            data
        );

    XLSX.utils.book_append_sheet(

        wb,

        ws,

        "Jurnal Umum"

    );

    XLSX.writeFile(

        wb,

        `JurnalUmum_${
            new Date()
            .toISOString()
            .slice(0,10)
        }.xlsx`

    );
    const range =

    XLSX.utils.decode_range(
        ws["!ref"]
    );

for(

    let R = 1;

    R <= range.e.r;

    ++R

){

    const debitCell =

        XLSX.utils.encode_cell({
            r:R,
            c:5
        });

    const kreditCell =

        XLSX.utils.encode_cell({
            r:R,
            c:6
        });

    if(ws[debitCell]){

        ws[debitCell].z =
        '#,##0';

    }

    if(ws[kreditCell]){

        ws[kreditCell].z =
        '#,##0';

    }

}

}

function exportJurnalPDF(){

    const {
        jsPDF
    } = window.jspdf;

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

        "JURNAL UMUM",

        14,

        23

    );

    const rows = [];

    document
    .querySelectorAll(
        "#jurnalHistory tr"
    )
    .forEach(tr=>{

        rows.push([

            tr.cells[0].innerText,
            tr.cells[1].innerText,
            tr.cells[2].innerText,
            tr.cells[3].innerText,
            tr.cells[4].innerText,
            tr.cells[5].innerText,
            tr.cells[6].innerText

        ]);

    });

    doc.autoTable({

        startY:30,

        head:[[
            "Tanggal",
            "No Bukti",
            "Keterangan",
            "Kode Akun",
            "Nama Akun",
            "Debit",
            "Kredit"
        ]],

        body:rows

    });

    doc.save(

        `JurnalUmum_${
            new Date()
            .toISOString()
            .slice(0,10)
        }.pdf`

    );

}