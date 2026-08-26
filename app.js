/* =========================================================
   ADDY DIGITAL STUDY LIBRARY
   PUBLIC APP
========================================================= */


let allFiles = [];
let currentCategory = "all";


/* =========================================================
   ELEMENTS
========================================================= */

const fileGrid =
    document.getElementById("fileGrid");

const fileCount =
    document.getElementById("fileCount");

const loading =
    document.getElementById("loading");

const emptyState =
    document.getElementById("emptyState");

const errorState =
    document.getElementById("errorState");

const searchInput =
    document.getElementById("searchInput");

const clearSearch =
    document.getElementById("clearSearch");

const mobileMenu =
    document.querySelector(".mobile-menu");

const navLinks =
    document.querySelector(".nav-links");


/* =========================================================
   START
========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    () => {

        loadFiles();

        setupSearch();

        setupCategories();

        setupMobileMenu();

        setupSmoothScroll();

        setupKeyboardShortcut();

        setupScrollReveal();

    }
);


/* =========================================================
   LOAD FILES
========================================================= */

async function loadFiles() {

    showLoading();


    try {

        const {
            data,
            error
        } = await supabaseClient
            .from("files")
            .select(`
                id,
                title,
                description,
                category,
                file_name,
                file_path,
                file_type,
                file_size,
                created_at
            `)
            .order(
                "created_at",
                {
                    ascending: false
                }
            );


        if (error) {

            console.error(
                "Supabase database error:",
                error
            );

            showError(
                "Could not load your study files."
            );

            return;
        }


        allFiles = data || [];


        filterFiles();


    } catch (error) {

        console.error(
            "Loading error:",
            error
        );

        showError(
            "Something went wrong while loading files."
        );

    } finally {

        hideLoading();

    }
}


/* =========================================================
   RENDER FILES
========================================================= */

function renderFiles(files) {

    fileGrid.innerHTML = "";


    if (fileCount) {

        fileCount.textContent =
            `${files.length} ${
                files.length === 1
                    ? "file"
                    : "files"
            }`;

    }


    if (!files.length) {

        emptyState.classList.remove("hidden");

        return;

    }


    emptyState.classList.add("hidden");


    files.forEach(
        (file, index) => {

            const card =
                document.createElement("article");


            card.className =
                "file-card";


            card.style.animationDelay =
                `${index * 70}ms`;


            const type =
                getFileType(file);


            const icon =
                getFileIcon(type);


            const name =
                file.title ||
                file.file_name ||
                "Untitled file";


            const description =
                file.description ||
                "Study material from ADDY.";


            const size =
                formatSize(file.file_size);


            const url =
                getFileUrl(file);


            card.innerHTML = `

                <div class="file-type">
                    ${icon}
                </div>

                <h3>
                    ${escapeHTML(name)}
                </h3>

                <p class="file-description">
                    ${escapeHTML(description)}
                </p>

                <div class="file-info">

                    <span>
                        ${escapeHTML(
                            type.toUpperCase()
                        )}
                    </span>

                    ${
                        size
                        ? `
                        <span>•</span>
                        <span>
                            ${escapeHTML(size)}
                        </span>
                        `
                        : ""
                    }

                </div>

                ${
                    url
                    ? `
                    <a
                        class="download-button"
                        href="${escapeAttribute(url)}"
                        target="_blank"
                        rel="noopener noreferrer"
                        download
                    >
                        ↓ DOWNLOAD
                    </a>
                    `
                    : `
                    <button
                        class="download-button"
                        disabled
                    >
                        FILE UNAVAILABLE
                    </button>
                    `
                }

            `;


            fileGrid.appendChild(card);

        }
    );


    observeCards();

}


/* =========================================================
   FILE TYPE
========================================================= */

function getFileType(file) {

    if (file.category) {

        return file.category
            .toLowerCase()
            .replace(".", "");

    }


    if (file.file_type) {

        const mime =
            file.file_type.toLowerCase();


        const mimeMap = {

            "application/pdf":
                "pdf",

            "application/msword":
                "doc",

            "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
                "docx",

            "application/vnd.ms-excel":
                "xls",

            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet":
                "xlsx",

            "application/vnd.ms-powerpoint":
                "ppt",

            "application/vnd.openxmlformats-officedocument.presentationml.presentation":
                "pptx",

            "text/plain":
                "txt",

            "application/zip":
                "zip"

        };


        if (mimeMap[mime]) {

            return mimeMap[mime];

        }


        if (!mime.includes("/")) {

            return mime.replace(".", "");

        }

    }


    const filename =
        file.file_name ||
        file.name ||
        "";


    const parts =
        filename.split(".");


    if (parts.length > 1) {

        return parts
            .pop()
            .toLowerCase();

    }


    return "other";

}


/* =========================================================
   ICON
========================================================= */

function getFileIcon(type) {

    const icons = {

        pdf: "📕",

        doc: "📘",

        docx: "📘",

        xls: "📊",

        xlsx: "📊",

        ppt: "📽️",

        pptx: "📽️",

        txt: "📎",

        zip: "📦"

    };


    return icons[type] || "📎";

}


/* =========================================================
   FILE URL
========================================================= */

function getFileUrl(file) {

    if (!file.file_path) {

        return null;

    }


    const {
        data
    } = supabaseClient
        .storage
        .from(SUPABASE_BUCKET)
        .getPublicUrl(
            file.file_path
        );


    return data?.publicUrl || null;

}


/* =========================================================
   FILE SIZE
========================================================= */

function formatSize(bytes) {

    if (
        bytes === null ||
        bytes === undefined ||
        bytes === ""
    ) {

        return "";

    }


    const number =
        Number(bytes);


    if (
        !Number.isFinite(number) ||
        number < 0
    ) {

        return "";

    }


    if (number === 0) {

        return "0 B";

    }


    const units = [
        "B",
        "KB",
        "MB",
        "GB"
    ];


    let size = number;

    let index = 0;


    while (
        size >= 1024 &&
        index < units.length - 1
    ) {

        size /= 1024;

        index++;

    }


    return `${size.toFixed(
        index === 0 ? 0 : 1
    )} ${units[index]}`;

}


/* =========================================================
   SEARCH
========================================================= */

function setupSearch() {

    if (!searchInput) return;


    searchInput.addEventListener(
        "input",
        () => {

            updateClearButton();

            filterFiles();

        }
    );


    if (clearSearch) {

        clearSearch.addEventListener(
            "click",
            () => {

                searchInput.value = "";

                updateClearButton();

                searchInput.focus();

                filterFiles();

            }
        );

    }

}


/* =========================================================
   FILTER
========================================================= */

function filterFiles() {

    const query =
        searchInput
            ? searchInput.value
                .toLowerCase()
                .trim()
            : "";


    const filtered =
        allFiles.filter(
            file => {

                const name =
                    String(
                        file.title ||
                        file.file_name ||
                        ""
                    ).toLowerCase();


                const description =
                    String(
                        file.description ||
                        ""
                    ).toLowerCase();


                const type =
                    getFileType(file);


                const category =
                    String(
                        file.category ||
                        ""
                    ).toLowerCase();


                const matchesSearch =
                    !query ||
                    name.includes(query) ||
                    description.includes(query) ||
                    type.includes(query) ||
                    category.includes(query);


                const matchesCategory =
                    currentCategory === "all" ||
                    type === currentCategory ||
                    category === currentCategory;


                return (
                    matchesSearch &&
                    matchesCategory
                );

            }
        );


    renderFiles(filtered);

}


/* =========================================================
   CATEGORIES
========================================================= */

function setupCategories() {

    document
        .querySelectorAll(".category")
        .forEach(button => {

            button.addEventListener(
                "click",
                () => {

                    document
                        .querySelectorAll(".category")
                        .forEach(btn => {

                            btn.classList.remove(
                                "active"
                            );

                        });


                    button.classList.add(
                        "active"
                    );


                    currentCategory =
                        button.dataset.category;


                    filterFiles();

                }
            );

        });

}


/* =========================================================
   CLEAR SEARCH BUTTON
========================================================= */

function updateClearButton() {

    if (!clearSearch || !searchInput) {
        return;
    }


    clearSearch.style.display =
        searchInput.value.length
            ? "block"
            : "none";

}


/* =========================================================
   LOADING
========================================================= */

function showLoading() {

    if (loading) {

        loading.classList.remove(
            "hidden"
        );

    }


    if (emptyState) {

        emptyState.classList.add(
            "hidden"
        );

    }


    if (errorState) {

        errorState.classList.add(
            "hidden"
        );

    }

}


function hideLoading() {

    if (loading) {

        loading.classList.add(
            "hidden"
        );

    }

}


/* =========================================================
   ERROR
========================================================= */

function showError(message) {

    hideLoading();


    if (errorState) {

        errorState.classList.remove(
            "hidden"
        );

        const messageElement =
            errorState.querySelector(
                "p"
            );


        if (messageElement) {

            messageElement.textContent =
                message;

        }

    } else {

        fileGrid.innerHTML = `

            <div class="error-state">

                <div class="error-icon">
                    ⚠
                </div>

                <h3>
                    Something went wrong
                </h3>

                <p>
                    ${escapeHTML(message)}
                </p>

                <button
                    class="download-button"
                    id="retryButton"
                >
                    TRY AGAIN
                </button>

            </div>

        `;


        document
            .getElementById("retryButton")
            ?.addEventListener(
                "click",
                loadFiles
            );

    }


    if (fileCount) {

        fileCount.textContent =
            "0 files";

    }

}


/* =========================================================
   MOBILE MENU
========================================================= */

function setupMobileMenu() {

    if (!mobileMenu || !navLinks) {
        return;
    }


    mobileMenu.addEventListener(
        "click",
        () => {

            navLinks.classList.toggle(
                "open"
            );

        }
    );


    navLinks
        .querySelectorAll("a")
        .forEach(link => {

            link.addEventListener(
                "click",
                () => {

                    navLinks.classList.remove(
                        "open"
                    );

                }
            );

        });

}


/* =========================================================
   SMOOTH SCROLL
========================================================= */

function setupSmoothScroll() {

    document
        .querySelectorAll(
            'a[href^="#"]'
        )
        .forEach(link => {

            link.addEventListener(
                "click",
                event => {

                    const selector =
                        link.getAttribute(
                            "href"
                        );


                    if (
                        !selector ||
                        selector === "#"
                    ) {

                        return;

                    }


                    const target =
                        document.querySelector(
                            selector
                        );


                    if (!target) return;


                    event.preventDefault();


                    target.scrollIntoView({
                        behavior: "smooth",
                        block: "start"
                    });

                }
            );

        });

}


/* =========================================================
   COMMAND + K
========================================================= */

function setupKeyboardShortcut() {

    document.addEventListener(
        "keydown",
        event => {

            if (
                (event.metaKey ||
                    event.ctrlKey) &&
                event.key.toLowerCase() === "k"
            ) {

                event.preventDefault();


                searchInput?.focus();

            }

        }
    );

}


/* =========================================================
   SCROLL REVEAL
========================================================= */

function setupScrollReveal() {

    if (
        !("IntersectionObserver" in window)
    ) {

        document
            .querySelectorAll(".reveal")
            .forEach(element => {

                element.classList.add(
                    "visible"
                );

            });

        return;

    }


    const observer =
        new IntersectionObserver(
            entries => {

                entries.forEach(
                    entry => {

                        if (
                            entry.isIntersecting
                        ) {

                            entry.target.classList.add(
                                "visible"
                            );


                            observer.unobserve(
                                entry.target
                            );

                        }

                    }
                );

            },
            {
                threshold: 0.12
            }
        );


    document
        .querySelectorAll(".reveal")
        .forEach(element => {

            observer.observe(element);

        });

}


/* =========================================================
   FILE CARD REVEAL
========================================================= */

function observeCards() {

    const cards =
        document.querySelectorAll(
            ".file-card"
        );


    if (
        !("IntersectionObserver" in window)
    ) {

        cards.forEach(card => {

            card.classList.add(
                "visible"
            );

        });

        return;

    }


    const observer =
        new IntersectionObserver(
            entries => {

                entries.forEach(
                    entry => {

                        if (
                            entry.isIntersecting
                        ) {

                            entry.target.classList.add(
                                "visible"
                            );


                            observer.unobserve(
                                entry.target
                            );

                        }

                    }
                );

            },
            {
                threshold: 0.1
            }
        );


    cards.forEach(card => {

        observer.observe(card);

    });

}


/* =========================================================
   SECURITY / HTML ESCAPING
========================================================= */

function escapeHTML(value) {

    return String(value)
        .replaceAll(
            "&",
            "&amp;"
        )
        .replaceAll(
            "<",
            "&lt;"
        )
        .replaceAll(
            ">",
            "&gt;"
        )
        .replaceAll(
            '"',
            "&quot;"
        )
        .replaceAll(
            "'",
            "&#039;"
        );

}


function escapeAttribute(value) {

    return String(value)
        .replaceAll(
            "&",
            "&amp;"
        )
        .replaceAll(
            '"',
            "&quot;"
        )
        .replaceAll(
            "<",
            "&lt;"
        )
        .replaceAll(
            ">",
            "&gt;"
        );

}
