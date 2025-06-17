import {
	getData,
	setData,
	ensureDefaultData,
	addWebToTrack,
} from './utils/data.js';
import {
	DAILY_RESET_ALARM_NAME,
	STORAGE_LAST_DAY_KEY,
	TRACKED_DATA_KEY,
} from './settings.js';
import { Timer } from './utils/timer.js';
import { isTrackedURL, getHostname, getCurrentTab } from './utils/tab.js';

let currentTimer = new Timer();

const defaultTimer = { hours: 0, minutes: 0, seconds: 0 };

// Create alarm to reset timer every day
async function setUpDailyResetAlarm() {
	const alarm = await chrome.alarms.get(DAILY_RESET_ALARM_NAME);

	if (!alarm) {
		const now = new Date();
		const midnight = new Date(
			now.getFullYear(),
			now.getMonth(),
			now.getDate() + 1,
			0,
			0,
			0
		);

		const delayInMinutes = Math.round(
			(midnight.getTime() - now.getTime()) / 60000
		);

		chrome.alarms.create(DAILY_RESET_ALARM_NAME, {
			delayInMinutes: delayInMinutes,
			periodInMinutes: 1440,
		});
	}
}

// Listen for the daily reset alarm
chrome.alarms.onAlarm.addListener(async (alarm) => {
	if (alarm.name === DAILY_RESET_ALARM_NAME) {
		resetTimerDaily();
	}
});

// Initialize extension on install/startup
chrome.runtime.onInstalled.addListener(() => {
	initializeExtension();
	setUpDailyResetAlarm();
});

chrome.runtime.onStartup.addListener(() => {
	initializeExtension();
	setUpDailyResetAlarm();
});

// Start timer when new tracked tab is open
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
chrome.tabs.onActivated.addListener(async (activeInfo) => {
	try {
		// Use the utility function you are already mocking in tests
		const tab = await getCurrentTab(activeInfo.tabId);
		if (tab && tab.url) {
			updateTimerState(tab);
		}
	} catch (error) {
		console.log(error);
	}
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
					message: error.message,
				});
			}
		}
	})();
	return true;
});

// Ensure default data for local storage
export async function initializeExtension() {
	await ensureDefaultData(TRACKED_DATA_KEY, {});

	const today = new Date().toLocaleDateString();
	await ensureDefaultData(STORAGE_LAST_DAY_KEY, today);
}

// Resetting timer daily
export async function resetTimerDaily() {
	try {
		const today = new Date().toLocaleDateString();
		const prevDay = await getData(STORAGE_LAST_DAY_KEY);

		if (!prevDay) {
			throw new Error('Error getting timer data from local storage');
		}

		if (today != prevDay) {
			const trackedData = await getData(TRACKED_DATA_KEY);

			if (!trackedData) {
				throw new Error('Error while resetting timers');
			}

			Object.keys(trackedData).forEach((key) => {
				if (typeof trackedData[key] === 'object') {
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
export async function updateTimerState(tab) {
	if (!tab || !tab.url) {
		throw new Error('Tab is undefined');
	}

	if (await isTrackedURL(tab.url)) {
		// Continue timer when user return to a yt tab
		try {
			const trackedWeb = getHostname(tab.url);
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
