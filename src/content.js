const { TimerUI } = require('./utils/timerUI.js');

const timerUI = new TimerUI();

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
	if (request.type === 'createTimerElement') {
		if (!timerUI.timerContainer) {
			timerUI.createTimerElem();
		}
	}

	if (request.type === 'removeTimerElement') {
		if (timerUI.timerContainer) {
			timerUI.removeTimerElem();
		}
	}

	if (request.type === 'timerData') {
		const timerData = request.timer;
		if (timerUI.timerContainer) {
			timerUI.updateTimerElem(timerData);
		}
	}

	if (request.type === 'timeout') {
		if (!timerUI.blockElem) {
			timerUI.createBlockElem();
		}
	}
});
