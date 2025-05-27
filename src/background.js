import {
	getData,
	setData,
	sendData,
	ensureDefaultData,
} from './utils/dataUtils.js';

const STORAGE_TIMER_KEY = 'timer';
const STORAGE_LAST_DAY_KEY = 'lastSavedDay';
const defaultTimer = { minutes: 0, seconds: 0 };
class Timer {
	constructor() {
		this.timer = null;
	}

	startTimer(minutes = 0, seconds = 0) {
		this.timer = setInterval(async () => {
			seconds++;
			if (seconds > 59) {
				minutes++;
				seconds = 0;
			}

			setData(STORAGE_TIMER_KEY, { minutes, seconds });
			sendData(STORAGE_TIMER_KEY, 'timer');
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
	if (changeInfo.status === 'complete' && tab && tab.url) {
		// Create timer element in content.js
		if (isYouTubeURL(tab.url)) {
			chrome.tabs.sendMessage(tabId, {
				type: 'createTimerElement',
			});
		}

		resetTimerDaily();
		updateTimerState(tab);
	}
});

// Update timer on chrome window
// TODO: Timer does not stop when changing window
chrome.windows.onFocusChanged.addListener(async function (windowId) {
	if (windowId == chrome.windows.WINDOW_ID_NONE) {
		timerHandler.stopTimer();
	} else {
		try {
			const result = await getData(STORAGE_TIMER_KEY);
			if (!result) {
				throw new Error('Error getting timer data from local storage');
			}
			timerHandler.stopTimer();
			timerHandler.startTimer(result.minutes, result.seconds);
		} catch (err) {
			console.log('Update timer state error: ', err);
		}
	}
});

// Start/Stop timer when a YouTube tab is active
chrome.tabs.onActivated.addListener(async function (activeInfo) {
	chrome.tabs.get(activeInfo.tabId, async function (tab) {
		if (tab && tab.url) {
			resetTimerDaily();
			updateTimerState(tab);
		}
	});
});

// Resetting timer daily
async function resetTimerDaily() {
	try {
		const today = new Date().toLocaleDateString();
		const prevDay = await getData(STORAGE_LAST_DAY_KEY);

		if (!prevDay) {
			throw new Error('Error getting timer data from local storage');
		}

		if (today != prevDay) {
			setData(STORAGE_TIMER_KEY, defaultTimer);
			setData(STORAGE_LAST_DAY_KEY, today);
		}
	} catch (err) {
		console.log('resetTimerDaily error: ', err);
	}
}

// handles starting/stopping the timer based on whether the tab is a YouTube tab.
async function updateTimerState(tab) {
	if (tab && tab.url && isYouTubeURL(tab.url)) {
		// Continue timer when user return to a yt tab
		try {
			const result = await getData(STORAGE_TIMER_KEY);
			if (!result) {
				throw new Error('Error getting timer data from local storage');
			}
			timerHandler.stopTimer();
			timerHandler.startTimer(result.minutes, result.seconds);
		} catch (err) {
			console.log('Update timer state error: ', err);
		}
	} else {
		// Stop timer when user leaves yt tab
		timerHandler.stopTimer();
	}
}

function isYouTubeURL(url) {
	return url && url.includes('youtube.com');
}
