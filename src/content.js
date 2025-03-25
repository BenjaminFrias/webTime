class Timer {
	constructor() {
		this.seconds = 0;
		this.minutes = 0;
		this.timerElem = null;
	}

	startTimer(timerElem) {
		setInterval(() => {
			this.seconds++;
			if (this.seconds > 59) {
				this.minutes++;
				this.seconds = 0;
			}

			// Update timer element
			let minutesText = this.minutes <= 9 ? `0${this.minutes}` : this.minutes;
			let secondsText = this.seconds <= 9 ? `0${this.seconds}` : this.seconds;

			timerElem.textContent = `${minutesText}:${secondsText}`;
		}, 1000);
	}

	createTimerElem() {
		const timerContainer = document.createElement("div");
		timerContainer.classList.add("timer-container");

		const timer = document.createElement("p");
		timer.style.fontFamily = "'Rubik', sans-serif";

		timerContainer.appendChild(timer);
		document.body.appendChild(timerContainer);

		return timer;
	}

	initializeTimer() {
		const timerElem = this.createTimerElem();
		this.startTimer(timerElem);
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
