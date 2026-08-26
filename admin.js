/* =========================================================
   ADDY ADMIN PANEL
========================================================= */


/* =========================================================
   SUPABASE
========================================================= */

const supabaseClient = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_KEY
);


/* =========================================================
   ELEMENTS
========================================================= */

const loginSection = document.getElementById("loginSection");
const dashboard = document.getElementById("dashboard");

const loginForm = document.getElementById("loginForm");
const loginMessage = document.getElementById("loginMessage");

const uploadForm = document.getElementById("uploadForm");
const uploadMessage = document.getElementById("uploadMessage");
const uploadButton = document.getElementById("uploadButton");

const fileInput = document.getElementById("fileInput");
const selectedFile = document.getElementById("selectedFile");

const adminFileList = document.getElementById("adminFileList");
const adminFileCount = document.getElementById("adminFileCount");

const logoutButton = document.getElementById("logoutButton");


/* =========================================================
   SETTINGS
========================================================= */

const MAX_FILE_SIZE = 25 * 1024 * 1024;

const ALLOWED_EXTENSIONS = [
    "pdf",
    "doc",
    "docx",
    "xls",
    "xlsx",
    "ppt",
    "pptx",
    "txt",
    "zip"
];


/* =========================================================
   LOGIN
========================================================= */

loginForm?.addEventListener("submit", async (event) => {

    event.preventDefault();

    loginMessage.textContent = "Signing in...";
    loginMessage.style.color = "";

    const email = document
        .getElementById("email")
        .value
        .trim();

    const password = document
        .getElementById("password")
        .value;

    if (!email || !password) {
        loginMessage.textContent =
            "Please enter your email and password.";
        return;
    }

    try {

        const {
            data,
            error
        } = await supabaseClient.auth.signInWithPassword({
            email: email,
            password: password
        });

        if (error) {
            throw error;
        }

        if (!data?.user) {
            throw new Error(
                "Login succeeded, but no user session was returned."
            );
        }

        /* CHECK ADMIN */

        const isAdmin = await checkAdmin();

        if (!isAdmin) {

            await supabaseClient.auth.signOut();

            loginMessage.textContent =
                "This account is not authorized as an admin.";

            return;
        }

        loginMessage.textContent = "";

        showDashboard();

    } catch (error) {

        console.error("Login error:", error);

        loginMessage.textContent =
            error?.message ||
            "Unable to sign in.";

    }

});


/* =========================================================
   CHECK ADMIN
========================================================= */

async function checkAdmin() {

    try {

        const {
            data: {
                user
            },
            error: userError
        } = await supabaseClient.auth.getUser();

        if (userError) {

            console.error(
                "User check failed:",
                userError
            );

            return false;
        }

        if (!user) {
            return false;
        }


        const {
            data,
            error
        } = await supabaseClient
            .from("admin_users")
            .select("user_id")
            .eq("user_id", user.id)
            .maybeSingle();


        if (error) {

            console.error(
                "Admin check failed:",
                error
            );

            return false;
        }


        return !!data;

    } catch (error) {

        console.error(
            "Admin verification error:",
            error
        );

        return false;
    }

}


/* =========================================================
   SESSION
========================================================= */

async function checkSession() {

    try {

        const {
            data: {
                session
            },
            error
        } = await supabaseClient.auth.getSession();


        if (error) {

            console.error(
                "Session error:",
                error
            );

            showLogin();

            return;
        }


        if (!session) {

            showLogin();

            return;
        }


        const isAdmin = await checkAdmin();


        if (isAdmin) {

            showDashboard();

        } else {

            await supabaseClient.auth.signOut();

            showLogin();

            loginMessage.textContent =
                "You do not have admin access.";
        }


    } catch (error) {

        console.error(
            "Session check failed:",
            error
        );

        showLogin();
    }

}


/* =========================================================
   AUTH STATE
========================================================= */

supabaseClient.auth.onAuthStateChange(
    async (event, session) => {

        console.log(
            "Auth event:",
            event
        );

        if (event === "SIGNED_OUT") {

            showLogin();

            return;
        }

        if (
            event === "SIGNED_IN" &&
            session
        ) {

            const isAdmin =
                await checkAdmin();

            if (isAdmin) {
                showDashboard();
            } else {

                await supabaseClient
                    .auth
                    .signOut();

                showLogin();

                loginMessage.textContent =
                    "You do not have admin access.";
            }

        }

    }
);


/* =========================================================
   UI
========================================================= */

function showLogin() {

    loginSection?.classList.remove("hidden");

    dashboard?.classList.add("hidden");

}


function showDashboard() {

    loginSection?.classList.add("hidden");

    dashboard?.classList.remove("hidden");

    loadAdminFiles();

}


/* =========================================================
   LOGOUT
========================================================= */

logoutButton?.addEventListener(
    "click",
    async () => {

        logoutButton.disabled = true;
        logoutButton.textContent = "Logging out...";

        try {

            const {
                error
            } = await supabaseClient.auth.signOut();

            if (error) {
                throw error;
            }

            showLogin();

            loginForm?.reset();

            loginMessage.textContent = "";

        } catch (error) {

            console.error(
                "Logout error:",
                error
            );

            alert(
                error?.message ||
                "Unable to logout."
            );

        } finally {

            logoutButton.disabled = false;
            logoutButton.textContent = "Logout";

        }

    }
);


/* =========================================================
   FILE SELECT
========================================================= */

fileInput?.addEventListener(
    "change",
    () => {

        const file =
            fileInput.files?.[0];


        if (!file) {

            selectedFile.textContent =
                "No file selected";

            return;
        }


        selectedFile.textContent =
            `${file.name} • ${formatSize(file.size)}`;

    }
);


/* =========================================================
   UPLOAD
========================================================= */

uploadForm?.addEventListener(
    "submit",
    async (event) => {

        event.preventDefault();

        uploadMessage.textContent = "";


        const file =
            fileInput.files?.[0];


        const title =
            document
                .getElementById("fileTitle")
                .value
                .trim();


        const category =
            document
                .getElementById("fileCategory")
                .value;


        const description =
            document
                .getElementById("fileDescription")
                .value
                .trim();


        /* VALIDATION */

        if (!file) {

            uploadMessage.textContent =
                "Please choose a file.";

            return;
        }


        if (!title) {

            uploadMessage.textContent =
                "Please enter a title.";

            return;
        }


        if (!category) {

            uploadMessage.textContent =
                "Please select a category.";

            return;
        }


        if (file.size > MAX_FILE_SIZE) {

            uploadMessage.textContent =
                "File is larger than 25 MB.";

            return;
        }


        const extension =
            getExtension(file.name);


        if (!ALLOWED_EXTENSIONS.includes(extension)) {

            uploadMessage.textContent =
                "This file type is not allowed.";

            return;
        }


        uploadButton.disabled = true;

        uploadButton.textContent =
            "Uploading...";


        let filePath = null;


        try {

            /* VERIFY ADMIN */

            const isAdmin =
                await checkAdmin();


            if (!isAdmin) {

                throw new Error(
                    "You are not authorized to upload files."
                );
            }


            /* SAFE RANDOM FILE NAME */

            filePath =
                createSafePath(extension);


            /* STORAGE UPLOAD */

            const {
                error: uploadError
            } = await supabaseClient
                .storage
                .from(SUPABASE_BUCKET)
                .upload(
                    filePath,
                    file,
                    {
                        cacheControl: "3600",
                        upsert: false,
                        contentType:
                            file.type ||
                            "application/octet-stream"
                    }
                );


            if (uploadError) {
                throw uploadError;
            }


            /* DATABASE INSERT */

            const {
                error: databaseError
            } = await supabaseClient
                .from("files")
                .insert({
                    title: title,
                    description: description,
                    category: category,
                    file_name: file.name,
                    file_path: filePath,
                    file_type:
                        file.type ||
                        "application/octet-stream",
                    file_size: file.size
                });


            if (databaseError) {

                /* DELETE STORAGE FILE IF DATABASE FAILS */

                await supabaseClient
                    .storage
                    .from(SUPABASE_BUCKET)
                    .remove([
                        filePath
                    ]);

                throw databaseError;
            }


            uploadMessage.textContent =
                "✅ File uploaded successfully!";


            uploadForm.reset();

            selectedFile.textContent =
                "No file selected";


            await loadAdminFiles();


        } catch (error) {

            console.error(
                "Upload error:",
                error
            );

            uploadMessage.textContent =
                `Upload failed: ${
                    error?.message ||
                    "Unknown error"
                }`;

        } finally {

            uploadButton.disabled = false;

            uploadButton.textContent =
                "Upload to ADDY";

        }

    }
);


/* =========================================================
   LOAD ADMIN FILES
========================================================= */

async function loadAdminFiles() {

    if (!adminFileList) {
        return;
    }


    adminFileList.innerHTML = `
        <div class="loading">
            Loading files...
        </div>
    `;


    try {

        const {
            data,
            error
        } = await supabaseClient
            .from("files")
            .select("*")
            .order(
                "created_at",
                {
                    ascending: false
                }
            );


        if (error) {
            throw error;
        }


        const files = data || [];


        if (adminFileCount) {

            adminFileCount.textContent =
                `${files.length} ${
                    files.length === 1
                        ? "file"
                        : "files"
                }`;

        }


        adminFileList.innerHTML = "";


        if (!files.length) {

            adminFileList.innerHTML = `
                <div class="loading">
                    No files uploaded yet.
                </div>
            `;

            return;
        }


        files.forEach(file => {

            const item =
                document.createElement("div");


            item.className =
                "admin-file";


            item.innerHTML = `

                <div class="admin-file-info">

                    <strong>
                        ${escapeHTML(file.title)}
                    </strong>

                    <span>
                        ${escapeHTML(file.file_name)}
                        •
                        ${formatSize(file.file_size)}
                    </span>

                    <small>
                        ${escapeHTML(
                            file.category?.toUpperCase() ||
                            "OTHER"
                        )}
                    </small>

                </div>

                <button
                    class="delete-button"
                    type="button"
                >
                    Delete
                </button>

            `;


            const deleteButton =
                item.querySelector(
                    ".delete-button"
                );


            deleteButton?.addEventListener(
                "click",
                () => {
                    deleteFile(
                        file.id,
                        file.file_path,
                        file.title
                    );
                }
            );


            adminFileList.appendChild(item);

        });


    } catch (error) {

        console.error(
            "Admin files error:",
            error
        );


        adminFileList.innerHTML = `
            <div class="loading">
                Unable to load files.
            </div>
        `;

    }

}


/* =========================================================
   DELETE
========================================================= */

async function deleteFile(
    id,
    path,
    title
) {

    const confirmed =
        confirm(
            `Delete "${title}" permanently?`
        );


    if (!confirmed) {
        return;
    }


    try {

        const isAdmin =
            await checkAdmin();


        if (!isAdmin) {

            throw new Error(
                "You are not authorized."
            );
        }


        /* STORAGE */

        const {
            error: storageError
        } = await supabaseClient
            .storage
            .from(SUPABASE_BUCKET)
            .remove([
                path
            ]);


        if (storageError) {
            throw storageError;
        }


        /* DATABASE */

        const {
            error: databaseError
        } = await supabaseClient
            .from("files")
            .delete()
            .eq(
                "id",
                id
            );


        if (databaseError) {
            throw databaseError;
        }


        await loadAdminFiles();


    } catch (error) {

        console.error(
            "Delete error:",
            error
        );


        alert(
            `Delete failed: ${
                error?.message ||
                "Unknown error"
            }`
        );

    }

}


/* =========================================================
   HELPERS
========================================================= */

function getExtension(filename) {

    const parts =
        filename.split(".");


    return parts
        .pop()
        .toLowerCase();

}


function createSafePath(extension) {

    return `${crypto.randomUUID()}.${extension}`;

}


function formatSize(bytes) {

    if (
        bytes === null ||
        bytes === undefined
    ) {

        return "Unknown";

    }


    const units = [
        "B",
        "KB",
        "MB",
        "GB"
    ];


    let size =
        Number(bytes);


    let index = 0;


    while (
        size >= 1024 &&
        index < units.length - 1
    ) {

        size /= 1024;

        index++;
    }


    return `${size.toFixed(
        index ? 1 : 0
    )} ${units[index]}`;

}


function escapeHTML(value) {

    return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");

}


/* =========================================================
   START
========================================================= */

checkSession();
