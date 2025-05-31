import { getCurrentTab, isYouTubeURL } from './tab.js';
import { TRACKED_DATA_KEY } from '../settings.js';

export async function getData(key) {
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

export async function setData(key, data) {
	return new Promise((resolve, reject) => {
		chrome.storage.local.set({ [key]: data }, () => {
			if (chrome.runtime.lastError) {
				console.error('Error setting data:', chrome.runtime.lastError);
				reject(chrome.runtime.lastError);
			} else {
				resolve();
			}
		});
	});
}

export async function sendData(dataType, data) {
	// TODO: Move getting current tab logic to tick handler
	const tab = await getCurrentTab();
	const tabTarget = tab.id;

	chrome.tabs.sendMessage(tabTarget, {
		type: 'background',
		[dataType]: data,
	});
}

export async function ensureDefaultData(key, defaultValue) {
	try {
		const existingData = await getData(key);

		if (existingData === undefined || existingData === null) {
			await setData(key, defaultValue);
		}
	} catch (error) {
		console.error('Error in ensureDefaultData:', error);
	}
}

export async function tickHandler({ trackedURL, hours, minutes, seconds }) {
	const timerData = { hours, minutes, seconds };

	sendData('timer', timerData);

	const trackedData = await getData(TRACKED_DATA_KEY);
	const newTrackedData = {
		...trackedData,
		[trackedURL]: { ...trackedData[trackedURL], ['timer']: timerData },
	};
	setData(TRACKED_DATA_KEY, newTrackedData);
}
