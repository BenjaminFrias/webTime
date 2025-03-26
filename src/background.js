const tabVisibility = {};

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
	if (request.action === "tabVisible") {
		tabVisibility[sender.tab.id] = "visible";
		console.log(`Tab ${sender.tab.id} is visible`);
	} else if (request.action === "tabHidden") {
		tabVisibility[sender.tab.id] = "hidden";
		console.log(`Tab ${sender.tab.id} is hidden`);
	}
});

chrome.tabs.onRemoved.addListener(function (tabId, removeInfo) {
	delete tabVisibility[tabId];
});
