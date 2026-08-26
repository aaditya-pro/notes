const supabaseClient = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_KEY
);

const fileGrid = document.getElementById("fileGrid");
const loading = document.getElementById("loading");
const emptyState = document.getElementById("emptyState");
const searchInput = document.getElementById("searchInput");
const fileCount = document.getElementById("fileCount");

let allFiles = [];
let selectedCategory = "all";


function escapeHtml(value) {

    return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}


function formatSize(bytes) {

    if (!bytes) return "Unknown size";

    const units = ["B", "KB", "MB", "GB"];

    let size = bytes;
    let index = 0;

    while (
        size >= 1024 &&
        index < units.length - 1
    ) {
        size /= 1024;
        index++;
    }

    return `${size.toFixed(index ? 1 : 0)} ${units[index]}`;
}


function getIcon(type, filename = "") {

    const value =
        `${type || ""} ${filename || ""}`.toLowerCase();

    if (value.includes("pdf")) return "📕";

    if (
        value.includes("excel") ||
        value.includes("spreadsheet") ||
        value.includes("xlsx")
    ) return "📊";

    if (
        value.includes("powerpoint") ||
        value.includes("presentation") ||
        value.includes("pptx")
    ) return "📽️";

    if (
        value.includes("word") ||
        value.includes("document") ||
        value.includes("docx")
    ) return "📘";

    return "📎";
}


function getDownloadUrl(path) {

    const {
        data
    } = supabaseClient
        .storage
        .from(SUPABASE_BUCKET)
        .getPublicUrl(path);

    return data.publicUrl;
}


function renderFiles() {

    const search =
        searchInput.value
            .trim()
            .toLowerCase();


    const filtered =
        allFiles.filter(file => {

            const searchable =
                `${file.title}
                 ${file.description || ""}
                 ${file.file_name}
                 ${file.category}`
                    .toLowerCase();


            const matchesSearch =
                !search ||
                searchable.includes(search);


            const matchesCategory =
                selectedCategory === "all" ||
                file.category.toLowerCase() ===
                selectedCategory;


            return (
                matchesSearch &&
                matchesCategory
            );

        });


    fileGrid.innerHTML = "";

    fileCount.textContent =
        `${filtered.length} ${
            filtered.length === 1
                ? "file"
                : "files"
        }`;


    if (!filtered.length) {

        emptyState.classList.remove("hidden");

        return;
    }


    emptyState.classList.add("hidden");


    filtered.forEach(file => {

        const card =
            document.createElement("article");

        card.className = "file-card";


        const url =
            getDownloadUrl(file.file_path);


        card.innerHTML = `

            <div class="file-icon">
                ${getIcon(
                    file.file_type,
                    file.file_name
                )}
            </div>

            <h3>
                ${escapeHtml(file.title)}
            </h3>

            <p class="file-description">
                ${escapeHtml(
                    file.description ||
                    "Study material from ADDY."
                )}
            </p>

            <div class="file-meta">
                <span>
                    ${escapeHtml(file.category)}
                </span>

                <span>•</span>

                <span>
                    ${formatSize(file.file_size)}
                </span>
            </div>

            <a
                class="download-button"
                href="${url}"
                target="_blank"
                rel="noopener"
                download
            >
                DOWNLOAD
            </a>
        `;


        fileGrid.appendChild(card);

    });
}


async function loadFiles() {

    loading.classList.remove("hidden");

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


        if (error) throw error;

        allFiles = data || [];

        renderFiles();

    } catch (error) {

        console.error(error);

        fileGrid.innerHTML = `
            <div class="loading">
                Unable to load ADDY library.
            </div>
        `;

    } finally {

        loading.classList.add("hidden");
    }
}


/* CATEGORY FILTER */

document
    .querySelectorAll(".category")
    .forEach(button => {

        button.addEventListener(
            "click",
            () => {

                document
                    .querySelectorAll(".category")
                    .forEach(btn =>
                        btn.classList.remove("active")
                    );


                button.classList.add("active");


                selectedCategory =
                    button
                        .dataset
                        .category
                        .toLowerCase();


                renderFiles();

            }
        );

    });


/* SEARCH */

searchInput.addEventListener(
    "input",
    renderFiles
);


/* COMMAND + K */

document.addEventListener(
    "keydown",
    event => {

        if (
            (event.metaKey || event.ctrlKey) &&
            event.key.toLowerCase() === "k"
        ) {

            event.preventDefault();

            searchInput.focus();
        }

    }
);


/* START */

loadFiles();
