/* ==========================================
   LOAD LABA RUGI
========================================== */

async function loadLabaRugi() {

    try {

        showLoading();

        const res =
            await apiGet(
                "getLabaRugi"
            );

        if (!res.success) {

            throw new Error(
                res.message
            );

        }

        renderLabaRugi(
            res.data
        );

    }

    catch(err){

        console.error(err);

        document
        .getElementById(
            "labarugiContent"
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
   FORMAT RUPIAH
========================================== */

function rupiahLR(value){

    return Number(
        value || 0
    )
    .toLocaleString(
        "id-ID",
        {
            style:"currency",
            currency:"IDR"
        }
    );

}

/* ==========================================
   RENDER SECTION
========================================== */

function renderSection(
    title,
    data,
    total
){

    let html = `

    <div class="lr-section">

        <div class="section-header">

            ${title}

        </div>

    `;

    data.forEach(row=>{

        html += `

        <div class="lr-row">

            <div>

                ${row.namaAkun}

            </div>

            <div>

                ${rupiahLR(
                    row.saldo
                )}

            </div>

        </div>

        `;

    });

    html += `

        <div class="lr-total">

            <span>

                TOTAL

            </span>

            <span>

                ${rupiahLR(total)}

            </span>

        </div>

    </div>

    `;

    return html;

}

/* ==========================================
   RENDER LABA RUGI
========================================== */

function renderLabaRugi(data){

    document.getElementById(
        "summaryPenjualan"
    ).innerHTML =

    rupiahLR(
        data.penjualanBersih
    );

    document.getElementById(
        "summaryLabaKotor"
    ).innerHTML =

    rupiahLR(
        data.labaKotor
    );

    document.getElementById(
        "summaryBeban"
    ).innerHTML =

    rupiahLR(
        data.totalBeban
    );

    document.getElementById(
        "summaryLabaBersih"
    ).innerHTML =

    rupiahLR(
        data.labaBersih
    );

    let html = '';

    /* PENJUALAN */

    html += renderSection(
        "PENJUALAN",
        data.penjualan,
        data.totalPenjualan
    );

    html += renderSection(
        "RETUR PENJUALAN",
        data.returPenjualan,
        data.totalRetur
    );

    html += renderSection(
        "POTONGAN PENJUALAN",
        data.diskonPenjualan,
        data.totalDiskon
    );

    html += `

    <div class="lr-highlight">

        <span>

            PENJUALAN BERSIH

        </span>

        <span>

            ${rupiahLR(
                data.penjualanBersih
            )}

        </span>

    </div>

    `;

    /* HPP */

    html += renderSection(
        "HARGA POKOK PENJUALAN",
        data.hpp,
        data.totalHPP
    );

    html += `

    <div class="lr-highlight">

        <span>

            LABA KOTOR

        </span>

        <span>

            ${rupiahLR(
                data.labaKotor
            )}

        </span>

    </div>

    `;

    /* BEBAN */

    html += renderSection(
        "BEBAN OPERASIONAL",
        data.bebanOperasional,
        data.totalBebanOperasional
    );

    html += renderSection(
        "BEBAN PENYUSUTAN",
        data.bebanPenyusutan,
        data.totalBebanPenyusutan
    );

    html += renderSection(
        "BEBAN PAJAK",
        data.bebanPajak,
        data.totalBebanPajak
    );

    html += `

    <div class="lr-final">

        <span>

            LABA BERSIH

        </span>

        <span>

            ${rupiahLR(
                data.labaBersih
            )}

        </span>

    </div>

    `;

    document
    .getElementById(
        "labarugiContent"
    )
    .innerHTML = html;

}