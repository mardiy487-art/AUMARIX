/* ==========================================
   API GET
========================================== */

async function apiGet(action, params = {}) {

    try {

        showLoading();

        const query = new URLSearchParams({
            action,
            ...params
        });

        const response = await fetch(
            `${CONFIG.API_URL}?${query}`
        );

        const result = await response.json();

        hideLoading();

        return result;

    } catch (err) {

        hideLoading();

        console.error(err);

        return {
            success: false,
            message: err.message
        };

    }

}

/* ==========================================
   API POST
========================================== */

async function apiPost(action, data = {}) {

    try {

        showLoading();

        const response = await fetch(
            CONFIG.API_URL,
            {
                method: "POST",
                body: JSON.stringify({
                    action: action,
                    data: data
                })
            }
        );

        const text = await response.text();

        hideLoading();

        try {

            return JSON.parse(text);

        } catch {

            return {
                success: false,
                message: text
            };

        }

    } catch (err) {

        hideLoading();

        console.error(err);

        return {
            success: false,
            message: err.message
        };

    }

}