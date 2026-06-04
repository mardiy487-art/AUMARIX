/* ==========================================
   START APP
========================================== */

document.addEventListener(
    "DOMContentLoaded",
    () => {

        loadPage("dashboard");

    }
);

/* ==========================================
   LOAD PAGE
========================================== */

async function loadPage(page) {

    try {

        const response =
            await fetch(
                `assets/pages/${page}.html`
            );

        const html =
            await response.text();

        document
            .getElementById("content")
            .innerHTML = html;

        document
            .getElementById("pageTitle")
            .innerText =
            page.toUpperCase();

        executePage(page);

    } catch (err) {

        console.error(err);

        document
            .getElementById("content")
            .innerHTML =

            `
            <div class="card">
                <h3>Halaman tidak ditemukan</h3>
            </div>
            `;

    }

}

/* ==========================================
   EXECUTE PAGE
========================================== */

function executePage(page) {

    switch(page){

        case "dashboard":
            loadDashboard();
            break;

        case "coa":
            loadCOA();
            break;

        case "jurnal":
            loadJurnal();
            break;

        case "penyesuaian":
            loadPenyesuaian();
            break;

        case "aset":
            loadAset();
            break;

        case "bukubesar":
    initBukuBesar();
    break;

        case "neracalajur":
            loadNeracaLajur();
            break;

        case "labarugi":
            loadLabaRugi();
            break;

        case "perubahanmodal":
            loadPerubahanModal();
            break;

        case "neraca":
            loadNeraca();
            break;

        case "aruskas":
            loadArusKas();
            break;

    }

}

/* ==========================================
   LOADING
========================================== */

function showLoading() {

    const el =
        document.getElementById(
            "globalLoading"
        );

    if(el){

        el.style.display = "flex";

    }

}

function hideLoading() {

    const el =
        document.getElementById(
            "globalLoading"
        );

    if(el){

        el.style.display = "none";

    }

}

/* ==========================================
   FORMAT RUPIAH
========================================== */

function rupiah(value) {

    return Number(value || 0)
    .toLocaleString(
        "id-ID",
        {
            style:"currency",
            currency:"IDR"
        }
    );

}

/* ==========================================
   FORMAT ANGKA
========================================== */

function numberFormat(value){

    return Number(
        value || 0
    ).toLocaleString("id-ID");

}


/* ==========================================
   FORMAT TANGGAL
========================================== */

function formatTanggal(value){

    if(!value){

        return "";

    }

    return new Date(value)
        .toLocaleDateString(
            "id-ID",
            {
                day:"2-digit",
                month:"2-digit",
                year:"numeric"
            }
        );

}


/* ==========================================
   NOTIFIKASI
========================================== */

function success(message){

    alert(message);

}

function error(message){

    alert(message);

}