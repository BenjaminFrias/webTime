const { TimerUI } = require('./utils/timerUI.js');

const timerUI = new TimerUI();

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
	if (request.type === 'createTimerElement') {
		if (!timerUI.timerElem) {
			timerUI.createTimerElem();
		}
	}

	if (request.type === 'timerData') {
		const timerData = request.timer;
		if (timerUI.timerElem) {
			timerUI.updateTimerElem(timerData);
		}
	}

	if (request.type === 'timeout') {
		if (!timerUI.blockElem) {
			timerUI.createBlockElem();
		}
	}
});
