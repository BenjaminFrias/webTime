import { getData, setData, ensureDefaultData } from './utils/data.js';
import { STORAGE_LAST_DAY_KEY, TRACKED_DATA_KEY } from './settings.js';
import { Timer } from './utils/timer.js';
import { isTrackedURL, addWebToTrack } from './utils/tab.js';

let websiteTimers = {};
let currentTimer = new Timer('https://www.youtube.com/');

const defaultTimer = { hours: 0, minutes: 0, seconds: 0 };

async function initializeExtension() {
	await ensureDefaultData(TRACKED_DATA_KEY, websiteTimers);

	const today = new Date().toLocaleDateString();
	await ensureDefaultData(STORAGE_LAST_DAY_KEY, today);
}

// Initialize extension on install/startup
chrome.runtime.onInstalled.addListener(initializeExtension);
chrome.runtime.onStartup.addListener(initializeExtension);

// Start timer when new YouTube tab is open
chrome.tabs.onUpdated.addListener(async function (tabId, changeInfo, tab) {
	if (changeInfo.status === 'complete' && tab && tab.url) {
		try {
			// Create timer element in content.js
			if (await isTrackedURL(tab.url)) {
				chrome.tabs.sendMessage(tabId, {
					type: 'createTimerElement',
				});
			}

			updateTimerState(tab);
			resetTimerDaily();
		} catch (error) {
			console.log(error);
		}
	}
});

// Update timer on chrome window
// chrome.windows.onFocusChanged.addListener(async function (windowId) {
// 	if (windowId == chrome.windows.WINDOW_ID_NONE) {
// 		currentTimer.stopTimer();
// 	} else {
// 		try {
// 			const result = await getData(TRACKED_DATA_KEY);
// 			if (!result) {
// 				throw new Error('Error retrieving timer data');
// 			}

// 			const timer = result[CURRENT_TRACKED]['timer'];
// 			if (!timer) {
// 				throw new Error('Error getting timer data from tracked data');
// 			}

// 			currentTimer.stopTimer();
// 			currentTimer.startTimer(timer.hours, timer.minutes, timer.seconds);
// 		} catch (err) {
// 			console.log('Update timer state error: ', err);
// 		}
// 	}
// });

// Start/Stop timer when a YouTube tab is active
chrome.tabs.onActivated.addListener(async function (activeInfo) {
	chrome.tabs.get(activeInfo.tabId, async function (tab) {
		updateTimerState(tab);
		resetTimerDaily();
	});
});

// Get url time data
async function getTimerData(url) {
	try {
		const result = await getData(TRACKED_DATA_KEY);
		if (!result) {
			throw new Error('Error retrieving timer data');
		}

		const timer = result[url]['timer'];
		if (!timer) {
			throw new Error('Error getting timer data from tracked data');
		}

		return timer;
	} catch (error) {
		console.log(error);
	}
}

// Resetting timer daily
async function resetTimerDaily() {
	try {
		const today = new Date().toLocaleDateString();
		const prevDay = await getData(STORAGE_LAST_DAY_KEY);

		if (!prevDay) {
			throw new Error('Error getting timer data from local storage');
		}

		if (today != prevDay) {
			const trackedData = await getData(TRACKED_DATA_KEY);

			if (!trackedData) {
				throw new Error('Error while resetting timers: ', err);
			}

			Object.keys(trackedData).forEach((key) => {
				if (trackedData[key] === 'object') {
					trackedData[key].timer = defaultTimer;
				}
			});

			setData(TRACKED_DATA_KEY, trackedData);
			setData(STORAGE_LAST_DAY_KEY, today);
		}
	} catch (err) {
		console.log('resetTimerDaily error: ', err);
	}
}

// handles starting/stopping the timer based on whether the tab is a tracked tab.
async function updateTimerState(tab) {
	if (tab && tab.url && (await isTrackedURL(tab.url))) {
		// Continue timer when user return to a yt tab
		try {
			const result = await getData(TRACKED_DATA_KEY);
			const timer = result[tab.url]['timer'];

			if (!timer) {
				throw new Error('Error getting timer data from local storage');
			}

			currentTimer.stopTimer();
			const timerData = {
				hours: timer.hours,
				minutes: timer.minutes,
				seconds: timer.seconds,
			};
			currentTimer.startTimer(timerData);
		} catch (err) {
			console.log('Update timer state error: ', err);
		}
	} else {
		// Stop timer when user leaves yt tab
		currentTimer.stopTimer();
	}
}
