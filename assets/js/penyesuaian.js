/* =====================================================
   AUMARIX ACCOUNTING SYSTEM
   FILE : jurnal-penyesuaian.js
===================================================== */

let coaListPenyesuaian = [];
let penyesuaianRows = 0;
let penyesuaianHistoryData = [];
let editModePenyesuaian = false;
let editNoBuktiPenyesuaian = "";

/* ==========================
   HELPER
========================== */

function jpEl(id){
    return document.getElementById(id);
}

function jpVal(id){
    return jpEl(id)?.value?.trim() || "";
}

function jpSetVal(id, value){
    const el = jpEl(id);
    if(el) el.value = value ?? "";
}

function jpSetHtml(id, value){
    const el = jpEl(id);
    if(el) el.innerHTML = value;
}

function jpEscape(value){
    return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

function jpRows(result){
    return result?.data?.rows || result?.data || [];
}

function jpNumber(value){
    return Number(value || 0);
}

function jpRupiah(value){
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

function jpTanggal(value){
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

function jpDateInput(value){
    if(!value) return "";

    const d = new Date(value);

    if(isNaN(d.getTime())){
        return "";
    }

    return d.toISOString().split("T")[0];
}

/* ==========================
   LOAD HALAMAN
========================== */

async function loadPenyesuaian(){
    await loadCOAForPenyesuaian();
    loadFilterNamaAkunPenyesuaian();

    resetPenyesuaianForm();

    await loadPenyesuaianHistory();
}

/* ==========================
   LOAD COA
========================== */

async function loadCOAForPenyesuaian(){
    try{
        const result = await apiGet("getCOA");

        if(result.success){
            coaListPenyesuaian = jpRows(result);
        }else{
            coaListPenyesuaian = [];
            alert(result.message || "Gagal mengambil data COA");
        }

    }catch(err){
        console.error(err);
        alert("Gagal mengambil COA: " + err.message);
    }
}

/* ==========================
   FILTER AKUN
========================== */

function loadFilterNamaAkunPenyesuaian(){
    const select = jpEl("filterNamaAkunPenyesuaian");
    if(!select) return;

    select.innerHTML = `<option value="">Semua Akun</option>`;

    const akunUnik = [
        ...new Set(
            coaListPenyesuaian
                .map(akun => akun["Nama Akun"])
                .filter(Boolean)
        )
    ].sort();

    akunUnik.forEach(nama => {
        select.innerHTML += `
            <option value="${jpEscape(nama)}">
                ${jpEscape(nama)}
            </option>
        `;
    });
}

/* ==========================
   RESET FORM
========================== */

function resetPenyesuaianForm(){
    editModePenyesuaian = false;
    editNoBuktiPenyesuaian = "";

    jpSetVal("editModePenyesuaian", "");
    jpSetVal("oldNoBuktiPenyesuaian", "");
    jpSetVal("tanggalPenyesuaian", new Date().toISOString().split("T")[0]);
    jpSetVal("noBuktiPenyesuaian", "");
    jpSetVal("keteranganPenyesuaian", "");

    const noBuktiInput = jpEl("noBuktiPenyesuaian");
    if(noBuktiInput) noBuktiInput.readOnly = false;

    const tbody = jpEl("penyesuaianDetail");
    if(tbody) tbody.innerHTML = "";

    penyesuaianRows = 0;

    addPenyesuaianRow();
    addPenyesuaianRow();

    calculateBalancePenyesuaian();
}

/* ==========================
   TAMBAH BARIS
========================== */

function addPenyesuaianRow(){
    penyesuaianRows++;

    const tbody = jpEl("penyesuaianDetail");
    if(!tbody) return;

    const emptyRow = tbody.querySelector(".empty-table");
    if(emptyRow){
        tbody.innerHTML = "";
    }

    const options = coaListPenyesuaian.map(akun => `
        <option value="${jpEscape(akun["Kode Akun"])}">
            ${jpEscape(akun["Kode Akun"])} - ${jpEscape(akun["Nama Akun"])}
        </option>
    `).join("");

    tbody.insertAdjacentHTML("beforeend", `
        <tr id="rowPenyesuaian${penyesuaianRows}" class="penyesuaian-row">

            <td>
                <select
                    class="form-control kode-akun-penyesuaian"
                    onchange="setNamaAkunPenyesuaian(this, ${penyesuaianRows})">

                    <option value="">Pilih Akun</option>
                    ${options}

                </select>
            </td>

            <td>
                <input
                    type="text"
                    id="namaAkunPenyesuaian${penyesuaianRows}"
                    class="form-control nama-akun-penyesuaian"
                    readonly>
            </td>

            <td>
                <input
                    type="number"
                    value="0"
                    min="0"
                    class="form-control debit-penyesuaian text-right"
                    oninput="handleDebitKreditPenyesuaian(this, 'debit')">
            </td>

            <td>
                <input
                    type="number"
                    value="0"
                    min="0"
                    class="form-control kredit-penyesuaian text-right"
                    oninput="handleDebitKreditPenyesuaian(this, 'kredit')">
            </td>

            <td>
                <button
                    type="button"
                    class="btn btn-danger btn-sm"
                    onclick="removePenyesuaianRow(${penyesuaianRows})">
                    🗑
                </button>
            </td>

        </tr>
    `);

    calculateBalancePenyesuaian();
}

/* ==========================
   SET NAMA AKUN
========================== */

function setNamaAkunPenyesuaian(select, row){
    const akun = coaListPenyesuaian.find(x =>
        String(x["Kode Akun"]) === String(select.value)
    );

    jpSetVal(
        `namaAkunPenyesuaian${row}`,
        akun ? akun["Nama Akun"] : ""
    );
}

/* ==========================
   DEBIT KREDIT
========================== */

function handleDebitKreditPenyesuaian(input, type){
    const row = input.closest("tr");
    if(!row) return;

    const debit = row.querySelector(".debit-penyesuaian");
    const kredit = row.querySelector(".kredit-penyesuaian");

    if(type === "debit" && jpNumber(input.value) > 0){
        kredit.value = 0;
    }

    if(type === "kredit" && jpNumber(input.value) > 0){
        debit.value = 0;
    }

    calculateBalancePenyesuaian();
}

/* ==========================
   HAPUS BARIS
========================== */

function removePenyesuaianRow(row){
    const el = jpEl(`rowPenyesuaian${row}`);
    if(el) el.remove();

    calculateBalancePenyesuaian();
}

/* ==========================
   HITUNG BALANCE FORM
========================== */

function calculateBalancePenyesuaian(){
    let totalDebit = 0;
    let totalKredit = 0;
    let totalBaris = 0;

    document
        .querySelectorAll("#penyesuaianDetail tr.penyesuaian-row")
        .forEach(row => {
            totalBaris++;

            totalDebit += jpNumber(
                row.querySelector(".debit-penyesuaian")?.value
            );

            totalKredit += jpNumber(
                row.querySelector(".kredit-penyesuaian")?.value
            );
        });

    jpSetHtml("totalDebitPenyesuaian", jpRupiah(totalDebit));
    jpSetHtml("totalKreditPenyesuaian", jpRupiah(totalKredit));

    const balanced =
        Math.abs(totalDebit - totalKredit) < 1 &&
        totalDebit > 0;

    if(balanced){
        jpSetHtml("balanceInfoPenyesuaian", "🟢 BALANCE");
        jpSetHtml("statusBalancePenyesuaian", "🟢 BALANCE");

        jpEl("balanceInfoPenyesuaian")?.classList.remove("status-danger", "balance-error");
        jpEl("balanceInfoPenyesuaian")?.classList.add("status-success", "balance-ok");

        jpEl("statusBalancePenyesuaian")?.classList.remove("status-danger", "balance-error");
        jpEl("statusBalancePenyesuaian")?.classList.add("status-success", "balance-ok");
    }else{
        jpSetHtml("balanceInfoPenyesuaian", "🔴 TIDAK BALANCE");
        jpSetHtml("statusBalancePenyesuaian", "🔴 TIDAK BALANCE");

        jpEl("balanceInfoPenyesuaian")?.classList.remove("status-success", "balance-ok");
        jpEl("balanceInfoPenyesuaian")?.classList.add("status-danger", "balance-error");

        jpEl("statusBalancePenyesuaian")?.classList.remove("status-success", "balance-ok");
        jpEl("statusBalancePenyesuaian")?.classList.add("status-danger", "balance-error");
    }

    return {
        totalDebit,
        totalKredit,
        totalBaris,
        balanced
    };
}

/* ==========================
   SUMMARY RIWAYAT / FILTER
========================== */

function updateSummaryPenyesuaianFromData(data){
    let totalDebit = 0;
    let totalKredit = 0;

    data.forEach(row => {
        totalDebit += jpNumber(row["Debit"]);
        totalKredit += jpNumber(row["Kredit"]);
    });

    jpSetHtml("summaryBarisPenyesuaian", data.length);
    jpSetHtml("totalDebitCardPenyesuaian", jpRupiah(totalDebit));
    jpSetHtml("totalKreditCardPenyesuaian", jpRupiah(totalKredit));

    if(Math.abs(totalDebit - totalKredit) < 1){
        jpSetHtml("summaryStatusPenyesuaian", "🟢 Balance");
    }else{
        jpSetHtml("summaryStatusPenyesuaian", "🔴 Tidak Balance");
    }
}

/* ==========================
   AMBIL DETAIL FORM
========================== */

function getPenyesuaianDetailFromForm(){
    const rows = document.querySelectorAll("#penyesuaianDetail tr.penyesuaian-row");

    if(rows.length < 2){
        throw new Error("Minimal 2 baris jurnal penyesuaian");
    }

    const detail = [];

    rows.forEach(row => {
        const kodeAkun =
            row.querySelector(".kode-akun-penyesuaian")?.value || "";

        const namaAkun =
            row.querySelector(".nama-akun-penyesuaian")?.value || "";

        const debit =
            jpNumber(row.querySelector(".debit-penyesuaian")?.value);

        const kredit =
            jpNumber(row.querySelector(".kredit-penyesuaian")?.value);

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
   SIMPAN
========================== */

async function savePenyesuaian(){
    try{
        const tanggal = jpVal("tanggalPenyesuaian");
        const noBukti = jpVal("noBuktiPenyesuaian");
        const keterangan = jpVal("keteranganPenyesuaian");

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

        const detail = getPenyesuaianDetailFromForm();
        const balance = calculateBalancePenyesuaian();

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

        const action = editModePenyesuaian
            ? "updateJurnalPenyesuaian"
            : "saveJurnalPenyesuaian";

        const payload = editModePenyesuaian
            ? {
                ...data,
                noBukti: editNoBuktiPenyesuaian || noBukti
            }
            : data;

        const result = await apiPost(action, payload);

        if(result.success){
            alert(
                editModePenyesuaian
                    ? "✅ Jurnal penyesuaian berhasil diperbarui"
                    : "✅ Jurnal penyesuaian berhasil disimpan"
            );

            resetPenyesuaianForm();
            await loadPenyesuaianHistory();

        }else{
            alert("❌ " + (result.message || "Gagal menyimpan jurnal penyesuaian"));
        }

    }catch(err){
        console.error(err);
        alert("❌ " + err.message);
    }
}

/* ==========================
   LOAD HISTORY
========================== */

async function loadPenyesuaianHistory(){
    try{
        const result = await apiGet("getJurnalPenyesuaian");

        if(!result.success){
            alert(result.message || "Gagal mengambil jurnal penyesuaian");
            return;
        }

        penyesuaianHistoryData = jpRows(result);

        renderPenyesuaianHistory(penyesuaianHistoryData);
        updateSummaryPenyesuaianFromData(penyesuaianHistoryData);

    }catch(err){
        console.error(err);
        alert("Gagal mengambil riwayat penyesuaian: " + err.message);
    }
}

/* ==========================
   RENDER HISTORY
========================== */

function renderPenyesuaianHistory(data){
    const tbody = jpEl("penyesuaianHistory");
    if(!tbody) return;

    if(!data.length){
        tbody.innerHTML = `
            <tr>
                <td colspan="8" class="empty-table">
                    Data jurnal penyesuaian belum ada
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = data.map(row => {
        const noBukti = jpEscape(row["No. Bukti"]);

        return `
            <tr>
                <td>${jpTanggal(row["Tanggal"])}</td>
                <td>${noBukti}</td>
                <td>${jpEscape(row["Keterangan"])}</td>
                <td>${jpEscape(row["Kode Akun"])}</td>
                <td>${jpEscape(row["Nama Akun"])}</td>
                <td class="text-right">${jpRupiah(row["Debit"])}</td>
                <td class="text-right">${jpRupiah(row["Kredit"])}</td>
                <td class="table-actions">
                    <button
                        type="button"
                        class="btn btn-warning btn-sm"
                        onclick="editPenyesuaian('${noBukti}')">
                        ✏️
                    </button>

                    <button
                        type="button"
                        class="btn btn-danger btn-sm"
                        onclick="deletePenyesuaian('${noBukti}')">
                        🗑️
                    </button>
                </td>
            </tr>
        `;
    }).join("");
}

/* ==========================
   EDIT
========================== */

async function editPenyesuaian(noBukti){
    try{
        const result = await apiGet("getJurnalPenyesuaian");

        if(!result.success) return;

        const data = jpRows(result).filter(row =>
            String(row["No. Bukti"]) === String(noBukti)
        );

        if(data.length === 0){
            alert("Data jurnal penyesuaian tidak ditemukan");
            return;
        }

        editModePenyesuaian = true;
        editNoBuktiPenyesuaian = noBukti;

        jpSetVal("editModePenyesuaian", "EDIT");
        jpSetVal("oldNoBuktiPenyesuaian", noBukti);
        jpSetVal("noBuktiPenyesuaian", noBukti);
        jpSetVal("keteranganPenyesuaian", data[0]["Keterangan"]);
        jpSetVal("tanggalPenyesuaian", jpDateInput(data[0]["Tanggal"]));

        const noBuktiInput = jpEl("noBuktiPenyesuaian");
        if(noBuktiInput) noBuktiInput.readOnly = true;

        const tbody = jpEl("penyesuaianDetail");
        if(tbody) tbody.innerHTML = "";

        penyesuaianRows = 0;

        data.forEach(item => {
            addPenyesuaianRow();

            const row = penyesuaianRows;

            const select = document.querySelector(
                `#rowPenyesuaian${row} .kode-akun-penyesuaian`
            );

            select.value = item["Kode Akun"];

            setNamaAkunPenyesuaian(select, row);

            document.querySelector(
                `#rowPenyesuaian${row} .debit-penyesuaian`
            ).value = jpNumber(item["Debit"]);

            document.querySelector(
                `#rowPenyesuaian${row} .kredit-penyesuaian`
            ).value = jpNumber(item["Kredit"]);
        });

        calculateBalancePenyesuaian();

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
   DELETE
========================== */

async function deletePenyesuaian(noBukti){
    if(!confirm(`Hapus jurnal penyesuaian ${noBukti}?`)) return;

    try{
        const result = await apiPost("deleteJurnalPenyesuaian", {
            noBukti: noBukti
        });

        if(result.success){
            alert("✅ Jurnal penyesuaian berhasil dihapus");
            await loadPenyesuaianHistory();

        }else{
            alert("❌ " + (result.message || "Gagal menghapus jurnal penyesuaian"));
        }

    }catch(err){
        console.error(err);
        alert("❌ " + err.message);
    }
}

/* ==========================
   FILTER
========================== */

function filterPenyesuaian(){
    const tglAwal = jpVal("tanggalAwalPenyesuaian");
    const tglAkhir = jpVal("tanggalAkhirPenyesuaian");
    const noBukti = jpVal("filterNoBuktiPenyesuaian").toLowerCase();
    const namaAkun = jpVal("filterNamaAkunPenyesuaian").toLowerCase();
    const keterangan = jpVal("filterKeteranganPenyesuaian").toLowerCase();

    let data = [...penyesuaianHistoryData];

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

    renderPenyesuaianHistory(data);
    updateSummaryPenyesuaianFromData(data);
}

/* ==========================
   RESET FILTER
========================== */

function resetFilterPenyesuaian(){
    jpSetVal("tanggalAwalPenyesuaian", "");
    jpSetVal("tanggalAkhirPenyesuaian", "");
    jpSetVal("filterNoBuktiPenyesuaian", "");
    jpSetVal("filterNamaAkunPenyesuaian", "");
    jpSetVal("filterKeteranganPenyesuaian", "");

    renderPenyesuaianHistory(penyesuaianHistoryData);
    updateSummaryPenyesuaianFromData(penyesuaianHistoryData);
}

/* ==========================
   EXPORT EXCEL
========================== */

function exportPenyesuaianExcel(){
    const data = penyesuaianHistoryData;

    if(!data.length){
        alert("Data jurnal penyesuaian kosong");
        return;
    }

    const rows = data.map(row => ({
        "Tanggal": jpTanggal(row["Tanggal"]),
        "No Bukti": row["No. Bukti"],
        "Keterangan": row["Keterangan"],
        "Kode Akun": row["Kode Akun"],
        "Nama Akun": row["Nama Akun"],
        "Debit": jpNumber(row["Debit"]),
        "Kredit": jpNumber(row["Kredit"])
    }));

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(rows);

    XLSX.utils.book_append_sheet(wb, ws, "Jurnal Penyesuaian");

    XLSX.writeFile(
        wb,
        `JurnalPenyesuaian_${new Date().toISOString().slice(0,10)}.xlsx`
    );
}

/* ==========================
   EXPORT PDF
========================== */

function exportPenyesuaianPDF(){
    if(!penyesuaianHistoryData.length){
        alert("Data jurnal penyesuaian kosong");
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
    doc.text("JURNAL PENYESUAIAN", 14, 23);

    const body = penyesuaianHistoryData.map(row => [
        jpTanggal(row["Tanggal"]),
        row["No. Bukti"] || "",
        row["Keterangan"] || "",
        row["Kode Akun"] || "",
        row["Nama Akun"] || "",
        jpRupiah(row["Debit"]),
        jpRupiah(row["Kredit"])
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
        `JurnalPenyesuaian_${new Date().toISOString().slice(0,10)}.pdf`
    );
}

/* ==========================
   AUTO LOAD
========================== */

if(document.readyState === "loading"){
    document.addEventListener("DOMContentLoaded", loadPenyesuaian);
}else{
    loadPenyesuaian();
}