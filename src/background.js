import {
	getData,
	setData,
	ensureDefaultData,
	addWebToTrack,
} from './utils/data.js';
import {
	DAILY_RESET_ALARM_NAME,
	POSITION_KEY,
	STORAGE_LAST_DAY_KEY,
	TRACKED_DATA_KEY,
	PENDING_REMOVALS_KEY,
} from './settings.js';
import { Timer } from './utils/timer.js';
import { isTrackedURL, getHostname, getCurrentTab } from './utils/tab.js';

const REMOVAL_COOL_DOWN_MS = 5 * 60 * 1000;
const currentTimer = new Timer();

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
	} else if (alarm.name.startsWith('confirm_removal')) {
		const alarmData = alarm.name.replace('confirm_removal_', '');
		const [removalType, targetTabId, url] = alarmData.split('_');

		// Remove pending url
		const pendingData = await getData(PENDING_REMOVALS_KEY);
		if (pendingData[url]) {
			delete pendingData[url];
			await setData(PENDING_REMOVALS_KEY, pendingData);
		}

		const hostname = getHostname(url);
		const website = hostname.split('://')[1].replace('/', '');

		chrome.notifications.create({
			type: 'basic',
			iconUrl: 'assets/icons/icon16.png',
			title: 'Confirm Website Removal',
			message: `Do you still want to remove ${removalType} for ${website}? Return to the tab and click confirm.`,
			isClickable: true,
		});

		chrome.tabs.sendMessage(Number(targetTabId), {
			type: 'confirmRemovalPopup',
			removalType: removalType,
		});
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
			updateTimerState(tab);
		} catch (error) {
			console.log(error);
		}
	}
});

// Start/Stop timer when a tracked tab is active
chrome.tabs.onActivated.addListener(async (activeInfo) => {
	try {
		const tab = await getCurrentTab(activeInfo.tabId);
		if (tab) {
			updateTimerState(tab);
		}
	} catch (error) {
		console.log(error);
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

// Add website message listener
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
	(async () => {
		if (request.action === 'addNewWebsite') {
			try {
				const currentTab = await getCurrentTab();
				const newUrl = currentTab.url;
				await addWebToTrack(getHostname(newUrl));

				updateTimerState(currentTab);
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
		} else if (request.action === 'stopTracking') {
			try {
				const currentTab = await getCurrentTab();
				const url = currentTab.url;
				const urlToRemoveLimit = getHostname(url);

				await removeProp(urlToRemoveLimit, 'timer');

				sendResponse({
					status: 'success',
					message: 'tracking stopped',
				});

				chrome.tabs.sendMessage(currentTab.id, {
					type: 'removeTimerElement',
				});
			} catch (error) {
				console.error(
					'Background: Failed to stop tracking website. ERROR: ',
					error
				);
				sendResponse({
					status: 'error',
					message: error.message,
				});
			}
		} else if (request.action === 'addTimeLimit') {
			try {
				const { hoursLimit, minsLimit } = request.timeLimit;

				if (
					hoursLimit &&
					minsLimit &&
					isNumeric(hoursLimit) &&
					isNumeric(minsLimit) &&
					Number(hoursLimit) > -1 &&
					Number(minsLimit) > -1
				) {
					if (Number(hoursLimit) == 0 && Number(minsLimit) < 1) {
						throw new Error(
							'Error: You must have at least 1 minute of time limit'
						);
					}

					const currentTab = await getCurrentTab();
					const url = currentTab.url;

					const timeLimit = {
						hours: Number(hoursLimit),
						minutes: Number(minsLimit),
					};

					setTimerLimit(getHostname(url), timeLimit);
					updateTimerState();

					sendResponse({
						status: 'success',
						message: 'Time limit added',
					});
				} else {
					sendResponse({
						status: 'error',
						message: 'Time limit format is not valid.',
					});
				}
			} catch (error) {
				console.error('Background: Failed to add time limit. ERROR: ', error);
				sendResponse({
					status: 'error',
					message: error.message,
				});
			}
		} else if (request.action === 'requestRemove') {
			try {
				const currentTab = await getCurrentTab();
				const url = currentTab.url;
				const urlToRemoveLimit = getHostname(url);

				const pendingRemovals = await getData(PENDING_REMOVALS_KEY);

				if (!pendingRemovals) {
					throw new Error('Error retrieving pending removals.');
				}

				if (pendingRemovals[urlToRemoveLimit]) {
					sendResponse({
						status: 'error',
						message: 'Removal already pending',
					});
				}

				const trackedData = await getData(TRACKED_DATA_KEY);

				if (!trackedData[urlToRemoveLimit]) {
					sendResponse({
						status: 'error',
						message: 'This website is not currently tracked.',
					});
				}

				if (
					!trackedData[urlToRemoveLimit]['limit'] &&
					request.removalType === 'limit'
				) {
					sendResponse({
						status: 'error',
						message: 'This website is not currently limited.',
					});
				}

				pendingRemovals[urlToRemoveLimit] = Date.now();

				await setData(PENDING_REMOVALS_KEY, pendingRemovals);

				const targetTabId = currentTab.id;
				if (request.removalType === 'timer') {
					chrome.alarms.create(
						`confirm_removal_timer_${targetTabId}_${urlToRemoveLimit}`,
						{
							delayInMinutes: REMOVAL_COOL_DOWN_MS / (1000 * 60),
						}
					);
				} else if (request.removalType === 'limit') {
					chrome.alarms.create(
						`confirm_removal_limit_${targetTabId}_${urlToRemoveLimit}`,
						{
							delayInMinutes: REMOVAL_COOL_DOWN_MS / (1000 * 60),
						}
					);
				}

				sendResponse({
					status: 'success',
					message: `Removal request initiated. You can confirm the removal in ${
						REMOVAL_COOL_DOWN_MS / (1000 * 60)
					} min.`,
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
		} else if (request.action === 'saveTimerPosition') {
			try {
				if (!request.position) return;
				await setData(POSITION_KEY, request.position);
			} catch (error) {
				console.log('error setting timer position: ', error);
			}
		} else if (request.action === 'getTimerPosition') {
			try {
				const positionData = await getData(POSITION_KEY);
				sendResponse({
					status: 'success',
					positionData: positionData,
				});
			} catch (error) {
				console.error(
					'Background: Failed to get timer position. ERROR: ',
					error
				);
				sendResponse({
					status: 'error',
					message: error.message,
				});
			}
		} else if (request.action === 'getCurrentTabInfo') {
			// GET DATA - URL, TIMER, LIMIT
			try {
				const trackedData = await getData(TRACKED_DATA_KEY);

				if (!trackedData) {
					throw new Error('There is not data available');
				}

				const currentTab = await getCurrentTab();
				const url = getHostname(currentTab.url);

				const data = {
					isTracked: null,
					isLimited: null,
				};

				if (!trackedData[url]) {
					sendResponse({
						status: 'success',
						data: data,
					});
					return;
				}

				if (trackedData[url]['timer']) {
					data.isTracked = trackedData[url]['timer'];
				}

				if (trackedData[url]['limit']) {
					data.isLimited = trackedData[url]['limit'];
				}

				sendResponse({
					status: 'success',
					data: data,
				});
			} catch (error) {
				console.error('Background: Failed to get data. ERROR: ', error);
				sendResponse({
					status: 'error',
					message: error.message,
				});
			}
		} else if (request.action === 'confirmedRemoval') {
			try {
				const currentTab = await getCurrentTab();
				const url = currentTab.url;
				const currentUrl = getHostname(url);

				await removeProp(currentUrl, request.removalType);

				sendResponse({
					status: 'success',
					removalType: request.removalType,
				});
			} catch (error) {
				console.error(
					'Background: Failed to remove limit or timer. ERROR: ',
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
	await ensureDefaultData(PENDING_REMOVALS_KEY, {});

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
		return;
	}

	if (await isTrackedURL(tab.url)) {
		// Create timer element in current tab
		chrome.tabs.sendMessage(tab.id, {
			type: 'createTimerElement',
		});

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

export async function setTimerLimit(trackedURL, timeLimit) {
	const trackedData = await getData(TRACKED_DATA_KEY);

	const newTrackedData = {
		...trackedData,
		[trackedURL]: {
			...trackedData[trackedURL],
			limit: timeLimit,
		},
	};
	await setData(TRACKED_DATA_KEY, newTrackedData);
}

export async function removeProp(trackedURL, propToDelete) {
	try {
		const trackedData = await getData(TRACKED_DATA_KEY);

		if (!(await isTrackedURL(trackedURL))) {
			throw new Error('Url does not exist');
		}

		const currentTrackedURLData = trackedData[trackedURL] || {};

		if (propToDelete === 'limit' && !currentTrackedURLData['limit']) {
			throw new Error('Limit property does not exist on the tracked URL data.');
		}

		if (propToDelete === 'timer' && !currentTrackedURLData['timer']) {
			throw new Error('Timer property does not exist on the tracked URL data.');
		}

		if (propToDelete === 'limit') {
			delete currentTrackedURLData[propToDelete];
			const newTrackedData = {
				...trackedData,
				[trackedURL]: currentTrackedURLData,
			};
			await setData(TRACKED_DATA_KEY, newTrackedData);
		} else if (propToDelete === 'timer') {
			delete trackedData[trackedURL];
			await setData(TRACKED_DATA_KEY, trackedData);

			const currentTab = await getCurrentTab();
			updateTimerState(currentTab);
		}
	} catch (error) {
		console.log('Error while removing limit: ', error);
	}
}

function isNumeric(str) {
	return !isNaN(parseFloat(str)) && isFinite(str);
}
