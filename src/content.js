class Timer {
	constructor() {
		this.timer = null;
		this.timerElem = null;
	}

	startTimer(seconds = 0, minutes = 0) {
		this.timer = setInterval(() => {
			// TODO: store seconds in chrome storage
			seconds++;
			if (seconds > 59) {
				// TODO: store minutes in chrome storage
				minutes++;
				seconds = 0;
			}
			this.updateTimerElement(seconds, minutes);
		}, 1000);
	}

	stopTimer() {
		clearInterval(this.timer);
	}

	resetTimer() {
		this.stopTimer();
		this.updateTimerElement();
	}

	updateTimerElement(minutes = 0, seconds = 0) {
		let minutesText = minutes <= 9 ? `0${minutes}` : minutes;
		let secondsText = seconds <= 9 ? `0${seconds}` : seconds;
		this.timerElem.textContent = `${minutesText}:${secondsText}`;
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
}

const timer = new Timer();
timer.createTimerElem();
timer.startTimer();

// Inject custom fonts in document
function injectGoogleFonts() {
	const link = document.createElement("link");
	link.rel = "stylesheet";
	link.href =
		"https://fonts.googleapis.com/css2?family=Rubik:wght@400;600&display=swap";
	document.head.appendChild(link);
}
injectGoogleFonts();
