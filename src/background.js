const STORAGE_TIMER_KEY = "timer";
const STORAGE_LAST_DAY_KEY = "lastSavedDay";
const defaultTimer = { minutes: 0, seconds: 0 };
class Timer {
	constructor() {
		this.timer = null;
		this.timerElem = null;
	}

	startTimer(minutes = 0, seconds = 0) {
		this.timer = setInterval(() => {
			seconds++;
			if (seconds > 59) {
				minutes++;
				seconds = 0;
			}

			setTimerData({ minutes, seconds });
			sendTimerData();
		}, 1000);
	}

	stopTimer() {
		clearInterval(this.timer);
	}
}
const timerHandler = new Timer();

// Start timer when new YouTube tab is open
chrome.tabs.onUpdated.addListener(async function (tabId, changeInfo, tab) {
	if (changeInfo.status === "complete" && tab && tab.url) {
		// Create timer element in content.js
		if (isYouTubeURL(tab.url)) {
			chrome.tabs.sendMessage(tabId, {
				type: "createTimerElement",
			});
			sendTimerData();
		}

		setDefaultTimerDaily();
		updateTimerState(tab);
	}
});

// Start/Stop timer when a YouTube tab is active
chrome.tabs.onActivated.addListener(async function (activeInfo) {
	chrome.tabs.get(activeInfo.tabId, async function (tab) {
		if (tab && tab.url) {
			setDefaultTimerDaily();
			updateTimerState(tab);

			if (isYouTubeURL(tab.url)) {
				sendTimerData();
			}
		}
	});
});

async function getCurrentTab() {
	let queryOptions = { active: true, lastFocusedWindow: true };
	try {
		let [tab] = await chrome.tabs.query(queryOptions);
		return tab;
	} catch (err) {
		console.log(err);
	}
}

async function sendTimerData() {
	let tab = await getCurrentTab();

	if (tab && tab.url && isYouTubeURL(tab.url)) {
		let activeTabId = tab.id;

		try {
			const result = await getTimerData();
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
				setTimerData(defaultTimer);
				chrome.storage.local.set({ [STORAGE_LAST_DAY_KEY]: today });
			}
		}
	});
}
setDefaultTimerDaily();

// handles starting/stopping the timer based on whether the tab is a YouTube tab.
async function updateTimerState(tab) {
	if (tab && tab.url && isYouTubeURL(tab.url)) {
		// Continue timer when user return to a yt tab
		getTimerData()
			.then((result) => {
				timerHandler.stopTimer();
				timerHandler.startTimer(result.minutes, result.seconds);
			})
			.catch((err) => {
				console.log(err);
			});
	} else {
		// Stop timer when user leaves yt tab
		timerHandler.stopTimer();
	}
}

function isYouTubeURL(url) {
	return url && url.includes("youtube.com");
}

// Retrieve a global setting
async function getTimerData() {
	return new Promise(async (resolve, reject) => {
		chrome.storage.local.get([STORAGE_TIMER_KEY], (result) => {
			if (chrome.runtime.lastError) {
				reject(chrome.runtime.lastError);
				return;
			} else {
				if (!result[STORAGE_TIMER_KEY]) {
					setTimerData(defaultTimer)
						.then(() => {
							resolve(defaultTimer);
						})
						.catch((err) => {
							reject(err);
						});
				} else {
					resolve(result[STORAGE_TIMER_KEY]);
				}
			}
		});
	});
}

async function setTimerData(timer) {
	return new Promise((resolve, reject) => {
		chrome.storage.local.set({ [STORAGE_TIMER_KEY]: timer }, () => {
			if (chrome.runtime.lastError) {
				console.error("Error setting timer:", chrome.runtime.lastError);
				reject(chrome.runtime.lastError);
			} else {
				resolve();
			}
		});
	});
}
