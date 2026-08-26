/* =========================================================
   ADDY — SUPABASE CONFIG
========================================================= */

const SUPABASE_URL = "https://apfqxlriilkwzynozsvv.supabase.co";

const SUPABASE_KEY =
    "sb_publishable_AcwBiZcSMHrkfjV31JJK6A_r45OvAe4";

const SUPABASE_BUCKET = "addy-files";


/* =========================================================
   INITIALIZE SUPABASE
========================================================= */

(function () {

    if (!window.supabase) {

        console.error(
            "Supabase library was not loaded."
        );

        window.supabaseClient = null;

        return;
    }


    try {

        window.supabaseClient =
            window.supabase.createClient(
                SUPABASE_URL,
                SUPABASE_KEY
            );

        console.log(
            "✅ Supabase initialized successfully."
        );

    } catch (error) {

        console.error(
            "❌ Supabase initialization failed:",
            error
        );

        window.supabaseClient = null;
    }

})();
