const DEFAULT_SETTINGS = {
    paused: false,
    replacements: [{ from: "microsoft", to: "microslop" }]
};

const togglePauseButton = document.getElementById("togglePause");
const replacementList = document.getElementById("replacementList");
const addEntryButton = document.getElementById("addEntry");
const newFromInput = document.getElementById("newFrom");
const newToInput = document.getElementById("newTo");

let settings = DEFAULT_SETTINGS;

function normalizeSettings(raw) {
    const incoming = raw && typeof raw === "object" ? raw : {};
    const replacements = Array.isArray(incoming.replacements)
        ? incoming.replacements
            .filter(item => item && typeof item.from === "string" && typeof item.to === "string")
            .map(item => ({ from: item.from.trim(), to: item.to.trim() }))
            .filter(item => item.from.length > 0)
        : DEFAULT_SETTINGS.replacements;

    return {
        paused: Boolean(incoming.paused),
        replacements: replacements.length > 0 ? replacements : DEFAULT_SETTINGS.replacements
    };
}

function updatePauseButton() {
    togglePauseButton.textContent = settings.paused ? "Resume" : "Pause";
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
        renderReplacementList();
    });
}

togglePauseButton.addEventListener("click", () => {
    settings.paused = !settings.paused;
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
    renderReplacementList();
});
