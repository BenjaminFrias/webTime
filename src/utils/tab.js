export async function getCurrentTab() {
	const queryOptions = { active: true, currentWindow: true };
	try {
		let [tab] = await chrome.tabs.query(queryOptions);
		return tab;
	} catch (err) {
		console.log(err);
	}
}

export function isYouTubeURL(url) {
	return url && url.includes('youtube.com');
}
