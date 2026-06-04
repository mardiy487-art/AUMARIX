/* ==========================================
   LOAD NERACA
========================================== */

async function loadNeraca() {

    try {

        showLoading();

        const res =
            await apiGet(
                "getNeraca"
            );

        if (!res.success) {

            throw new Error(
                res.message
            );

        }

        renderNeraca(
            res.data
        );

    }

    catch(err){

        console.error(err);

        document
        .getElementById(
            "aktivaContent"
        )
        .innerHTML =

        `
        <div class="error-box">

            ${err}

        </div>
        `;

    }

    finally {

        hideLoading();

    }

}

/* ==========================================
   RENDER NERACA
========================================== */

function renderNeraca(data){

    document
    .getElementById(
        "totalAktiva"
    )
    .innerHTML =
    rupiah(
        data.totalAktiva
    );

    document
    .getElementById(
        "totalPassiva"
    )
    .innerHTML =
    rupiah(
        data.totalPassiva
    );

    document
    .getElementById(
        "statusNeraca"
    )
    .innerHTML =

    data.seimbang

    ?

    "🟢 SEIMBANG"

    :

    "🔴 TIDAK SEIMBANG";

    renderAktiva(data);

    renderPassiva(data);

}

/* ==========================================
   AKTIVA
========================================== */

function renderAktiva(data){

    let html = "";

    html += `
    <div class="group-title">
        Aset Lancar
    </div>
    `;

    data.asetLancar.forEach(item => {

        html += `
        <div class="row">

            <span>
                ${item.namaAkun}
            </span>

            <span>
                ${rupiah(item.saldo)}
            </span>

        </div>
        `;

    });

    html += `
    <div class="total-row">

        <span>
            Total Aset Lancar
        </span>

        <span>
            ${rupiah(
                data.totalAsetLancar
            )}
        </span>

    </div>
    `;

    html += `
    <div class="group-title">
        Aset Tetap
    </div>
    `;

    data.asetTetap.forEach(item => {

        html += `
        <div class="row">

            <span>
                ${item.namaAkun}
            </span>

            <span>
                ${rupiah(item.saldo)}
            </span>

        </div>
        `;

    });

    html += `
    <div class="total-row">

        <span>
            Total Aset Tetap
        </span>

        <span>
            ${rupiah(
                data.totalAsetTetap
            )}
        </span>

    </div>
    `;

    html += `
    <div class="group-title">
        Akumulasi Penyusutan
    </div>
    `;

    data.akumulasiPenyusutan.forEach(item => {

        html += `
        <div class="row">

            <span>
                ${item.namaAkun}
            </span>

            <span>
                ${rupiah(item.saldo)}
            </span>

        </div>
        `;

    });

    html += `
    <div class="grand-total">

        TOTAL AKTIVA

        <span>

            ${rupiah(
                data.totalAktiva
            )}

        </span>

    </div>
    `;

    document
    .getElementById(
        "aktivaContent"
    )
    .innerHTML = html;

}

/* ==========================================
   PASSIVA
========================================== */

function renderPassiva(data){

    let html = "";

    html += `
    <div class="group-title">

        Kewajiban Lancar

    </div>
    `;

    data.kewajibanLancar.forEach(item => {

        html += `
        <div class="row">

            <span>
                ${item.namaAkun}
            </span>

            <span>
                ${rupiah(item.saldo)}
            </span>

        </div>
        `;

    });

    html += `
    <div class="total-row">

        <span>
            Total Kewajiban
        </span>

        <span>
            ${rupiah(
                data.totalKewajiban
            )}
        </span>

    </div>
    `;

    html += `
    <div class="group-title">

        Modal Akhir

    </div>

    <div class="row">

        <span>
            Modal Akhir
        </span>

        <span>
            ${rupiah(
                data.modalAkhir
            )}
        </span>

    </div>

    <div class="grand-total">

        TOTAL PASSIVA

        <span>

            ${rupiah(
                data.totalPassiva
            )}

        </span>

    </div>
    `;

    document
    .getElementById(
        "passivaContent"
    )
    .innerHTML = html;

}