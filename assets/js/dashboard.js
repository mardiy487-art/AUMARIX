/* ==========================================
   DASHBOARD
========================================== */

async function loadDashboard() {

    try {

        const result =
            await apiGet(
                "dashboard"
            );

        if(!result.success){

            error(
                result.message
            );

            return;
        }

        const data =
            result.data;

        const kpi =
            data.kpi;

        /* KPI */

        document
        .getElementById(
            "kpiTotalAset"
        )
        .innerText =
        rupiah(
            kpi.totalAset
        );

        document
        .getElementById(
            "kpiTotalLiabilitas"
        )
        .innerText =
        rupiah(
            kpi.totalLiabilitas
        );

        document
        .getElementById(
            "kpiTotalEkuitas"
        )
        .innerText =
        rupiah(
            kpi.totalEkuitas
        );

        document
        .getElementById(
            "kpiPendapatan"
        )
        .innerText =
        rupiah(
            kpi.pendapatan
        );

        document
        .getElementById(
            "kpiBeban"
        )
        .innerText =
        rupiah(
            kpi.beban
        );

        document
        .getElementById(
            "kpiLaba"
        )
        .innerText =
        rupiah(
            kpi.labaBersih
        );

        /* INFO */

        document
        .getElementById(
            "appName"
        )
        .innerText =
        data.appName;

        document
        .getElementById(
            "appVersion"
        )
        .innerText =
        data.version;

        document
        .getElementById(
            "totalAkun"
        )
        .innerText =
        kpi.totalAkun;

        document
        .getElementById(
            "totalAsetTetap"
        )
        .innerText =
        kpi.totalAsetTetap;

        document
        .getElementById(
            "totalTransaksi"
        )
        .innerText =
        kpi.totalTransaksi;

        /* HEALTH */

        const jurnal =
        data.healthCheck
        .jurnalBalance;

        const neraca =
        data.healthCheck
        .neracaBalance;

        document
        .getElementById(
            "jurnalBalance"
        )
        .innerHTML = jurnal

        ?

        `<span class="badge badge-success">
            BALANCED
         </span>`

        :

        `<span class="badge badge-danger">
            NOT BALANCED
         </span>`;

        document
        .getElementById(
            "neracaBalance"
        )
        .innerHTML = neraca

        ?

        `<span class="badge badge-success">
            BALANCED
         </span>`

        :

        `<span class="badge badge-danger">
            NOT BALANCED
         </span>`;

    }

    catch(err){

        console.error(err);

    }

}