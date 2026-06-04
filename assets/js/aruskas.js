/* ==========================================
   LOAD ARUS KAS
========================================== */

async function loadArusKas() {

    try {

        showLoading();

        const res =
            await apiGet(
                "getArusKas"
            );

        if (!res.success) {

            throw new Error(
                res.message
            );

        }

        renderArusKas(
            res.data
        );

    }

    catch(err){

        console.error(err);

    }

    finally{

        hideLoading();

    }

}

/* ==========================================
   RENDER
========================================== */

function renderArusKas(data){

    document
    .getElementById(
        "saldoAwalKas"
    )
    .innerHTML =
    rupiah(
        data.saldoAwal
    );

    document
    .getElementById(
        "kenaikanKas"
    )
    .innerHTML =
    rupiah(
        data.kenaikanKas
    );

    document
    .getElementById(
        "saldoAkhirKas"
    )
    .innerHTML =
    rupiah(
        data.saldoAkhir
    );

    renderSection(
        "operasiContainer",
        data.operasi
    );

    renderSection(
        "investasiContainer",
        data.investasi
    );

    renderSection(
        "pendanaanContainer",
        data.pendanaan
    );

}

/* ==========================================
   SECTION
========================================== */

function renderSection(
    target,
    rows
){

    let html = "";

    let total = 0;

    rows.forEach(item => {

        total +=
            item.tipe === "MASUK"
            ?
            item.nominal
            :
            -item.nominal;

        html += `

        <div class="cash-row">

            <div>

                ${item.keterangan}

            </div>

            <div class="${
                item.tipe === "MASUK"
                ?
                "cash-in"
                :
                "cash-out"
            }">

                ${
                    item.tipe === "MASUK"
                    ?
                    ""
                    :
                    "("
                }

                ${rupiah(
                    item.nominal
                )}

                ${
                    item.tipe === "MASUK"
                    ?
                    ""
                    :
                    ")"
                }

            </div>

        </div>

        `;

    });

    html += `

    <div class="cash-total">

        <span>

            Kas Bersih

        </span>

        <span>

            ${rupiah(total)}

        </span>

    </div>

    `;

    document
    .getElementById(
        target
    )
    .innerHTML = html;

}