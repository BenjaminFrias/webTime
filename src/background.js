import { getData, setData, ensureDefaultData } from './utils/data.js';
import { STORAGE_LAST_DAY_KEY, TRACKED_DATA_KEY } from './settings.js';
import { Timer } from './utils/timer.js';
import {
	isTrackedURL,
	addWebToTrack,
	getHostname,
	getCurrentTab,
} from './utils/tab.js';

let currentTimer = new Timer();

const defaultTimer = { hours: 0, minutes: 0, seconds: 0 };

// Initialize extension on install/startup
chrome.runtime.onInstalled.addListener(initializeExtension);
chrome.runtime.onStartup.addListener(initializeExtension);

// Start timer when new tracked tab is open
chrome.tabs.onUpdated.addListener(async function (tabId, changeInfo, tab) {
	if (changeInfo.status === 'complete' && tab && tab.url) {
		try {
			// Create timer element in content.js
			if (await isTrackedURL(getHostname(tab.url))) {
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
chrome.windows.onFocusChanged.addListener(async function (windowId) {
	if (!currentTimer) {
		return;
	}

	if (windowId == chrome.windows.WINDOW_ID_NONE) {
		// OUTSIDE CHROME
		currentTimer.stopTimer();
	} else {
		// IN A CHROME WINDOW
		const tab = await getCurrentTab();
		updateTimerState(tab);
	}
});

// Start/Stop timer when a tracked tab is active
chrome.tabs.onActivated.addListener(async function (activeInfo) {
	chrome.tabs.get(activeInfo.tabId, async function (tab) {
		if (tab && tab.url) {
			updateTimerState(tab);
			resetTimerDaily();
		}
	});
});

// Add website message listener
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
	(async () => {
		if (request.action === 'addNewWebsite') {
			const currentTab = await getCurrentTab();
			const newUrl = currentTab.url;

			try {
				await addWebToTrack(getHostname(newUrl));
				sendResponse({
					status: 'success',
					message: 'Website added',
				});
			} catch (error) {
				console.error(
					'Background: Failed to add new website to track. ERROR: ',
					error
				);
				sendResponse({
					status: 'error',
					message: error,
				});
			}
		}
	})();
	return true;
});

// Ensure default data for local storage
async function initializeExtension() {
	await ensureDefaultData(TRACKED_DATA_KEY, {});

	const today = new Date().toLocaleDateString();
	await ensureDefaultData(STORAGE_LAST_DAY_KEY, today);
}

// Resetting timer daily
// TODO: Reset all timers every day
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
	if (!tab || !tab.url) {
		throw new Error('Tab is undefined');
	}

	const trackedWeb = getHostname(tab.url);
	if (await isTrackedURL(trackedWeb)) {
		// Continue timer when user return to a yt tab
		try {
			const result = await getData(TRACKED_DATA_KEY);
			const timer = result[trackedWeb]['timer'];

			if (!timer) {
				throw new Error('Error getting timer data from local storage');
			}

			currentTimer.stopTimer();
			const timerData = {
				hours: timer.hours,
				minutes: timer.minutes,
				seconds: timer.seconds,
			};

			currentTimer.startTimer(timerData, trackedWeb);
		} catch (err) {
			console.log('Update timer state error: ', err);
		}
	} else {
		// Stop timer when user leaves tracked tab
		currentTimer.stopTimer();
	}
}
