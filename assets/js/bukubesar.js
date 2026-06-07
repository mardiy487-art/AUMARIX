/* =====================================================
   AUMARIX ACCOUNTING SYSTEM
   FILE : buku-besar.js
===================================================== */

let bukuBesarData = null;
let coaBukuBesar = [];

/* ==========================
   HELPER
========================== */

function bbEl(id){
    return document.getElementById(id);
}

function bbVal(id){
    return bbEl(id)?.value?.trim() || "";
}

function bbSetText(id, value){
    const el = bbEl(id);
    if(el) el.innerHTML = value;
}

function bbEscape(value){
    return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

function bbRows(result){
    return result?.data?.rows || result?.data || [];
}

function bbNumber(value){
    return Number(value || 0);
}

function bbRupiah(value){
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

function bbTanggal(value){
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

/* ==========================
   INIT
========================== */

async function initBukuBesar(){
    await loadCOAFilter();
    resetBukuBesar();
}

/* ==========================
   LOAD COA FILTER
========================== */

async function loadCOAFilter(){
    try{
        const result = await apiGet("getCOA");

        if(!result.success){
            alert(result.message || "Gagal memuat COA");
            return;
        }

        coaBukuBesar = bbRows(result);

        const select = bbEl("filterAkun");
        if(!select) return;

        select.innerHTML = `
            <option value="">Pilih Akun</option>
        `;

        coaBukuBesar.forEach(row => {
            select.innerHTML += `
                <option value="${bbEscape(row["Kode Akun"])}">
                    ${bbEscape(row["Kode Akun"])} - ${bbEscape(row["Nama Akun"])}
                </option>
            `;
        });

    }catch(err){
        console.error(err);
        alert("Gagal memuat COA: " + err.message);
    }
}

/* ==========================
   LOAD BUKU BESAR
========================== */

async function loadBukuBesar(){
    try{
        const kodeAkun = bbVal("filterAkun");
        const tglAwal = bbVal("bbTanggalAwal");
        const tglAkhir = bbVal("bbTanggalAkhir");

        if(!kodeAkun){
            alert("Pilih akun terlebih dahulu");
            return;
        }

        if(tglAwal && tglAkhir && new Date(tglAwal) > new Date(tglAkhir)){
            alert("Tanggal awal tidak boleh lebih besar dari tanggal akhir");
            return;
        }

        const result = await apiGet("getBukuBesar", {
            kodeAkun,
            tglAwal,
            tglAkhir
        });

        if(!result.success){
            alert(result.message || "Gagal mengambil buku besar");
            return;
        }

        bukuBesarData = result.data;

        renderBukuBesar();

    }catch(err){
        console.error(err);
        alert("Terjadi kesalahan: " + err.message);
    }
}

/* ==========================
   RENDER BUKU BESAR
========================== */

function renderBukuBesar(){
    if(!bukuBesarData) return;

    bbSetText("bbKodeAkun", bbEscape(bukuBesarData.kodeAkun || bukuBesarData.akun?.["Kode Akun"] || "-"));
    bbSetText("bbNamaAkun", bbEscape(bukuBesarData.namaAkun || bukuBesarData.akun?.["Nama Akun"] || "-"));
    bbSetText("bbKelompok", bbEscape(bukuBesarData.kelompokAkun || bukuBesarData.akun?.["Kelompok Akun"] || "-"));

    bbSetText("bbJumlah", bukuBesarData.transaksi?.length || 0);
    bbSetText("bbSaldoAwal", bbRupiah(bukuBesarData.saldoAwal));
    bbSetText("bbDebit", bbRupiah(bukuBesarData.totalDebit));
    bbSetText("bbKredit", bbRupiah(bukuBesarData.totalKredit));
    bbSetText("bbSaldoAkhir", bbRupiah(bukuBesarData.saldoAkhir));

    renderBukuBesarTable();
}

/* ==========================
   TABLE
========================== */

function renderBukuBesarTable(){
    const tbody = bbEl("bbTable");
    if(!tbody) return;

    if(!bukuBesarData){
        tbody.innerHTML = `
            <tr>
                <td colspan="7" class="empty-table">
                    Pilih akun terlebih dahulu untuk menampilkan buku besar
                </td>
            </tr>
        `;
        return;
    }

    let html = `
        <tr class="saldo-awal-row">
            <td>-</td>
            <td>-</td>
            <td><strong>SALDO AWAL</strong></td>
            <td>-</td>
            <td class="text-right">-</td>
            <td class="text-right">-</td>
            <td class="text-right"><strong>${bbRupiah(bukuBesarData.saldoAwal)}</strong></td>
        </tr>
    `;

    const transaksi = bukuBesarData.transaksi || [];

    if(!transaksi.length){
        html += `
            <tr>
                <td colspan="7" class="empty-table">
                    Tidak ada transaksi pada periode ini
                </td>
            </tr>
        `;
    }else{
        transaksi.forEach(row => {
            html += `
                <tr>
                    <td>${bbTanggal(row["Tanggal"])}</td>
                    <td>${bbEscape(row["No. Bukti"] || "")}</td>
                    <td>${bbEscape(row["Keterangan"] || "")}</td>
                    <td>${bbEscape(row["Sumber"] || "-")}</td>
                    <td class="text-right">${bbRupiah(row["Debit"])}</td>
                    <td class="text-right">${bbRupiah(row["Kredit"])}</td>
                    <td class="text-right"><strong>${bbRupiah(row.saldo)}</strong></td>
                </tr>
            `;
        });
    }

    tbody.innerHTML = html;
}

/* ==========================
   RESET
========================== */

function resetBukuBesar(){
    const akun = bbEl("filterAkun");
    const awal = bbEl("bbTanggalAwal");
    const akhir = bbEl("bbTanggalAkhir");

    if(akun) akun.value = "";
    if(awal) awal.value = "";
    if(akhir) akhir.value = "";

    bukuBesarData = null;

    bbSetText("bbKodeAkun", "-");
    bbSetText("bbNamaAkun", "-");
    bbSetText("bbKelompok", "-");
    bbSetText("bbJumlah", "0");
    bbSetText("bbSaldoAwal", bbRupiah(0));
    bbSetText("bbDebit", bbRupiah(0));
    bbSetText("bbKredit", bbRupiah(0));
    bbSetText("bbSaldoAkhir", bbRupiah(0));

    renderBukuBesarTable();
}

/* ==========================
   EXPORT EXCEL
========================== */

function exportBukuBesarExcel(){
    if(!bukuBesarData){
        alert("Data Buku Besar kosong");
        return;
    }

    const rows = [];

    rows.push({
        "Tanggal":"-",
        "No Bukti":"-",
        "Keterangan":"SALDO AWAL",
        "Sumber":"-",
        "Debit":"",
        "Kredit":"",
        "Saldo":bbNumber(bukuBesarData.saldoAwal)
    });

    (bukuBesarData.transaksi || []).forEach(row => {
        rows.push({
            "Tanggal":bbTanggal(row["Tanggal"]),
            "No Bukti":row["No. Bukti"] || "",
            "Keterangan":row["Keterangan"] || "",
            "Sumber":row["Sumber"] || "",
            "Debit":bbNumber(row["Debit"]),
            "Kredit":bbNumber(row["Kredit"]),
            "Saldo":bbNumber(row.saldo)
        });
    });

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(rows);

    XLSX.utils.book_append_sheet(wb, ws, "Buku Besar");

    XLSX.writeFile(
        wb,
        `BukuBesar_${bukuBesarData.kodeAkun || "Akun"}_${new Date().toISOString().slice(0,10)}.xlsx`
    );
}

/* ==========================
   EXPORT PDF
========================== */

function exportBukuBesarPDF(){
    if(!bukuBesarData){
        alert("Data Buku Besar kosong");
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
    doc.text("BUKU BESAR", 14, 23);

    doc.setFontSize(9);
    doc.text(`Akun: ${bukuBesarData.kodeAkun} - ${bukuBesarData.namaAkun}`, 14, 30);

    const body = [];

    body.push([
        "-",
        "-",
        "SALDO AWAL",
        "-",
        "-",
        "-",
        bbRupiah(bukuBesarData.saldoAwal)
    ]);

    (bukuBesarData.transaksi || []).forEach(row => {
        body.push([
            bbTanggal(row["Tanggal"]),
            row["No. Bukti"] || "",
            row["Keterangan"] || "",
            row["Sumber"] || "",
            bbRupiah(row["Debit"]),
            bbRupiah(row["Kredit"]),
            bbRupiah(row.saldo)
        ]);
    });

    doc.autoTable({
        startY:36,
        head:[[
            "Tanggal",
            "No Bukti",
            "Keterangan",
            "Sumber",
            "Debit",
            "Kredit",
            "Saldo"
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
        `BukuBesar_${bukuBesarData.kodeAkun || "Akun"}_${new Date().toISOString().slice(0,10)}.pdf`
    );
}

/* ==========================
   AUTO LOAD
========================== */

if(document.readyState === "loading"){
    document.addEventListener("DOMContentLoaded", initBukuBesar);
}else{
    initBukuBesar();
}