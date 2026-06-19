const DEFAULT_SETTINGS = {
    paused: false,
    replacements: [{ from: "microsoft", to: "microslop" }],
    domainMode: "blacklist",
    domains: []
};

const togglePauseButton = document.getElementById("togglePause");
const replacementList = document.getElementById("replacementList");
const addEntryButton = document.getElementById("addEntry");
const newFromInput = document.getElementById("newFrom");
const newToInput = document.getElementById("newTo");
const domainList = document.getElementById("domainList");
const addDomainButton = document.getElementById("addDomain");
const newDomainInput = document.getElementById("newDomain");
const modeBlacklist = document.getElementById("modeBlacklist");
const modeWhitelist = document.getElementById("modeWhitelist");

let settings = DEFAULT_SETTINGS;

function normalizeSettings(raw) {
    const incoming = raw && typeof raw === "object" ? raw : {};
    const replacements = Array.isArray(incoming.replacements)
        ? incoming.replacements
            .filter(item => item && typeof item.from === "string" && typeof item.to === "string")
            .map(item => ({ from: item.from.trim(), to: item.to.trim() }))
            .filter(item => item.from.length > 0)
        : DEFAULT_SETTINGS.replacements;

    const domains = Array.isArray(incoming.domains)
        ? incoming.domains
            .filter(item => item && typeof item === "string")
            .map(item => item.trim().toLowerCase())
            .filter(item => item.length > 0)
        : DEFAULT_SETTINGS.domains;

    return {
        paused: Boolean(incoming.paused),
        replacements: replacements.length > 0 ? replacements : DEFAULT_SETTINGS.replacements,
        domainMode: incoming.domainMode === "whitelist" ? "whitelist" : "blacklist",
        domains
    };
}

function updatePauseButton() {
    togglePauseButton.textContent = settings.paused ? "Resume" : "Pause";
}

function updateModeRadios() {
    modeBlacklist.checked = settings.domainMode === "blacklist";
    modeWhitelist.checked = settings.domainMode === "whitelist";
}

function renderDomainList() {
    domainList.innerHTML = "";

    if (settings.domains.length === 0) {
        const empty = document.createElement("div");
        empty.className = "empty";
        empty.textContent = "No domains yet.";
        domainList.appendChild(empty);
        return;
    }

    settings.domains.forEach((domain, index) => {
        const row = document.createElement("div");
        row.className = "row";
        row.setAttribute("role", "listitem");

        const domainInput = document.createElement("input");
        domainInput.value = domain;
        domainInput.placeholder = "Domain";
        domainInput.setAttribute("aria-label", `Domain ${index + 1}`);

        const deleteButton = document.createElement("button");
        deleteButton.type = "button";
        deleteButton.textContent = "X";
        deleteButton.className = "delete";
        deleteButton.setAttribute("aria-label", `Delete domain ${index + 1}`);

        domainInput.addEventListener("change", () => {
            settings.domains[index] = domainInput.value.trim().toLowerCase();
            sanitizeDomainList();
            saveSettings();
        });

        deleteButton.addEventListener("click", () => {
            settings.domains.splice(index, 1);
            sanitizeDomainList();
            saveSettings();
        });

        row.appendChild(domainInput);
        row.appendChild(deleteButton);
        domainList.appendChild(row);
    });
}

function sanitizeDomainList() {
    settings.domains = settings.domains
        .filter(domain => domain && domain.trim().length > 0)
        .map(domain => domain.trim().toLowerCase());
}

function renderReplacementList() {
    replacementList.innerHTML = "";

    if (settings.replacements.length === 0) {
        const empty = document.createElement("div");
        empty.className = "empty";
        empty.textContent = "No entries yet.";
        replacementList.appendChild(empty);
        return;
    }

    settings.replacements.forEach((entry, index) => {
        const row = document.createElement("div");
        row.className = "row";
        row.setAttribute("role", "listitem");

        const fromInput = document.createElement("input");
        fromInput.value = entry.from;
        fromInput.placeholder = "Find text";
        fromInput.setAttribute("aria-label", `Find text ${index + 1}`);

        const toInput = document.createElement("input");
        toInput.value = entry.to;
        toInput.placeholder = "Replace with";
        toInput.setAttribute("aria-label", `Replace text ${index + 1}`);

        const deleteButton = document.createElement("button");
        deleteButton.type = "button";
        deleteButton.textContent = "X";
        deleteButton.className = "delete";
        deleteButton.setAttribute("aria-label", `Delete rule ${index + 1}`);

        fromInput.addEventListener("change", () => {
            settings.replacements[index].from = fromInput.value.trim();
            sanitizeReplacementList();
            saveSettings();
        });

        toInput.addEventListener("change", () => {
            settings.replacements[index].to = toInput.value.trim();
            sanitizeReplacementList();
            saveSettings();
        });

        deleteButton.addEventListener("click", () => {
            settings.replacements.splice(index, 1);
            sanitizeReplacementList();
            saveSettings();
        });

        row.appendChild(fromInput);
        row.appendChild(toInput);
        row.appendChild(deleteButton);
        replacementList.appendChild(row);
    });
}

function sanitizeReplacementList() {
    settings.replacements = settings.replacements
        .filter(entry => entry.from && entry.from.trim().length > 0)
        .map(entry => ({
            from: entry.from.trim(),
            to: (entry.to || "").trim()
        }));

    if (settings.replacements.length === 0) {
        settings.replacements = [{ ...DEFAULT_SETTINGS.replacements[0] }];
    }
}

function saveSettings() {
    chrome.storage.sync.set({ settings }, () => {
        updatePauseButton();
        updateModeRadios();
        renderDomainList();
        renderReplacementList();
    });
}

togglePauseButton.addEventListener("click", () => {
    settings.paused = !settings.paused;
    saveSettings();
});

modeBlacklist.addEventListener("change", () => {
    if (modeBlacklist.checked) {
        settings.domainMode = "blacklist";
        saveSettings();
    }
});

modeWhitelist.addEventListener("change", () => {
    if (modeWhitelist.checked) {
        settings.domainMode = "whitelist";
        saveSettings();
    }
});

addDomainButton.addEventListener("click", () => {
    const domain = newDomainInput.value.trim().toLowerCase();

    if (!domain) {
        return;
    }

    settings.domains.push(domain);
    newDomainInput.value = "";
    saveSettings();
});

addEntryButton.addEventListener("click", () => {
    const from = newFromInput.value.trim();
    const to = newToInput.value.trim();

    if (!from) {
        return;
    }

    settings.replacements.push({ from, to });
    newFromInput.value = "";
    newToInput.value = "";
    saveSettings();
});

chrome.storage.sync.get("settings", data => {
    settings = normalizeSettings(data.settings);
    updatePauseButton();
    updateModeRadios();
    renderDomainList();
    renderReplacementList();
});