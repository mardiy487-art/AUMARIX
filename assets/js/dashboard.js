/* =====================================================
   AUMARIX ACCOUNTING SYSTEM
   FILE : dashboard.js
===================================================== */

let dashboardData = null;

let chartLabaRugiInstance = null;
let chartKasBankInstance = null;
let chartNeracaInstance = null;
let chartArusKasInstance = null;

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
            throw new Error(
                "Tanggal awal tidak boleh lebih besar dari tanggal akhir"
            );
        }

        const res =
            await apiPost(
                "getDashboard",
                {
                    tanggalAwal,
                    tanggalAkhir
                }
            );

        if (!res.success) {
            throw new Error(
                res.message ||
                "Gagal memuat dashboard"
            );
        }

        dashboardData =
            res.data;

        renderDashboard(
            res.data
        );

    } catch (err) {

        console.error(err);

        error(
            err.message ||
            "Terjadi kesalahan saat memuat dashboard"
        );

    } finally {

        hideLoading();

    }

}

/* ==========================================
   FORMAT
========================================== */

function rupiahDashboard(value) {

    if (typeof rupiah === "function") {
        return rupiah(value);
    }

    return Number(value || 0).toLocaleString(
        "id-ID",
        {
            style: "currency",
            currency: "IDR",
            maximumFractionDigits: 0
        }
    );

}

function angkaDashboard(value) {

    return Number(value || 0).toFixed(2);

}

function persenDashboard(value) {

    return Number(value || 0).toFixed(2) + " %";

}

function tanggalDashboard(value) {

    if (!value) return "-";

    const d = new Date(value);

    if (isNaN(d.getTime())) {
        return value;
    }

    return d.toLocaleDateString("id-ID");

}

function nilaiDashboard(value) {

    const angka =
        Number(value || 0);

    if (angka < 0) {
        return "(" + rupiahDashboard(Math.abs(angka)) + ")";
    }

    return rupiahDashboard(angka);

}

function escapeHTMLDashboard(value) {

    return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");

}

/* ==========================================
   SET TEXT
========================================== */

function setDashboardText(id, value) {

    const el =
        document.getElementById(id);

    if (el) {
        el.innerHTML = value;
    }

}

/* ==========================================
   RENDER DASHBOARD
========================================== */

function renderDashboard(data) {

    if (!data) {
        return;
    }

    const kpi =
        data.kpi || {};

    const periodeText =
        data.tanggalAwal || data.tanggalAkhir
            ? `Periode : ${data.tanggalAwal || "-"} s/d ${data.tanggalAkhir || "-"}`
            : "Periode : Semua Data";

    setDashboardText(
        "periodeDashboard",
        periodeText
    );

    setDashboardText(
        "dashSaldoKas",
        rupiahDashboard(kpi.saldoKas)
    );

    setDashboardText(
        "dashLabaBersih",
        nilaiDashboard(kpi.labaBersih)
    );

    setDashboardText(
        "dashTotalAktiva",
        rupiahDashboard(kpi.totalAktiva)
    );

    setDashboardText(
        "dashTotalPassiva",
        rupiahDashboard(kpi.totalPassiva)
    );

    setDashboardText(
        "dashModalAkhir",
        rupiahDashboard(kpi.modalAkhir)
    );

    setDashboardText(
        "dashTotalTransaksi",
        kpi.totalTransaksi || 0
    );

    setDashboardText(
        "dashTotalAkun",
        kpi.totalAkun || 0
    );

    setDashboardText(
        "dashStatusNeraca",
        kpi.neracaSeimbang
            ? "🟢 SEIMBANG"
            : "🔴 TIDAK SEIMBANG"
    );

    setDashboardText(
        "dashCurrentRatio",
        angkaDashboard(kpi.currentRatio)
    );

    setDashboardText(
        "dashDebtRatio",
        persenDashboard(kpi.debtRatio)
    );

    setDashboardText(
        "dashEquityRatio",
        persenDashboard(kpi.equityRatio)
    );

    setDashboardText(
        "dashKenaikanKas",
        nilaiDashboard(kpi.kenaikanKas)
    );

    renderKasBankDetail(
        data.detail?.kasBank || []
    );

    renderTransaksiTerakhir(
        data.detail?.transaksiTerakhir || []
    );

    renderDashboardCharts(
        data.charts || {}
    );

}

/* ==========================================
   RENDER DETAIL KAS BANK
========================================== */

function renderKasBankDetail(rows) {

    const container =
        document.getElementById("dashKasBankDetail");

    if (!container) {
        return;
    }

    let html = "";

    if (!rows || rows.length === 0) {

        html = `
            <div class="dashboard-empty">
                Tidak ada data kas dan bank
            </div>
        `;

    } else {

        rows.forEach(row => {

            html += `
                <div class="dashboard-cash-row">

                    <div>
                        <strong>
                            ${escapeHTMLDashboard(row.namaAkun || "")}
                        </strong>

                        <small>
                            ${escapeHTMLDashboard(row.kodeAkun || "")}
                        </small>
                    </div>

                    <div>
                        ${rupiahDashboard(row.saldo)}
                    </div>

                </div>
            `;

        });

        const total =
            rows.reduce(
                (sum, row) =>
                    sum + Number(row.saldo || 0),
                0
            );

        html += `
            <div class="dashboard-cash-total">
                <span>Total Kas & Bank</span>
                <span>${rupiahDashboard(total)}</span>
            </div>
        `;

    }

    container.innerHTML =
        html;

}

/* ==========================================
   RENDER TRANSAKSI TERAKHIR
========================================== */

function renderTransaksiTerakhir(rows) {

    const tbody =
        document.getElementById("dashTransaksiTerakhir");

    if (!tbody) {
        return;
    }

    if (!rows || rows.length === 0) {

        tbody.innerHTML = `
            <tr>
                <td colspan="7" class="empty-table">
                    Tidak ada transaksi
                </td>
            </tr>
        `;

        return;
    }

    tbody.innerHTML =
        rows.map(row => {

            return `
                <tr>
                    <td>
                        ${tanggalDashboard(row.tanggal)}
                    </td>

                    <td>
                        ${escapeHTMLDashboard(row.sumber || "")}
                    </td>

                    <td>
                        ${escapeHTMLDashboard(row.noBukti || "")}
                    </td>

                    <td>
                        ${escapeHTMLDashboard(row.keterangan || "")}
                    </td>

                    <td>
                        <strong>${escapeHTMLDashboard(row.kodeAkun || "")}</strong>
                        ${escapeHTMLDashboard(row.namaAkun || "")}
                    </td>

                    <td class="text-right">
                        ${rupiahDashboard(row.debit)}
                    </td>

                    <td class="text-right">
                        ${rupiahDashboard(row.kredit)}
                    </td>
                </tr>
            `;

        }).join("");

}

/* ==========================================
   RESET
========================================== */

function resetDashboard() {

    const awal =
        document.getElementById("tanggalAwalDashboard");

    const akhir =
        document.getElementById("tanggalAkhirDashboard");

    if (awal) {
        awal.value = "";
    }

    if (akhir) {
        akhir.value = "";
    }

    loadDashboard();

}

/* ==========================================
   DESTROY CHART
========================================== */

function destroyDashboardCharts() {

    if (chartLabaRugiInstance) {
        chartLabaRugiInstance.destroy();
        chartLabaRugiInstance = null;
    }

    if (chartKasBankInstance) {
        chartKasBankInstance.destroy();
        chartKasBankInstance = null;
    }

    if (chartNeracaInstance) {
        chartNeracaInstance.destroy();
        chartNeracaInstance = null;
    }

    if (chartArusKasInstance) {
        chartArusKasInstance.destroy();
        chartArusKasInstance = null;
    }

}

/* ==========================================
   RENDER CHARTS
========================================== */

function renderDashboardCharts(charts) {

    if (typeof Chart === "undefined") {
        console.warn(
            "Chart.js belum dimuat. Tambahkan CDN Chart.js di index.html"
        );
        return;
    }

    destroyDashboardCharts();

    renderChartLabaRugi(
        charts.labaRugi || {}
    );

    renderChartKasBank(
        charts.kasBank || {}
    );

    renderChartNeraca(
        charts.neraca || {}
    );

    renderChartArusKas(
        charts.arusKas || {}
    );

}

/* ==========================================
   CHART LABA RUGI
========================================== */

function renderChartLabaRugi(data) {

    const canvas =
        document.getElementById("chartLabaRugi");

    if (!canvas) return;

    chartLabaRugiInstance =
        new Chart(
            canvas,
            {
                type: "bar",

                data: {
                    labels: [
                        "Pendapatan",
                        "Beban",
                        "Laba Bersih"
                    ],

                    datasets: [
                        {
                            label: "Nilai",
                            data: [
                                Number(data.pendapatan?.[0] || 0),
                                Number(data.beban?.[0] || 0),
                                Number(data.labaBersih?.[0] || 0)
                            ],
                            backgroundColor: [
                                "#16a34a",
                                "#dc2626",
                                "#2563eb"
                            ],
                            borderRadius: 8
                        }
                    ]
                },

                options: getDashboardChartOptions(
                    "Pendapatan vs Beban vs Laba"
                )
            }
        );

}

/* ==========================================
   CHART KAS BANK
========================================== */

function renderChartKasBank(data) {

    const canvas =
        document.getElementById("chartKasBank");

    if (!canvas) return;

    chartKasBankInstance =
        new Chart(
            canvas,
            {
                type: "doughnut",

                data: {
                    labels:
                        data.labels || [],

                    datasets: [
                        {
                            data:
                                data.values || [],

                            backgroundColor: [
                                "#16a34a",
                                "#2563eb",
                                "#f59e0b",
                                "#8b5cf6",
                                "#06b6d4",
                                "#dc2626"
                            ]
                        }
                    ]
                },

                options: getDashboardPieOptions(
                    "Komposisi Kas & Bank"
                )
            }
        );

}

/* ==========================================
   CHART NERACA
========================================== */

function renderChartNeraca(data) {

    const canvas =
        document.getElementById("chartNeraca");

    if (!canvas) return;

    chartNeracaInstance =
        new Chart(
            canvas,
            {
                type: "pie",

                data: {
                    labels:
                        data.labels || [],

                    datasets: [
                        {
                            data:
                                data.values || [],

                            backgroundColor: [
                                "#2563eb",
                                "#16a34a",
                                "#dc2626",
                                "#f59e0b",
                                "#8b5cf6"
                            ]
                        }
                    ]
                },

                options: getDashboardPieOptions(
                    "Komposisi Neraca"
                )
            }
        );

}

/* ==========================================
   CHART ARUS KAS
========================================== */

function renderChartArusKas(data) {

    const canvas =
        document.getElementById("chartArusKas");

    if (!canvas) return;

    chartArusKasInstance =
        new Chart(
            canvas,
            {
                type: "bar",

                data: {
                    labels:
                        data.labels || [
                            "Operasi",
                            "Investasi",
                            "Pendanaan"
                        ],

                    datasets: [
                        {
                            label: "Arus Kas",
                            data:
                                data.values || [],
                            backgroundColor: [
                                "#16a34a",
                                "#f59e0b",
                                "#2563eb"
                            ],
                            borderRadius: 8
                        }
                    ]
                },

                options: getDashboardChartOptions(
                    "Arus Kas"
                )
            }
        );

}

/* ==========================================
   CHART OPTIONS
========================================== */

function getDashboardChartOptions(title) {

    return {
        responsive: true,
        maintainAspectRatio: false,

        plugins: {
            legend: {
                display: false
            },

            title: {
                display: false,
                text: title
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
                        return formatShortNumberDashboard(value);
                    }
                }
            }
        }
    };

}

function getDashboardPieOptions(title) {

    return {
        responsive: true,
        maintainAspectRatio: false,

        plugins: {
            legend: {
                position: "bottom"
            },

            title: {
                display: false,
                text: title
            },

            tooltip: {
                callbacks: {
                    label: function(context) {
                        const label =
                            context.label || "";

                        const value =
                            context.raw || 0;

                        return label + " : " + rupiahDashboard(value);
                    }
                }
            }
        }
    };

}

/* ==========================================
   SHORT NUMBER
========================================== */

function formatShortNumberDashboard(value) {

    const angka =
        Number(value || 0);

    if (Math.abs(angka) >= 1000000000) {
        return (angka / 1000000000).toFixed(1) + "M";
    }

    if (Math.abs(angka) >= 1000000) {
        return (angka / 1000000).toFixed(1) + "Jt";
    }

    if (Math.abs(angka) >= 1000) {
        return (angka / 1000).toFixed(1) + "Rb";
    }

    return angka;

}

/* ==========================================
   AUTO LOAD
========================================== */

document.addEventListener(
    "DOMContentLoaded",
    () => {

        if (
            document.getElementById("dashSaldoKas") &&
            typeof loadDashboard === "function"
        ) {
            loadDashboard();
        }

    }
);