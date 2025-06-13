const { TimerUI } = require('./utils/timerUI.js');

const timerUI = new TimerUI();

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
	if (request.type === 'background') {
		const timerData = request.timer;
		timerUI.updateTimerElem(timerData);
	}

	if (request.type === 'createTimerElement') {
		if (!timerUI.timerElem) {
			timerUI.createTimerElem();
		}
	}
});
