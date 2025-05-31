import { TimerUI } from './utils/timerUI.js';

const timerUI = new TimerUI();

// Get timer data from background.js
chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
	if (request.type === 'background') {
		const timerData = request.timer;
		timerUI.updateTimerElem(timerData);
	}

	if (request.type === 'createTimerElement') {
		if (!timerUI.timerElem) {
			timerUI.createTimerElem();
			injectGoogleFonts();
		}
	}
});

// Inject custom fonts in document
function injectGoogleFonts() {
	const link = document.createElement('link');
	link.rel = 'stylesheet';
	link.href =
		'https://fonts.googleapis.com/css2?family=Rubik:wght@400;600&display=swap';
	document.head.appendChild(link);
}
