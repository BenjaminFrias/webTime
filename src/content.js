class Timer {
	constructor() {
		this.seconds = 0;
		this.minutes = 0;
		this.timer = null;
		this.timerElem = null;
	}

	startTimer() {
		this.timer = setInterval(() => {
			this.seconds++;
			if (this.seconds > 59) {
				this.minutes++;
				this.seconds = 0;
			}

			this.updateTimerElement(this.minutes, this.seconds);
		}, 1000);
	}

	stopTimer() {
		clearInterval(this.timer);
	}

	updateTimerElement(minutes = 0, seconds = 0) {
		let minutesText = minutes <= 9 ? `0${minutes}` : minutes;
		let secondsText = seconds <= 9 ? `0${seconds}` : seconds;
		this.timerElem.textContent = `${minutesText}:${secondsText}`;
	}

	resetTimer() {
		this.stopTimer();
		this.minutes = 0;
		this.seconds = 0;
		this.updateTimerElement();
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

	initializeTimer() {
		this.createTimerElem();
		this.startTimer();
	}
}

const timer = new Timer();
timer.initializeTimer();

// Inject custom fonts in document
function injectGoogleFonts() {
	const link = document.createElement("link");
	link.rel = "stylesheet";
	link.href =
		"https://fonts.googleapis.com/css2?family=Rubik:wght@400;600&display=swap";
	document.head.appendChild(link);
}
injectGoogleFonts();
