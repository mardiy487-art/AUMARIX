/* =====================================================
   AUMARIX ACCOUNTING SYSTEM
   FILE : dashboard.js
   SUMBER DATA : LAPORAN KEUANGAN RESMI
===================================================== */

let dashboardData = null;

let chartLabaRugiInstance = null;
let chartNeracaInstance = null;
let chartArusKasInstance = null;
let chartKasBankInstance = null;

/* ==========================================
   LOAD DASHBOARD
========================================== */

async function loadDashboard() {
    try {
        showLoading();

        const tanggalAwal =
            document.getElementById("tanggalAwalDashboard")?.value || "";

        const tanggalAkhir =
            document.getElementById("tanggalAkhirDashboard")?.value || "";

        if (
            tanggalAwal &&
            tanggalAkhir &&
            new Date(tanggalAwal) > new Date(tanggalAkhir)
        ) {
            throw new Error("Tanggal awal tidak boleh lebih besar dari tanggal akhir");
        }

        const res = await apiGet("getDashboard", {
            tanggalAwal,
            tanggalAkhir
        });

        if (!res.success) {
            throw new Error(res.message || res.error || "Gagal memuat dashboard");
        }

        dashboardData = res.data;

        renderDashboard(res.data);

    } catch (err) {
        console.error(err);
        error(err.message || "Terjadi kesalahan saat memuat dashboard");
    } finally {
        hideLoading();
    }
}

/* ==========================================
   RESET FILTER
========================================== */

function resetDashboard() {
    const awal = document.getElementById("tanggalAwalDashboard");
    const akhir = document.getElementById("tanggalAkhirDashboard");

    if (awal) awal.value = "";
    if (akhir) akhir.value = "";

    loadDashboard();
}

/* ==========================================
   FORMAT
========================================== */

function rupiahDashboard(value) {
    if (typeof rupiah === "function") {
        return rupiah(value);
    }

    return Number(value || 0).toLocaleString("id-ID", {
        style: "currency",
        currency: "IDR",
        maximumFractionDigits: 0
    });
}

function angkaDashboard(value) {
    return Number(value || 0).toFixed(2);
}

function persenDashboard(value) {
    return Number(value || 0).toFixed(2) + "%";
}

function nilaiDashboard(value) {
    const angka = Number(value || 0);

    if (angka < 0) {
        return "(" + rupiahDashboard(Math.abs(angka)) + ")";
    }

    return rupiahDashboard(angka);
}

function escapeDashboard(value) {
    return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

function setDashboardText(id, value) {
    const el = document.getElementById(id);
    if (el) el.innerHTML = value;
}

/* ==========================================
   RENDER DASHBOARD
========================================== */

function renderDashboard(data) {
    if (!data) return;

    const kpi = data.kpi || {};
    const health = data.healthCheck || {};

    const periodeText =
        data.tanggalAwal || data.tanggalAkhir
            ? `Periode : ${data.tanggalAwal || "-"} s/d ${data.tanggalAkhir || "-"}`
            : "Periode : Semua Data";

    setDashboardText("periodeDashboard", periodeText);

    setDashboardText("dashSaldoKas", rupiahDashboard(kpi.saldoKas));
    setDashboardText("dashLabaBersih", nilaiDashboard(kpi.labaBersih));
    setDashboardText("dashTotalAktiva", rupiahDashboard(kpi.totalAktiva));
    setDashboardText("dashTotalPassiva", rupiahDashboard(kpi.totalPassiva));
    setDashboardText("dashModalAkhir", rupiahDashboard(kpi.modalAkhir));

    setDashboardText(
        "dashStatusNeraca",
        kpi.neracaSeimbang ? "🟢 SEIMBANG" : "🔴 TIDAK SEIMBANG"
    );

    setDashboardText("dashPendapatan", rupiahDashboard(kpi.pendapatan));
    setDashboardText("dashBeban", rupiahDashboard(kpi.beban));
    setDashboardText("dashKenaikanKas", nilaiDashboard(kpi.kenaikanKas));
    setDashboardText("dashTotalKewajiban", rupiahDashboard(kpi.totalKewajiban));
    setDashboardText("dashTotalAkun", kpi.totalAkun || 0);
    setDashboardText("dashTotalAsetTetap", kpi.totalAsetTetap || 0);

    setDashboardText("dashCurrentRatio", angkaDashboard(kpi.currentRatio));
    setDashboardText("dashDebtRatio", persenDashboard(kpi.debtRatio));
    setDashboardText("dashEquityRatio", persenDashboard(kpi.equityRatio));
    setDashboardText("dashMarginLabaBersih", persenDashboard(kpi.marginLabaBersih));
    setDashboardText("dashROE", persenDashboard(kpi.roe));
    setDashboardText("dashCashRatio", persenDashboard(kpi.cashRatio));

    setDashboardText("dashHealthStatus", health.status || "-");
    setDashboardText("dashHealthAktiva", rupiahDashboard(health.totalAktiva));
    setDashboardText("dashHealthPassiva", rupiahDashboard(health.totalPassiva));
    setDashboardText("dashSelisihNeraca", nilaiDashboard(health.selisihNeraca));

    renderKasBankDetail(data.detail?.kasBank || []);
    renderDashboardCharts(data.charts || {});
}

/* ==========================================
   DETAIL KAS BANK
========================================== */

function renderKasBankDetail(rows) {
    const container = document.getElementById("dashKasBankDetail");
    if (!container) return;

    if (!rows.length) {
        container.innerHTML = `
            <div class="dashboard-empty">
                Tidak ada data kas dan bank
            </div>
        `;
        return;
    }

    let html = "";

    rows.forEach(row => {
        html += `
            <div class="dashboard-cash-row">
                <div>
                    <strong>
                        ${escapeDashboard(row.namaAkun || row["Nama Akun"] || "")}
                    </strong>
                    <small>
                        ${escapeDashboard(row.kodeAkun || row["Kode Akun"] || "")}
                    </small>
                </div>

                <div>
                    ${rupiahDashboard(row.saldo)}
                </div>
            </div>
        `;
    });

    const total = rows.reduce(
        (sum, row) => sum + Number(row.saldo || 0),
        0
    );

    html += `
        <div class="dashboard-cash-total">
            <span>Total Kas & Bank</span>
            <span>${rupiahDashboard(total)}</span>
        </div>
    `;

    container.innerHTML = html;
}

/* ==========================================
   DESTROY CHART
========================================== */

function destroyDashboardCharts() {
    if (chartLabaRugiInstance) chartLabaRugiInstance.destroy();
    if (chartNeracaInstance) chartNeracaInstance.destroy();
    if (chartArusKasInstance) chartArusKasInstance.destroy();
    if (chartKasBankInstance) chartKasBankInstance.destroy();

    chartLabaRugiInstance = null;
    chartNeracaInstance = null;
    chartArusKasInstance = null;
    chartKasBankInstance = null;
}

/* ==========================================
   RENDER CHARTS
========================================== */

function renderDashboardCharts(charts) {
    if (typeof Chart === "undefined") {
        console.warn("Chart.js belum dimuat");
        return;
    }

    destroyDashboardCharts();

    chartLabaRugiInstance = renderDashboardBarChart(
        "chartLabaRugi",
        charts.labaRugi,
        "Nilai"
    );

    chartNeracaInstance = renderDashboardDoughnutChart(
        "chartNeraca",
        charts.neraca
    );

    chartArusKasInstance = renderDashboardBarChart(
        "chartArusKas",
        charts.arusKas,
        "Arus Kas"
    );

    chartKasBankInstance = renderDashboardDoughnutChart(
        "chartKasBank",
        charts.kasBank
    );
}

/* ==========================================
   BAR CHART
========================================== */

function renderDashboardBarChart(canvasId, chartData, label) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return null;

    return new Chart(canvas, {
        type: "bar",
        data: {
            labels: chartData?.labels || [],
            datasets: [{
                label: label,
                data: chartData?.values || [],
                borderRadius: 8
            }]
        },
        options: getDashboardBarOptions()
    });
}

/* ==========================================
   DOUGHNUT CHART
========================================== */

function renderDashboardDoughnutChart(canvasId, chartData) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return null;

    return new Chart(canvas, {
        type: "doughnut",
        data: {
            labels: chartData?.labels || [],
            datasets: [{
                data: chartData?.values || []
            }]
        },
        options: getDashboardDoughnutOptions()
    });
}

/* ==========================================
   CHART OPTIONS
========================================== */

function getDashboardBarOptions() {
    return {
        responsive: true,
        maintainAspectRatio: false,

        plugins: {
            legend: {
                display: false
            },
            tooltip: {
                callbacks: {
                    label: function(context) {
                        return rupiahDashboard(context.raw);
                    }
                }
            }
        },

        scales: {
            y: {
                ticks: {
                    callback: function(value) {
                        return shortNumberDashboard(value);
                    }
                }
            }
        }
    };
}

function getDashboardDoughnutOptions() {
    return {
        responsive: true,
        maintainAspectRatio: false,

        plugins: {
            legend: {
                position: "bottom"
            },
            tooltip: {
                callbacks: {
                    label: function(context) {
                        return `${context.label} : ${rupiahDashboard(context.raw)}`;
                    }
                }
            }
        }
    };
}

/* ==========================================
   SHORT NUMBER
========================================== */

function shortNumberDashboard(value) {
    const angka = Number(value || 0);

    if (Math.abs(angka) >= 1000000000) {
        return (angka / 1000000000).toFixed(1) + " M";
    }

    if (Math.abs(angka) >= 1000000) {
        return (angka / 1000000).toFixed(1) + " Jt";
    }

    if (Math.abs(angka) >= 1000) {
        return (angka / 1000).toFixed(1) + " Rb";
    }

    return angka;
}

/* ==========================================
   AUTO LOAD
========================================== */

document.addEventListener("DOMContentLoaded", () => {
    if (
        document.getElementById("dashSaldoKas") &&
        typeof loadDashboard === "function"
    ) {
        loadDashboard();
    }
});