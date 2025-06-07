import { getData, setData } from './data.js';
import { TRACKED_DATA_KEY } from '../settings.js';

export async function getCurrentTab() {
	const queryOptions = { active: true, currentWindow: true };
	try {
		let [tab] = await chrome.tabs.query(queryOptions);
		return tab;
	} catch (err) {
		console.log(err);
	}
}

export async function isTrackedURL(url) {
	try {
		if (!url) return false;

		const websites = await getData(TRACKED_DATA_KEY);

		let isTracked = false;
		Object.keys(websites).forEach((web) => {
			if (web.includes(url)) {
				isTracked = true;
			}
		});

		return isTracked;
	} catch (error) {
		throw new Error('Error fetching websites data: ', error);
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
		throw new Error('Failed at adding new website: ', error);
	}
}

export function getHostname(fullUrl) {
	try {
		const url = new URL(fullUrl);
		return url.origin + '/';
	} catch (error) {
		throw new Error('Invalid url provided.');
	}
}
