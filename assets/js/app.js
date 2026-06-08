/* =====================================================
   AUMARIX ACCOUNTING SYSTEM
   FILE : app.js
===================================================== */

/* ==========================================
   PAGE CONFIG
========================================== */

const PAGE_CONFIG = {

    dashboard: {
        title: "Dashboard",
        init: "loadDashboard"
    },

    coa: {
        title: "Chart of Accounts",
        init: "loadCOA"
    },

    jurnal: {
        title: "Jurnal Umum",
        init: "loadJurnal"
    },

    bukubesar: {
        title: "Buku Besar",
        init: "initBukuBesar"
    },

    penyesuaian: {
        title: "Jurnal Penyesuaian",
        init: "loadPenyesuaian"
    },

    aset: {
        title: "Aset Tetap",
        init: "loadAsetTetap"
    },

    neracalajur: {
        title: "Neraca Lajur",
        init: "loadNeracaLajur"
    },

    labarugi: {
        title: "Laba Rugi",
        init: "loadLabaRugi"
    },

    perubahanmodal: {
        title: "Perubahan Modal",
        init: "loadPerubahanModal"
    },

    neraca: {
        title: "Neraca",
        init: "loadNeraca"
    },

    aruskas: {
        title: "Arus Kas",
        init: "loadArusKas"
    }

};

/* ==========================================
   START APP
========================================== */

document.addEventListener("DOMContentLoaded", () => {
    loadPage("dashboard");
});

/* ==========================================
   LOAD PAGE
========================================== */

async function loadPage(page) {
    try {
        showLoading();

        const config = PAGE_CONFIG[page];

        if (!config) {
            throw new Error(`Konfigurasi halaman ${page} tidak ditemukan.`);
        }

        const response = await fetch(
            `assets/pages/${page}.html`,
            { cache: "no-store" }
        );

        if (!response.ok) {
            throw new Error(`Halaman ${page}.html tidak ditemukan.`);
        }

        const html = await response.text();

        const content = document.getElementById("content");
        if (!content) {
            throw new Error("Element #content tidak ditemukan.");
        }

        content.innerHTML = html;

        setPageTitle(config.title);
        setActiveMenu(page);

        await executePage(config.init);

    } catch (err) {
        console.error(err);

        const content = document.getElementById("content");

        if (content) {
            content.innerHTML = `
                <div class="card">
                    <h3>⚠️ Halaman tidak ditemukan</h3>
                    <p>${escapeHTML(err.message || err)}</p>
                </div>
            `;
        }

    } finally {
        hideLoading();
    }
}

/* ==========================================
   EXECUTE PAGE INIT
========================================== */

async function executePage(functionName) {
    if (!functionName) return;

    const fn = window[functionName];

    if (typeof fn === "function") {
        await fn();
    } else {
        console.warn(`Function ${functionName} belum tersedia.`);
    }
}

/* ==========================================
   SET PAGE TITLE
========================================== */

function setPageTitle(title) {
    const el = document.getElementById("pageTitle");

    if (el) {
        el.innerText = title || "";
    }
}

/* ==========================================
   ACTIVE MENU
========================================== */

function setActiveMenu(page) {
    document
        .querySelectorAll("[data-page]")
        .forEach(item => {
            item.classList.remove("active");

            if (item.getAttribute("data-page") === page) {
                item.classList.add("active");
            }
        });
}

/* ==========================================
   LOADING
========================================== */

function showLoading() {
    const el = document.getElementById("globalLoading");

    if (el) {
        el.style.display = "flex";
    }
}

function hideLoading() {
    const el = document.getElementById("globalLoading");

    if (el) {
        el.style.display = "none";
    }
}

/* ==========================================
   FORMAT RUPIAH
========================================== */

function rupiah(value) {
    return Number(value || 0).toLocaleString(
        "id-ID",
        {
            style: "currency",
            currency: "IDR",
            maximumFractionDigits: 0
        }
    );
}

/* ==========================================
   FORMAT ANGKA
========================================== */

function numberFormat(value) {
    return Number(value || 0).toLocaleString("id-ID");
}

/* ==========================================
   FORMAT TANGGAL
========================================== */

function formatTanggal(value) {
    if (!value) return "";

    const date = new Date(value);

    if (isNaN(date.getTime())) {
        return value;
    }

    return date.toLocaleDateString(
        "id-ID",
        {
            day: "2-digit",
            month: "2-digit",
            year: "numeric"
        }
    );
}

/* ==========================================
   FORMAT DATE INPUT
========================================== */

function formatDateInput(value) {
    if (!value) return "";

    const date = new Date(value);

    if (isNaN(date.getTime())) {
        return "";
    }

    return date.toISOString().split("T")[0];
}

/* ==========================================
   SAFE NUMBER
========================================== */

function toNumberClient(value) {
    if (value === "" || value === null || value === undefined) {
        return 0;
    }

    if (typeof value === "number") {
        return value;
    }

    return Number(
        String(value)
            .replace(/\./g, "")
            .replace(/,/g, ".")
    ) || 0;
}

/* ==========================================
   ESCAPE HTML
========================================== */

function escapeHTML(value) {
    return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

/* ==========================================
   NOTIFIKASI
========================================== */

function success(message) {
    alert("✅ " + message);
}

function error(message) {
    alert("❌ " + message);
}

function warning(message) {
    alert("⚠️ " + message);
}

function info(message) {
    alert("ℹ️ " + message);
}

/* ==========================================
   CONFIRMATION
========================================== */

function confirmAction(message) {
    return confirm(message || "Apakah Anda yakin?");
}

/* ==========================================
   RESET CONTENT
========================================== */

function clearContent() {
    const content = document.getElementById("content");

    if (content) {
        content.innerHTML = "";
    }
}