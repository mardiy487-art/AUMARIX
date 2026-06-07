let asetData = [];

async function loadAset(){
    try{
        const result = await apiGet("getAsetTetap");

        if(!result.success){
            throw new Error(result.message || "Gagal mengambil data aset tetap.");
        }

        asetData = Array.isArray(result.data) ? result.data : [];
        renderAsetSummary();
        renderAsetTable();
    }catch(err){
        console.error(err);
        asetData = [];
        renderAsetSummary();
        const tbody = document.getElementById("asetTable");
        if(tbody){
            tbody.innerHTML = `<tr><td colspan="9" class="text-center">${err.message}</td></tr>`;
        }
    }
}

function getAsetValue(row, keys){
    for(const key of keys){
        if(row && row[key] !== undefined && row[key] !== null && row[key] !== ""){
            return row[key];
        }
    }
    return "";
}

function normalizeAset(row){
    const harga = Number(getAsetValue(row,["Harga Perolehan","hargaPerolehan","harga_perolehan"]) || 0);
    const residu = Number(getAsetValue(row,["Nilai Residu","nilaiResidu","nilai_residu"]) || 0);
    const umur = Number(getAsetValue(row,["Umur Ekonomis (Tahun)","Umur Ekonomis","umurEkonomis","umur_ekonomis"]) || 0);

    return {
        kodeAset: String(getAsetValue(row,["Kode Aset","kodeAset","kode_aset"])),
        namaAset: String(getAsetValue(row,["Nama Aset","namaAset","nama_aset"])),
        kodeAkun: String(getAsetValue(row,["Kode Akun","kodeAkun","kode_akun"])),
        tanggalPerolehan: getAsetValue(row,["Tanggal Perolehan","tanggalPerolehan","tanggal_perolehan"]),
        hargaPerolehan: harga,
        nilaiResidu: residu,
        umurEkonomis: umur,
        penyusutanTahunan: umur > 0 ? Math.max((harga - residu) / umur, 0) : 0
    };
}

function renderAsetSummary(){
    const rows = asetData.map(normalizeAset);
    const totalPerolehan = rows.reduce((sum,row)=>sum + row.hargaPerolehan,0);
    const totalResidu = rows.reduce((sum,row)=>sum + row.nilaiResidu,0);
    const totalPenyusutan = rows.reduce((sum,row)=>sum + row.penyusutanTahunan,0);

    setText("asetTotalUnit", numberFormat(rows.length));
    setText("asetTotalPerolehan", rupiah(totalPerolehan));
    setText("asetTotalResidu", rupiah(totalResidu));
    setText("asetTotalPenyusutan", rupiah(totalPenyusutan));
}

function renderAsetTable(){
    const tbody = document.getElementById("asetTable");
    if(!tbody) return;

    const keyword = (document.getElementById("searchAset")?.value || "").toLowerCase();
    const rows = asetData.map(normalizeAset).filter(row =>
        row.kodeAset.toLowerCase().includes(keyword) ||
        row.namaAset.toLowerCase().includes(keyword) ||
        row.kodeAkun.toLowerCase().includes(keyword)
    );

    if(rows.length === 0){
        tbody.innerHTML = `<tr><td colspan="9" class="text-center">Data aset belum ada.</td></tr>`;
        return;
    }

    tbody.innerHTML = rows.map(row => `
        <tr>
            <td>${escapeHTML(row.kodeAset)}</td>
            <td>${escapeHTML(row.namaAset)}</td>
            <td>${escapeHTML(row.kodeAkun)}</td>
            <td>${formatTanggal(row.tanggalPerolehan)}</td>
            <td>${rupiah(row.hargaPerolehan)}</td>
            <td>${rupiah(row.nilaiResidu)}</td>
            <td>${numberFormat(row.umurEkonomis)} Tahun</td>
            <td>${rupiah(row.penyusutanTahunan)}</td>
            <td>
                <button class="btn" onclick="editAset('${escapeAttr(row.kodeAset)}')">Edit</button>
                <button class="btn btn-danger" onclick="deleteAset('${escapeAttr(row.kodeAset)}')">Hapus</button>
            </td>
        </tr>
    `).join("");
}

function showAsetForm(){
    setText("asetFormTitle","Tambah Aset Tetap");
    document.getElementById("asetEditMode").value = "false";
    clearAsetForm();
    document.getElementById("asetFormCard").style.display = "block";
}

function hideAsetForm(){
    const form = document.getElementById("asetFormCard");
    if(form) form.style.display = "none";
}

function clearAsetForm(){
    ["kodeAset","namaAset","kodeAkunAset","tanggalPerolehan"].forEach(id=>setValue(id,""));
    setValue("hargaPerolehan",0);
    setValue("nilaiResidu",0);
    setValue("umurEkonomis",1);
}

function editAset(kodeAset){
    const row = asetData.map(normalizeAset).find(item => item.kodeAset === kodeAset);
    if(!row) return error("Data aset tidak ditemukan.");

    setText("asetFormTitle","Edit Aset Tetap");
    setValue("asetEditMode","true");
    setValue("kodeAset",row.kodeAset);
    setValue("namaAset",row.namaAset);
    setValue("kodeAkunAset",row.kodeAkun);
    setValue("tanggalPerolehan",toInputDate(row.tanggalPerolehan));
    setValue("hargaPerolehan",row.hargaPerolehan);
    setValue("nilaiResidu",row.nilaiResidu);
    setValue("umurEkonomis",row.umurEkonomis || 1);
    document.getElementById("asetFormCard").style.display = "block";
}

async function saveAset(){
    const data = {
        "Kode Aset": getValue("kodeAset"),
        "Nama Aset": getValue("namaAset"),
        "Kode Akun": getValue("kodeAkunAset"),
        "Tanggal Perolehan": getValue("tanggalPerolehan"),
        "Harga Perolehan": Number(getValue("hargaPerolehan") || 0),
        "Nilai Residu": Number(getValue("nilaiResidu") || 0),
        "Umur Ekonomis (Tahun)": Number(getValue("umurEkonomis") || 0),
        editMode: getValue("asetEditMode") === "true"
    };

    if(!data["Kode Aset"] || !data["Nama Aset"] || !data["Kode Akun"]){
        return error("Kode Aset, Nama Aset, dan Kode Akun wajib diisi.");
    }

    if(data["Umur Ekonomis (Tahun)"] <= 0){
        return error("Umur ekonomis harus lebih dari 0 tahun.");
    }

    const result = await apiPost("saveAsetTetap", data);
    if(!result.success){
        return error(result.message || "Gagal menyimpan aset.");
    }

    success(result.message || "Data aset berhasil disimpan.");
    hideAsetForm();
    loadAset();
}

async function deleteAset(kodeAset){
    if(!confirm(`Hapus aset ${kodeAset}?`)) return;

    const result = await apiPost("deleteAsetTetap", { kodeAset });
    if(!result.success){
        return error(result.message || "Gagal menghapus aset.");
    }

    success(result.message || "Data aset berhasil dihapus.");
    loadAset();
}

function setText(id,value){
    const el = document.getElementById(id);
    if(el) el.innerText = value;
}

function setValue(id,value){
    const el = document.getElementById(id);
    if(el) el.value = value;
}

function getValue(id){
    return document.getElementById(id)?.value || "";
}

function toInputDate(value){
    if(!value) return "";
    const date = new Date(value);
    if(Number.isNaN(date.getTime())) return String(value).slice(0,10);
    return date.toISOString().slice(0,10);
}

function escapeHTML(value){
    return String(value ?? "")
        .replace(/&/g,"&amp;")
        .replace(/</g,"&lt;")
        .replace(/>/g,"&gt;")
        .replace(/"/g,"&quot;")
        .replace(/'/g,"&#039;");
}

function escapeAttr(value){
    return escapeHTML(value).replace(/`/g,"&#096;");
}
