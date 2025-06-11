import { getData, setData } from './data.js';
import { TRACKED_DATA_KEY } from '../settings.js';

export async function getCurrentTab() {
	const queryOptions = { active: true, currentWindow: true };
	try {
		let [tab] = await chrome.tabs.query(queryOptions);

		if (tab) {
			return tab;
		}
		return null;
	} catch (error) {
		console.error('Error getting current tab:', error);
		return null;
	}
}

export async function isTrackedURL(url) {
	try {
		if (!url) return false;

		const websites = await getData(TRACKED_DATA_KEY);
		const hostname = getHostname(url);

		let isTracked = false;
		Object.keys(websites).forEach((web) => {
			if (web.includes(hostname)) {
				isTracked = true;
			}
		});

		return isTracked;
	} catch (error) {
		throw new Error(`Error fetching websites data: ${error}`);
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
