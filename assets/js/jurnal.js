/* =====================================================
   AUMARIX ACCOUNTING SYSTEM
   FILE : jurnal-umum.js
===================================================== */

let coaList = [];
let jurnalRows = 0;
let jurnalHistoryData = [];
let editMode = false;
let editNoBukti = "";

/* ==========================
   HELPER
========================== */

function getEl(id){
    return document.getElementById(id);
}

function getVal(id){
    return getEl(id)?.value?.trim() || "";
}

function setVal(id, value){
    const el = getEl(id);
    if(el) el.value = value ?? "";
}

function setHtml(id, value){
    const el = getEl(id);
    if(el) el.innerHTML = value;
}

function escapeHTML(value){
    return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

function toNumberJurnal(value){
    return Number(value || 0);
}

function rupiahJurnal(value){
    if(typeof rupiah === "function"){
        return rupiah(value);
    }

    if(typeof numberFormat === "function"){
        return numberFormat(value);
    }

    return new Intl.NumberFormat("id-ID", {
        style:"currency",
        currency:"IDR",
        maximumFractionDigits:0
    }).format(Number(value || 0));
}

function formatTanggalJurnal(value){
    if(!value) return "";

    if(typeof formatTanggal === "function"){
        return formatTanggal(value);
    }

    const d = new Date(value);

    if(isNaN(d.getTime())){
        return value;
    }

    return d.toLocaleDateString("id-ID");
}

function normalizeBackendRows(result){
    return result?.data?.rows || result?.data || [];
}

/* ==========================
   LOAD HALAMAN
========================== */

async function loadJurnal(){
    await loadCOAForJurnal();
    loadFilterNamaAkun();

    resetJurnalForm();

    await loadJurnalHistory();
}

/* ==========================
   LOAD COA
========================== */

async function loadCOAForJurnal(){
    try{
        const result = await apiGet("getCOA");

        if(result.success){
            coaList = normalizeBackendRows(result);
        }else{
            coaList = [];
            alert(result.message || "Gagal mengambil data COA");
        }

    }catch(err){
        console.error(err);
        alert("Gagal mengambil COA: " + err.message);
    }
}

function loadFilterNamaAkun(){
    const select = getEl("filterNamaAkun");
    if(!select) return;

    select.innerHTML = `<option value="">Semua Akun</option>`;

    const akunUnik = [
        ...new Set(
            coaList
                .map(akun => akun["Nama Akun"])
                .filter(Boolean)
        )
    ].sort();

    akunUnik.forEach(nama => {
        select.innerHTML += `
            <option value="${escapeHTML(nama)}">
                ${escapeHTML(nama)}
            </option>
        `;
    });
}

/* ==========================
   RESET FORM
========================== */

function resetJurnalForm(){
    editMode = false;
    editNoBukti = "";

    setVal("editNoBukti", "");
    setVal("tanggalJurnal", new Date().toISOString().split("T")[0]);
    setVal("noBukti", "");
    setVal("keterangan", "");

    const tbody = getEl("jurnalDetail");
    if(tbody) tbody.innerHTML = "";

    jurnalRows = 0;

    addJurnalRow();
    addJurnalRow();

    calculateBalance();
}

/* ==========================
   TAMBAH BARIS
========================== */

function addJurnalRow(){
    jurnalRows++;

    const tbody = getEl("jurnalDetail");
    if(!tbody) return;

    const emptyRow = tbody.querySelector(".empty-table");
    if(emptyRow){
        tbody.innerHTML = "";
    }

    const options = coaList.map(a => `
        <option value="${escapeHTML(a["Kode Akun"])}">
            ${escapeHTML(a["Kode Akun"])} - ${escapeHTML(a["Nama Akun"])}
        </option>
    `).join("");

    tbody.insertAdjacentHTML("beforeend", `
        <tr id="row${jurnalRows}" class="jurnal-row">

            <td>
                <select
                    class="form-control kode-akun"
                    onchange="setNamaAkun(this, ${jurnalRows})">

                    <option value="">Pilih Akun</option>
                    ${options}

                </select>
            </td>

            <td>
                <input
                    type="text"
                    id="namaAkun${jurnalRows}"
                    class="form-control nama-akun"
                    readonly>
            </td>

            <td>
                <input
                    type="number"
                    value="0"
                    min="0"
                    class="form-control debit text-right"
                    oninput="handleDebitKredit(this, 'debit')">
            </td>

            <td>
                <input
                    type="number"
                    value="0"
                    min="0"
                    class="form-control kredit text-right"
                    oninput="handleDebitKredit(this, 'kredit')">
            </td>

            <td>
                <button
                    type="button"
                    class="btn btn-danger btn-sm"
                    onclick="removeRow(${jurnalRows})">
                    🗑
                </button>
            </td>

        </tr>
    `);

    calculateBalance();
}

/* ==========================
   SET NAMA AKUN
========================== */

function setNamaAkun(select, row){
    const akun = coaList.find(x =>
        String(x["Kode Akun"]) === String(select.value)
    );

    setVal(`namaAkun${row}`, akun ? akun["Nama Akun"] : "");
}

/* ==========================
   DEBIT KREDIT
========================== */

function handleDebitKredit(input, type){
    const row = input.closest("tr");
    if(!row) return;

    const debit = row.querySelector(".debit");
    const kredit = row.querySelector(".kredit");

    if(type === "debit" && toNumberJurnal(input.value) > 0){
        kredit.value = 0;
    }

    if(type === "kredit" && toNumberJurnal(input.value) > 0){
        debit.value = 0;
    }

    calculateBalance();
}

/* ==========================
   HAPUS BARIS
========================== */

function removeRow(row){
    const tr = getEl(`row${row}`);
    if(tr) tr.remove();

    calculateBalance();
}

/* ==========================
   HITUNG BALANCE FORM INPUT
========================== */

function calculateBalance(){
    let totalDebit = 0;
    let totalKredit = 0;
    let totalBaris = 0;

    document.querySelectorAll("#jurnalDetail tr.jurnal-row").forEach(row => {
        totalBaris++;

        totalDebit += toNumberJurnal(row.querySelector(".debit")?.value);
        totalKredit += toNumberJurnal(row.querySelector(".kredit")?.value);
    });

    setHtml("totalDebit", rupiahJurnal(totalDebit));
    setHtml("totalKredit", rupiahJurnal(totalKredit));

    const balanced =
        Math.abs(totalDebit - totalKredit) < 1 &&
        totalDebit > 0;

    if(balanced){
        setHtml("balanceInfo", "🟢 BALANCE");
        setHtml("statusBalance", "🟢 BALANCE");

        getEl("balanceInfo")?.classList.remove("status-danger", "balance-error");
        getEl("balanceInfo")?.classList.add("status-success", "balance-ok");

        getEl("statusBalance")?.classList.remove("status-danger", "balance-error");
        getEl("statusBalance")?.classList.add("status-success", "balance-ok");
    }else{
        setHtml("balanceInfo", "🔴 TIDAK BALANCE");
        setHtml("statusBalance", "🔴 TIDAK BALANCE");

        getEl("balanceInfo")?.classList.remove("status-success", "balance-ok");
        getEl("balanceInfo")?.classList.add("status-danger", "balance-error");

        getEl("statusBalance")?.classList.remove("status-success", "balance-ok");
        getEl("statusBalance")?.classList.add("status-danger", "balance-error");
    }

    return {
        totalDebit,
        totalKredit,
        balanced,
        totalBaris
    };
}

/* ==========================
   SUMMARY RIWAYAT/FILTER
========================== */

function updateSummaryFromData(data){
    let totalDebit = 0;
    let totalKredit = 0;

    data.forEach(row => {
        totalDebit += toNumberJurnal(row["Debit"]);
        totalKredit += toNumberJurnal(row["Kredit"]);
    });

    setHtml("summaryBaris", data.length);
    setHtml("totalDebitCard", rupiahJurnal(totalDebit));
    setHtml("totalKreditCard", rupiahJurnal(totalKredit));

    if(Math.abs(totalDebit - totalKredit) < 1){
        setHtml("summaryStatus", "🟢 Balance");
    }else{
        setHtml("summaryStatus", "🔴 Tidak Balance");
    }
}

/* ==========================
   AMBIL DETAIL FORM
========================== */

function getJurnalDetailFromForm(){
    const rows = document.querySelectorAll("#jurnalDetail tr.jurnal-row");

    if(rows.length < 2){
        throw new Error("Minimal 2 baris jurnal");
    }

    const detail = [];

    rows.forEach(row => {
        const kodeAkun = row.querySelector(".kode-akun")?.value || "";
        const namaAkun = row.querySelector(".nama-akun")?.value || "";
        const debit = toNumberJurnal(row.querySelector(".debit")?.value);
        const kredit = toNumberJurnal(row.querySelector(".kredit")?.value);

        if(!kodeAkun){
            throw new Error("Masih ada akun yang belum dipilih");
        }

        if(debit > 0 && kredit > 0){
            throw new Error("Satu baris tidak boleh berisi debit dan kredit sekaligus");
        }

        if(debit === 0 && kredit === 0){
            throw new Error("Setiap baris harus memiliki nilai debit atau kredit");
        }

        detail.push({
            kodeAkun,
            namaAkun,
            debit,
            kredit
        });
    });

    return detail;
}

/* ==========================
   SIMPAN JURNAL
========================== */

async function saveJurnal(){
    try{
        const tanggal = getVal("tanggalJurnal");
        const noBukti = getVal("noBukti");
        const keterangan = getVal("keterangan");

        if(!tanggal){
            alert("Tanggal wajib diisi");
            return;
        }

        if(!noBukti){
            alert("No Bukti wajib diisi");
            return;
        }

        if(!keterangan){
            alert("Keterangan wajib diisi");
            return;
        }

        const detail = getJurnalDetailFromForm();
        const balance = calculateBalance();

        if(!balance.balanced){
            alert("Debit dan Kredit harus balance");
            return;
        }

        const data = {
            tanggal,
            noBukti,
            keterangan,
            detail
        };

        const action = editMode ? "updateJurnalUmum" : "saveJurnalUmum";

        const payload = editMode
            ? {
                ...data,
                noBukti: editNoBukti || noBukti
            }
            : data;

        const result = await apiPost(action, payload);

        if(result.success){
            alert(
                editMode
                    ? "✅ Jurnal berhasil diperbarui"
                    : "✅ Jurnal berhasil disimpan"
            );

            resetJurnalForm();
            await loadJurnalHistory();

        }else{
            alert("❌ " + (result.message || "Gagal menyimpan jurnal"));
        }

    }catch(err){
        console.error(err);
        alert("❌ " + err.message);
    }
}

/* ==========================
   LOAD HISTORY
========================== */

async function loadJurnalHistory(){
    try{
        const result = await apiGet("getJurnalUmum");

        if(!result.success){
            alert(result.message || "Gagal mengambil jurnal umum");
            return;
        }

        jurnalHistoryData = normalizeBackendRows(result);

        renderJurnalHistory(jurnalHistoryData);
        updateSummaryFromData(jurnalHistoryData);

    }catch(err){
        console.error(err);
        alert("Gagal mengambil riwayat jurnal: " + err.message);
    }
}

function renderJurnalHistory(data){
    const tbody = getEl("jurnalHistory");
    if(!tbody) return;

    if(!data.length){
        tbody.innerHTML = `
            <tr>
                <td colspan="8" class="empty-table">
                    Data jurnal belum ada
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = data.map(row => {
        const noBukti = escapeHTML(row["No. Bukti"]);

        return `
            <tr>
                <td>${formatTanggalJurnal(row["Tanggal"])}</td>
                <td>${noBukti}</td>
                <td>${escapeHTML(row["Keterangan"])}</td>
                <td>${escapeHTML(row["Kode Akun"])}</td>
                <td>${escapeHTML(row["Nama Akun"])}</td>
                <td class="text-right">${rupiahJurnal(row["Debit"])}</td>
                <td class="text-right">${rupiahJurnal(row["Kredit"])}</td>
                <td class="table-actions">
                    <button
                        type="button"
                        class="btn btn-warning btn-sm"
                        onclick="editJurnal('${noBukti}')">
                        ✏️
                    </button>

                    <button
                        type="button"
                        class="btn btn-danger btn-sm"
                        onclick="deleteJurnal('${noBukti}')">
                        🗑️
                    </button>
                </td>
            </tr>
        `;
    }).join("");
}

/* ==========================
   DELETE JURNAL
========================== */

async function deleteJurnal(noBukti){
    if(!confirm(`Hapus jurnal ${noBukti}?`)) return;

    try{
        const result = await apiPost("deleteJurnalUmum", {
            noBukti: noBukti
        });

        if(result.success){
            alert("✅ Jurnal berhasil dihapus");
            await loadJurnalHistory();
        }else{
            alert("❌ " + (result.message || "Gagal menghapus jurnal"));
        }

    }catch(err){
        console.error(err);
        alert("❌ " + err.message);
    }
}

/* ==========================
   EDIT JURNAL
========================== */

async function editJurnal(noBukti){
    try{
        const result = await apiGet("getJurnalUmum");

        if(!result.success) return;

        const data = normalizeBackendRows(result).filter(row =>
            String(row["No. Bukti"]) === String(noBukti)
        );

        if(data.length === 0){
            alert("Data jurnal tidak ditemukan");
            return;
        }

        editMode = true;
        editNoBukti = noBukti;

        setVal("editNoBukti", noBukti);
        setVal("noBukti", noBukti);
        setVal("keterangan", data[0]["Keterangan"]);

        const d = new Date(data[0]["Tanggal"]);
        if(!isNaN(d.getTime())){
            setVal("tanggalJurnal", d.toISOString().split("T")[0]);
        }

        const tbody = getEl("jurnalDetail");
        if(tbody) tbody.innerHTML = "";

        jurnalRows = 0;

        data.forEach(item => {
            addJurnalRow();

            const row = jurnalRows;
            const select = document.querySelector(`#row${row} .kode-akun`);

            select.value = item["Kode Akun"];
            setNamaAkun(select, row);

            document.querySelector(`#row${row} .debit`).value =
                toNumberJurnal(item["Debit"]);

            document.querySelector(`#row${row} .kredit`).value =
                toNumberJurnal(item["Kredit"]);
        });

        calculateBalance();

        window.scrollTo({
            top:0,
            behavior:"smooth"
        });

    }catch(err){
        console.error(err);
        alert("❌ " + err.message);
    }
}

/* ==========================
   FILTER JURNAL
========================== */

function filterJurnal(){
    const tglAwal = getVal("tanggalAwal");
    const tglAkhir = getVal("tanggalAkhir");
    const noBukti = getVal("filterNoBukti").toLowerCase();
    const namaAkun = getVal("filterNamaAkun").toLowerCase();
    const keterangan = getVal("filterKeterangan").toLowerCase();

    let data = [...jurnalHistoryData];

    if(tglAwal){
        data = data.filter(row =>
            new Date(row["Tanggal"]) >= new Date(tglAwal)
        );
    }

    if(tglAkhir){
        data = data.filter(row =>
            new Date(row["Tanggal"]) <= new Date(tglAkhir)
        );
    }

    if(noBukti){
        data = data.filter(row =>
            String(row["No. Bukti"] || "")
                .toLowerCase()
                .includes(noBukti)
        );
    }

    if(namaAkun){
        data = data.filter(row =>
            String(row["Nama Akun"] || "")
                .toLowerCase() === namaAkun
        );
    }

    if(keterangan){
        data = data.filter(row =>
            String(row["Keterangan"] || "")
                .toLowerCase()
                .includes(keterangan)
        );
    }

    renderJurnalHistory(data);
    updateSummaryFromData(data);
}

/* ==========================
   RESET FILTER
========================== */

function resetFilterJurnal(){
    setVal("tanggalAwal", "");
    setVal("tanggalAkhir", "");
    setVal("filterNoBukti", "");
    setVal("filterNamaAkun", "");
    setVal("filterKeterangan", "");

    renderJurnalHistory(jurnalHistoryData);
    updateSummaryFromData(jurnalHistoryData);
}

/* ==========================
   EXPORT EXCEL
========================== */

function exportJurnalExcel(){
    const data = jurnalHistoryData;

    if(!data.length){
        alert("Data jurnal kosong");
        return;
    }

    const rows = data.map(row => ({
        "Tanggal": formatTanggalJurnal(row["Tanggal"]),
        "No Bukti": row["No. Bukti"],
        "Keterangan": row["Keterangan"],
        "Kode Akun": row["Kode Akun"],
        "Nama Akun": row["Nama Akun"],
        "Debit": toNumberJurnal(row["Debit"]),
        "Kredit": toNumberJurnal(row["Kredit"])
    }));

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(rows);

    XLSX.utils.book_append_sheet(wb, ws, "Jurnal Umum");

    XLSX.writeFile(
        wb,
        `JurnalUmum_${new Date().toISOString().slice(0,10)}.xlsx`
    );
}

/* ==========================
   EXPORT PDF
========================== */

function exportJurnalPDF(){
    if(!jurnalHistoryData.length){
        alert("Data jurnal kosong");
        return;
    }

    const { jsPDF } = window.jspdf;

    const doc = new jsPDF({
        orientation:"landscape",
        unit:"mm",
        format:"a4"
    });

    doc.setFontSize(16);
    doc.text("AUMARIX ACCOUNTING SYSTEM", 14, 15);

    doc.setFontSize(12);
    doc.text("JURNAL UMUM", 14, 23);

    const body = jurnalHistoryData.map(row => [
        formatTanggalJurnal(row["Tanggal"]),
        row["No. Bukti"] || "",
        row["Keterangan"] || "",
        row["Kode Akun"] || "",
        row["Nama Akun"] || "",
        rupiahJurnal(row["Debit"]),
        rupiahJurnal(row["Kredit"])
    ]);

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
        body:body,
        theme:"grid",
        styles:{
            fontSize:8,
            cellPadding:2
        },
        headStyles:{
            fillColor:[37,99,235],
            textColor:255
        }
    });

    doc.save(
        `JurnalUmum_${new Date().toISOString().slice(0,10)}.pdf`
    );
}

/* ==========================
   AUTO LOAD
========================== */

if(document.readyState === "loading"){
    document.addEventListener("DOMContentLoaded", loadJurnal);
}else{
    loadJurnal();
}