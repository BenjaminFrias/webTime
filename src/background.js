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
			let minutesText = minutes <= 9 ? `0${minutes}` : minutes;
			let secondsText = seconds <= 9 ? `0${seconds}` : seconds;
			console.log(`${minutesText}:${secondsText}`);

			setTimerData({ minutes, seconds });
		}, 1000);
	}

	stopTimer() {
		clearInterval(this.timer);
	}

	createTimerElem() {
		const timerContainer = document.createElement("div");
		timerContainer.classList.add("timer-container");

		const timer = document.createElement("p");
		timer.style.fontFamily = "'Rubik', sans-serif";

		timerContainer.appendChild(timer);
		document.body.appendChild(timerContainer);

		this.timerElem = timer;
	}
}
const timerHandler = new Timer();

// Start timer when new YouTube tab is open
chrome.tabs.onUpdated.addListener(async function (tabId, changeInfo, tab) {
	if (changeInfo.status === "complete") {
		setDefaultTimerDaily();
		updateTimerState(tab);
	}
});

// Start/Stop timer when a YouTube tab is active
chrome.tabs.onActivated.addListener(async function (activeInfo) {
	chrome.tabs.get(activeInfo.tabId, async function (tab) {
		setDefaultTimerDaily();
		updateTimerState(tab);
	});
});

// Listen for messages from content script and send it timer data
chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
	if (request.action === "getTimerData") {
		getTimer()
			.then((result) => {
				sendResponse({ timer: result || { minutes: 0, seconds: 0 } });
			})
			.catch((err) => {
				console.log(err);
			});
	}

	return true;
});

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

// Get youtube tabs count
function getYtTabsCount() {
	let youtubeTabCount = 0;
	chrome.tabs.query({}, function (tabs) {
		for (const tab of tabs) {
			if (isYouTubeURL(tab.url)) {
				youtubeTabCount++;
			}
		}
	});
	return youtubeTabCount;
}

// handles starting/stopping the timer based on whether the tab is a YouTube tab.
async function updateTimerState(tab) {
	if (tab && tab.url && isYouTubeURL(tab.url)) {
		// Continue timer when user return to a yt tab
		getTimer()
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
async function getTimer() {
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
