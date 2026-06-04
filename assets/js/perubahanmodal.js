/* ==========================================
   LOAD PERUBAHAN MODAL
========================================== */

async function loadPerubahanModal() {

    try {

        showLoading();

        const res =
            await apiGet(
                "getPerubahanModal"
            );

        if (!res.success) {

            throw new Error(
                res.message
            );

        }

        renderPerubahanModal(
            res.data
        );

    }

    catch(err){

        console.error(err);

        document
        .getElementById(
            "perubahanModalContent"
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
   RENDER
========================================== */

function renderPerubahanModal(data){

    document
    .getElementById(
        "pmModalAwal"
    )
    .innerHTML =
    rupiah(
        data.modalAwal
    );

    document
    .getElementById(
        "pmLabaBersih"
    )
    .innerHTML =
    rupiah(
        data.labaBersih
    );

    document
    .getElementById(
        "pmPrive"
    )
    .innerHTML =
    rupiah(
        data.prive
    );

    document
    .getElementById(
        "pmModalAkhir"
    )
    .innerHTML =
    rupiah(
        data.modalAkhir
    );

    document
    .getElementById(
        "perubahanModalContent"
    )
    .innerHTML =

    `
    <div class="pm-card">

        <div class="pm-row">

            <span>

                Modal Awal

            </span>

            <span>

                ${rupiah(
                    data.modalAwal
                )}

            </span>

        </div>

        <div class="pm-row">

            <span>

                (+) Laba Bersih

            </span>

            <span>

                ${rupiah(
                    data.labaBersih
                )}

            </span>

        </div>

        <div class="pm-row minus">

            <span>

                (-) Prive

            </span>

            <span>

                ${rupiah(
                    data.prive
                )}

            </span>

        </div>

        <div class="pm-total">

            <span>

                MODAL AKHIR

            </span>

            <span>

                ${rupiah(
                    data.modalAkhir
                )}

            </span>

        </div>

    </div>
    `;

}