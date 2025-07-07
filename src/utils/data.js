import { getCurrentTab } from './tab.js';
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
				reject(chrome.runtime.lastError);
			} else {
				resolve();
			}
		});
	});
}

export async function sendData(action, propName, data) {
	const tab = await getCurrentTab();
	if (!tab) {
		console.warn('Could not get current tab. Message not sent.');
		return;
	}
	const tabTarget = tab['id'];

	chrome.tabs.sendMessage(tabTarget, {
		type: action,
		[propName]: data,
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

export async function addWebToTrack(newUrl) {
	try {
		const trackedData = await getData(TRACKED_DATA_KEY);
		if (trackedData[newUrl]) {
			throw new Error('Website is already being tracked.');
		}

		const newTrackedData = {
			...trackedData,
			[newUrl]: {
				...trackedData[newUrl],
				['timer']: { hours: 0, minutes: 0, seconds: 0 },
			},
		};

		await setData(TRACKED_DATA_KEY, newTrackedData);
	} catch (error) {
		throw new Error(error);
	}
}
