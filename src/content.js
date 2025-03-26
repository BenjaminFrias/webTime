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

	resetTimer() {
		this.stopTimer();
		this.minutes = 0;
		this.seconds = 0;
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

	initExtension() {
		this.createTimerElem();
		this.startTimer();
	}
}

const timer = new Timer();
timer.initExtension();

// Detect if tab is visible or hidden
function handleVisibilityChange() {
	if (document.visibilityState === "visible") {
		// Tab is visible
		timer.startTimer();
		chrome.runtime.sendMessage({ action: "tabVisible" });
	} else {
		// Tab is hidden
		timer.stopTimer();
		chrome.runtime.sendMessage({ action: "tabHidden" });
	}
}

document.addEventListener("visibilitychange", handleVisibilityChange);

// Inject custom fonts in document
function injectGoogleFonts() {
	const link = document.createElement("link");
	link.rel = "stylesheet";
	link.href =
		"https://fonts.googleapis.com/css2?family=Rubik:wght@400;600&display=swap";
	document.head.appendChild(link);
}
injectGoogleFonts();
