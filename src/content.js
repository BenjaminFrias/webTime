class TimerUI {
	constructor() {
		this.timerElem = null;
	}

	createTimerElem() {
		const timerContainer = document.createElement("div");
		timerContainer.classList.add("timer-container");

		const timer = document.createElement("p");
		timer.style.fontFamily = "'Rubik', sans-serif";

		timerContainer.appendChild(timer);
		document.body.appendChild(timerContainer);

		this.timerElem = timer;
	}

	updateTimerElem({ minutes, seconds }) {
		let minutesText = minutes <= 9 ? `0${minutes}` : minutes;
		let secondsText = seconds <= 9 ? `0${seconds}` : seconds;
		this.timerElem.textContent = `${minutesText}:${secondsText}`;
	}
}

const timerUI = new TimerUI();

// Get timer data from background.js
chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
	if (request.type === "background") {
		const timerData = request.timer;
		timerUI.updateTimerElem(timerData);
	}

	if (request.type === "createTimerElement") {
		timerUI.createTimerElem();
	}
});

// Inject custom fonts in document
function injectGoogleFonts() {
	const link = document.createElement("link");
	link.rel = "stylesheet";
	link.href =
		"https://fonts.googleapis.com/css2?family=Rubik:wght@400;600&display=swap";
	document.head.appendChild(link);
}
injectGoogleFonts();
