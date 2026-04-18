const DEFAULT_SETTINGS = {
    paused: false,
    replacements: [{ from: "microsoft", to: "microslop" }]
};

let currentSettings = DEFAULT_SETTINGS;

function escapeRegExp(value) {
    return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function matchCase(template, text) {
    let result = "";

    for (let i = 0; i < text.length; i++) {
        const templateChar = template[i] || template[template.length - 1];
        const textChar = text[i];

        if (templateChar === templateChar.toUpperCase()) {
            result += textChar.toUpperCase();
        } else {
            result += textChar.toLowerCase();
        }
    }

    return result;
}

function normalizeSettings(raw) {
    const settings = raw && typeof raw === "object" ? raw : {};
    const paused = Boolean(settings.paused);
    const replacements = Array.isArray(settings.replacements)
        ? settings.replacements
            .filter(item => item && typeof item.from === "string" && typeof item.to === "string")
            .map(item => ({ from: item.from.trim(), to: item.to.trim() }))
            .filter(item => item.from.length > 0)
        : DEFAULT_SETTINGS.replacements;

    return {
        paused,
        replacements: replacements.length > 0 ? replacements : DEFAULT_SETTINGS.replacements
    };
}

function isIgnoredTextNode(node) {
    if (!node.parentElement) {
        return true;
    }

    const ignoredTags = new Set(["SCRIPT", "STYLE", "NOSCRIPT", "TEXTAREA", "INPUT"]);
    if (ignoredTags.has(node.parentElement.tagName)) {
        return true;
    }

    return node.parentElement.closest("[contenteditable='true']") !== null;
}

function applyReplacements(text) {
    let updatedText = text;

    for (const rule of currentSettings.replacements) {
        const fromPattern = new RegExp(escapeRegExp(rule.from), "gi");
        updatedText = updatedText.replace(fromPattern, match => matchCase(match, rule.to));
    }

    return updatedText;
}

function replaceTextInNode(node) {
    if (currentSettings.paused || !node) {
        return;
    }

    if (node.nodeType === Node.TEXT_NODE) {
        if (isIgnoredTextNode(node)) {
            return;
        }

        const nextValue = applyReplacements(node.nodeValue);
        if (nextValue !== node.nodeValue) {
            node.nodeValue = nextValue;
        }
        return;
    }

    if (node.nodeType !== Node.ELEMENT_NODE) {
        return;
    }

    for (const childNode of node.childNodes) {
        replaceTextInNode(childNode);
    }
}

function replacePageText() {
    if (!document.body || currentSettings.paused) {
        return;
    }

    replaceTextInNode(document.body);
}

function loadSettingsAndRun() {
    chrome.storage.sync.get("settings", data => {
        currentSettings = normalizeSettings(data.settings);
        replacePageText();
    });
}

const observer = new MutationObserver(mutations => {
    if (currentSettings.paused) {
        return;
    }

    for (const mutation of mutations) {
        if (mutation.type === "characterData") {
            replaceTextInNode(mutation.target);
            continue;
        }

        mutation.addedNodes.forEach(addedNode => replaceTextInNode(addedNode));
    }
});

observer.observe(document.documentElement, {
    childList: true,
    subtree: true,
    characterData: true
});

chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName !== "sync" || !changes.settings) {
        return;
    }

    currentSettings = normalizeSettings(changes.settings.newValue);
    replacePageText();
});

chrome.runtime.onMessage.addListener(message => {
    if (!message || typeof message !== "object") {
        return;
    }

    if (message.type === "SETTINGS_UPDATED" && message.settings) {
        currentSettings = normalizeSettings(message.settings);
        replacePageText();
    }

    if (message.type === "RUN_REPLACE_NOW") {
        replacePageText();
    }
});

loadSettingsAndRun();
