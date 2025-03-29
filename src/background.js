let activeTabId = null;

// Listen for messages from content script
chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
	if (request.action === "getData") {
		// Retrieve timer data from storage
		chrome.storage.local.get(["timer"], function (result) {
			sendResponse({ timer: result.timer || undefined });
		});
		return true;
	} else if (request.action === "setData") {
		// Store timer data in storage
		chrome.storage.local.set({ timer: request.data }, function () {
			sendResponse({ success: true });
		});
		console.log("DATA SAVED");

		return true;
	}

	return false;
});

function isYouTubeURL(url) {
	return url && url.includes("youtube.com");
}

let youtubeTabCount = 0;
function getYtTabsCount() {
	chrome.tabs.query({}, function (tabs) {
		for (const tab of tabs) {
			if (isYouTubeURL(tab.url)) {
				youtubeTabCount++;
			}
		}
	});

	return youtubeTabCount;
}

// Check if it's a yt tab
// chrome.tabs.onUpdated.addListener(function (tabId, changeInfo, tab) {
// 	if (changeInfo.status === "complete" && tab.url) {
// 		if (isYouTubeURL(tab.url)) {
// 			// start timer

// 			// If timer doesn't exist start timer and save it
// 			if (!getTime()) {
// 			}

// 			// if timer exist start timer with prev values if not start timer with default values
// 			console.log("is yt");
// 		} else {
// 			console.log("is not yt");
// 			// ONE YT TAB
// 		}
// 	}
// });

// // IS YOUTUBE TAB ACTIVE?
// chrome.tabs.onActivated.addListener(function (activeInfo) {
// 	chrome.tabs.get(activeInfo.tabId, function (tab) {
// 		if (tab && tab.url && isYouTubeURL(tab.url)) {
// 			console.log("Active tab is now a YouTube tab:", tab);
// 		}
// 	});
// });

// chrome.tabs.onRemoved.addListener((tabId) => {
// 	if (tabId === activeTabId) {
// 		// TODO: on removed save the current day, timer
// 		activeTabId = null; // Reset if the active tab is closed
// 		console.log("Active tab closed, resetting activeTabId");
// 	}
// });
