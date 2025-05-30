class TimerUI {
	constructor() {
		this.timerElem = null;
	}

	createTimerElem() {
		const timerContainer = document.createElement('div');
		timerContainer.classList.add('timer-container');

		const timer = document.createElement('p');
		timer.style.fontFamily = "'Rubik', serif";

		timerContainer.appendChild(timer);
		document.body.appendChild(timerContainer);

		this.timerElem = timer;
	}

	updateTimerElem({ hours, minutes, seconds }) {
		let formmatedMin = minutes <= 9 ? `0${minutes}` : minutes;
		let formmatedSec = seconds <= 9 ? `0${seconds}` : seconds;
		let formmatedHours = hours <= 9 ? `0${hours}` : hours;

		if (hours > 0) {
			this.timerElem.textContent = `${formmatedHours}:${formmatedMin}:${formmatedSec}`;
		} else {
			this.timerElem.textContent = `${formmatedMin}:${formmatedSec}`;
		}
	}
}

const timerUI = new TimerUI();

// Get timer data from background.js
chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
	if (request.type === 'background') {
		const timerData = request.timer;
		timerUI.updateTimerElem(timerData);
	}

	if (request.type === 'createTimerElement') {
		injectGoogleFonts();
		timerUI.createTimerElem();
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
