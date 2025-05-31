import { getCurrentTab, isYouTubeURL } from './tab.js';
import { STORAGE_TIMER_KEY, TRACKED_DATA } from '../settings.js';

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

export async function sendData(key, dataType) {
	try {
		const result = await getData(key);
		if (!result) {
			throw new Error('Error at getting data: ', result);
		}

		const tab = await getCurrentTab();
		const tabTarget = tab.id;

		if (isYouTubeURL(tab.url)) {
			chrome.tabs.sendMessage(tabTarget, {
				type: 'background',
				[dataType]: result,
			});
		}
	} catch (err) {
		console.log(err);
	}
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

	sendData(STORAGE_TIMER_KEY, 'timer');
	setData(STORAGE_TIMER_KEY, timerData);

	const trackedData = await getData(TRACKED_DATA);
	const newTrackedData = {
		...trackedData,
		[trackedURL]: { ...trackedData[trackedURL], ['timer']: timerData },
	};
	setData(TRACKED_DATA, newTrackedData);
}
