const DEFAULT_SETTINGS = {
    paused: false,
    replacements: [{ from: "microsoft", to: "microslop" }],
    domainMode: "blacklist",
    domains: []
};

function updateBadge(settings) {
    if (settings.paused) {
        chrome.action.setBadgeText({ text: "⏸" });
        chrome.action.setBadgeBackgroundColor({ color: "#ff6b6b" });
        chrome.action.setBadgeTextColor({ color: "#ffffff" });
    } else {
        chrome.action.setBadgeText({ text: "" });
    }
}

chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName !== "sync" || !changes.settings) {
        return;
    }
    updateBadge(changes.settings.newValue);
});

chrome.storage.sync.get("settings", data => {
    const settings = data.settings || DEFAULT_SETTINGS;
    updateBadge(settings);
});

chrome.tabs.onActivated.addListener(activeInfo => {
    chrome.storage.sync.get("settings", data => {
        const settings = data.settings || DEFAULT_SETTINGS;
        updateBadge(settings);
    });
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.status === "complete") {
        chrome.storage.sync.get("settings", data => {
            const settings = data.settings || DEFAULT_SETTINGS;
            updateBadge(settings);
        });
    }
});