let activeTabId = null;

function isYouTubeURL(url) {
	return url && url.includes("youtube.com");
}

// TODO: START TIMER IN NEW TAB AND CONTINUE IT WHEN CHANGES YT TAB
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

function saveTime({ seconds, minutes }) {
	chrome.storage.sync.set(
		{ ["timer"]: { seconds: seconds, minutes: minutes } },
		() => {
			if (chrome.runtime.lastError) {
				console.error("Error saving setting:", chrome.runtime.lastError);
			} else {
				console.log(`Setting ${"timer"} saved successfully.`);
			}
		}
	);
}

// Retrieve a global setting
function getTime(callback) {
	chrome.storage.sync.get(["timer"], (result) => {
		if (chrome.runtime.lastError) {
			console.error("Error retrieving setting:", chrome.runtime.lastError);
		} else {
			console.log("timer");

			// callback(result["timer"]); // Pass the setting value to the callback
		}
	});
}

// Check if it's a yt tab
chrome.tabs.onUpdated.addListener(function (tabId, changeInfo, tab) {
	if (changeInfo.status === "complete" && tab.url) {
		if (isYouTubeURL(tab.url)) {
			// if timer exist start timer with prev values if not start timer with default values
			console.log("is yt");
		} else {
			console.log("is not yt");
			// ONE YT TAB
		}
	}
});

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

/*
 * Start a new timer when a youtube tab is created
 * Continue previous timer
 * Stop timer when user leaves youtube tab
 * Save timer every second in the browser storage
 */
