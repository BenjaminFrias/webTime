// GLOBAL TIMER
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
			// TODO: pass time to content.js
		}, 1000);
	}

	stopTimer() {
		clearInterval(this.timer);
	}

	clearTimer() {
		this.stopTimer();
		// this.updateTimerElement();
	}

	updateTimerElement(minutes = 0, seconds = 0) {
		let minutesText = minutes <= 9 ? `0${minutes}` : minutes;
		let secondsText = seconds <= 9 ? `0${seconds}` : seconds;
		this.timerElem.textContent = `${minutesText}:${secondsText}`;
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

chrome.tabs.onUpdated.addListener(function (tabId, changeInfo, tab) {
	if (changeInfo.status === "complete" && tab.url) {
		if (isYouTubeURL(tab.url)) {
			getTimer()
				.then((result) => {
					timerHandler.clearTimer();
					timerHandler.startTimer(result.minutes, result.seconds);
				})
				.catch((err) => {
					console.log(err);
				});
		} else {
			timerHandler.stopTimer();
			// TODO: stop timer
		}
	}
});

// Listen for messages from content script
chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
	if (request.action === "getTimer") {
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

// Retrieve a global setting
async function getTimer() {
	return new Promise((resolve, reject) => {
		chrome.storage.local.get(["timer"], (result) => {
			if (chrome.runtime.lastError) {
				reject(chrome.runtime.lastError);
				return;
			} else {
				resolve(result.timer);
			}
		});
	});
}
// TODO: add setTimer function for every second

// // IS YOUTUBE TAB ACTIVE?
// chrome.tabs.onActivated.addListener(function (activeInfo) {
// 	chrome.tabs.get(activeInfo.tabId, function (tab) {
// 		if (tab && tab.url && isYouTubeURL(tab.url)) {
// 			console.log("Active tab is now a YouTube tab:", tab);
// 		}
// 	});
// });
