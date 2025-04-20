const STORAGE_KEY = "timer";
const defaultTimer = { minutes: 0, seconds: 0 };

class Timer {
	constructor() {
		this.timer = null;
		this.timerElem = null;
	}

	async startTimer(minutes = 0, seconds = 0) {
		this.timer = setInterval(() => {
			seconds++;
			if (seconds > 59) {
				minutes++;
				seconds = 0;
			}
			// TODO: pass time to content.js
			let minutesText = minutes <= 9 ? `0${minutes}` : minutes;
			let secondsText = seconds <= 9 ? `0${seconds}` : seconds;
			console.log(`${minutesText}:${secondsText}`);

			storeTimerObj({ minutes, seconds });
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

// TODO: restart timer local storage on new day

// TODO: add feat for max 3 yt tabs and prevent doomtabing
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

// TODO: check if timer exist, if not set default timer value in chrome local storage
// Start timer when new YouTube tab is open
chrome.tabs.onUpdated.addListener(async function (tabId, changeInfo, tab) {
	if (changeInfo.status === "complete" && tab.url) {
		if (isYouTubeURL(tab.url)) {
			await getTimer()
				.then((result) => {
					// timerHandler.stopTimer();
					// timerHandler.startTimer(result.minutes, result.seconds);
				})
				.catch((err) => {
					console.log(err);
				});
		}
	}
});

// Start/Stop timer when a YouTube tab is active
chrome.tabs.onActivated.addListener(async function (activeInfo) {
	chrome.tabs.get(activeInfo.tabId, async function (tab) {
		if (tab && tab.url && isYouTubeURL(tab.url)) {
			// Continue timer when user return to a yt tab
			await getTimer()
				.then((result) => {
					// timerHandler.stopTimer();
					// timerHandler.startTimer(result.minutes, result.seconds);
				})
				.catch((err) => {
					console.log(err);
				});
		} else {
			// Stop timer when user leaves yt tab
			timerHandler.stopTimer();
		}
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

function isYouTubeURL(url) {
	return url && url.includes("youtube.com");
}

// Retrieve a global setting
async function getTimer() {
	return new Promise(async (resolve, reject) => {
		chrome.storage.local.get([STORAGE_KEY], (result) => {
			if (chrome.runtime.lastError) {
				reject(chrome.runtime.lastError);
				return;
			} else {
				if (!result[STORAGE_KEY]) {
					storeTimerObj(defaultTimer)
						.then(() => {
							resolve(defaultTimer);
						})
						.catch((err) => {
							reject(err);
						});
				} else {
					console.log("Timer found: ", result[STORAGE_KEY]);
					resolve(result[STORAGE_KEY]);
				}
			}
		});
	});
}

async function storeTimerObj(timer) {
	return new Promise((resolve, reject) => {
		chrome.storage.local.set({ [STORAGE_KEY]: timer }, () => {
			if (chrome.runtime.lastError) {
				console.error(
					"Error setting timer using chrome.storage.local.set:",
					chrome.runtime.lastError
				);
				reject(chrome.runtime.lastError);
			} else {
				console.log("Timer stored successfully:", timer);
				resolve();
			}
		});
	});
}
