const STORAGE_TIMER_KEY = "timer";
const STORAGE_LAST_DAY_KEY = "lastSavedDay";
const defaultTimer = { minutes: 0, seconds: 0 };
class Timer {
	constructor() {
		this.timer = null;
	}

	startTimer(minutes = 0, seconds = 0) {
		this.timer = setInterval(() => {
			seconds++;
			if (seconds > 59) {
				minutes++;
				seconds = 0;
			}

			setData(STORAGE_TIMER_KEY, { minutes, seconds });
			sendTimerData();
		}, 1000);
	}

	stopTimer() {
		clearInterval(this.timer);
	}
}
const timerHandler = new Timer();

async function initializeExtension() {
	const defaultTimer = { minutes: 0, seconds: 0 };
	await ensureDefaultData(STORAGE_TIMER_KEY, defaultTimer);

	const today = new Date().toLocaleDateString();
	await ensureDefaultData(STORAGE_LAST_DAY_KEY, today);
}
// Initialize extension on install/startup
chrome.runtime.onInstalled.addListener(initializeExtension);
chrome.runtime.onStartup.addListener(initializeExtension);

// Start timer when new YouTube tab is open
chrome.tabs.onUpdated.addListener(async function (tabId, changeInfo, tab) {
	if (changeInfo.status === "complete" && tab && tab.url) {
		// Create timer element in content.js
		if (isYouTubeURL(tab.url)) {
			chrome.tabs.sendMessage(tabId, {
				type: "createTimerElement",
			});
		}

		setDefaultTimerDaily();
		updateTimerState(tab);
	}
});

chrome.windows.onFocusChanged.addListener(async function (windowId) {
	if (windowId == chrome.windows.WINDOW_ID_NONE) {
		timerHandler.stopTimer();
	} else {
		try {
			const result = await getData(STORAGE_TIMER_KEY);
			if (!result) {
				throw new Error("Error getting timer data from local storage");
			}
			timerHandler.stopTimer();
			timerHandler.startTimer(result.minutes, result.seconds);
		} catch (err) {
			console.log("Update timer state error: ", err);
		}
	}
});

// Start/Stop timer when a YouTube tab is active
chrome.tabs.onActivated.addListener(async function (activeInfo) {
	chrome.tabs.get(activeInfo.tabId, async function (tab) {
		if (tab && tab.url) {
			setDefaultTimerDaily();
			updateTimerState(tab);
		}
	});
});

async function getCurrentTab() {
	const queryOptions = { active: true, currentWindow: true };
	try {
		let [tab] = await chrome.tabs.query(queryOptions);
		return tab;
	} catch (err) {
		console.log(err);
	}
}

// TODO: Only be responsible for sending data. Not validating URL
async function sendTimerData() {
	let tab = await getCurrentTab();

	if (tab && tab.url && isYouTubeURL(tab.url)) {
		let activeTabId = tab.id;

		try {
			const result = await getData(STORAGE_TIMER_KEY);
			if (!result) {
				throw new Error("Error at getting data: ", result);
			}

			chrome.tabs.sendMessage(activeTabId, {
				type: "background",
				timer: result,
			});
		} catch (err) {
			console.log(err);
		}
	}
}

// Resetting timer daily
function setDefaultTimerDaily() {
	const today = new Date().toLocaleDateString();

	// Set default timer every new day
	chrome.storage.local.get([STORAGE_LAST_DAY_KEY], (result) => {
		if (!result[STORAGE_LAST_DAY_KEY]) {
			// Storing current day in local storage
			console.log("No previous date value... storing current day");
			chrome.storage.local.set({ [STORAGE_LAST_DAY_KEY]: today });
		} else {
			console.log("Checking if it's a new day");
			// Check for new day with local storage value
			if (today != result[STORAGE_LAST_DAY_KEY]) {
				console.log("It's a new day... setting default timer");
				setData(STORAGE_TIMER_KEY, defaultTimer);
				setData(STORAGE_LAST_DAY_KEY, today);
			}
		}
	});
}
setDefaultTimerDaily();

// handles starting/stopping the timer based on whether the tab is a YouTube tab.
async function updateTimerState(tab) {
	if (tab && tab.url && isYouTubeURL(tab.url)) {
		// Continue timer when user return to a yt tab
		try {
			const result = await getData(STORAGE_TIMER_KEY);
			if (!result) {
				throw new Error("Error getting timer data from local storage");
			}
			timerHandler.stopTimer();
			timerHandler.startTimer(result.minutes, result.seconds);
		} catch (err) {
			console.log("Update timer state error: ", err);
		}
	} else {
		// Stop timer when user leaves yt tab
		timerHandler.stopTimer();
	}
}

function isYouTubeURL(url) {
	return url && url.includes("youtube.com");
}

// Retrieve a global setting
async function getData(key) {
	return new Promise(async (resolve, reject) => {
		chrome.storage.local.get([key], async (result) => {
			if (chrome.runtime.lastError) {
				reject(chrome.runtime.lastError);
				return;
			} else {
				resolve(result[key]);
			}
		});
	});
}

//  IF data doesn't exist set it
// if (!result[STORAGE_TIMER_KEY]) {
// 	try {
// 		await setTimerData(defaultTimer);
// 		resolve(defaultTimer);
// 	} catch (err) {
// 		reject(err);
// 	}
// } else {
// }

async function setData(key, value) {
	return new Promise((resolve, reject) => {
		chrome.storage.local.set({ [key]: value }, () => {
			if (chrome.runtime.lastError) {
				console.error("Error setting data:", chrome.runtime.lastError);
				reject(chrome.runtime.lastError);
			} else {
				resolve();
			}
		});
	});
}

async function ensureDefaultData(key, defaultValue) {
	try {
		const existingData = await getData(key);

		if (existingData === undefined || existingData === null) {
			await setData(key, defaultValue);
		}
	} catch (error) {
		console.error("Error in ensureDefaultData:", error);
	}
}
