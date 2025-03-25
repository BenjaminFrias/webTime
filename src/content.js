function startTimer(timerElem) {
	let seconds = 0;
	let minutes = 0;

	setInterval(() => {
		seconds++;
		if (seconds > 59) {
			seconds = 0;
			minutes = seconds % 60;
		}

		// Update timer element
		timerElem.textContent = `${minutes <= 9 ? `0${minutes}` : minutes}:${
			seconds <= 9 ? `0${seconds}` : seconds
		}`;
	}, 1000);
}

function createTimerElem() {
	const timerContainer = document.createElement("div");
	timerContainer.classList.add("timer-container");

	const timer = document.createElement("p");
	timer.style.fontFamily = "'Rubik', sans-serif";

	timerContainer.appendChild(timer);
	document.body.appendChild(timerContainer);

	return timer;
}

function initializeTimer() {
	const timerElem = createTimerElem();
	startTimer(timerElem);
}

function injectGoogleFonts() {
	const link = document.createElement("link");
	link.rel = "stylesheet";
	link.href =
		"https://fonts.googleapis.com/css2?family=Rubik:wght@400;600&display=swap";
	document.head.appendChild(link);
}
injectGoogleFonts();

initializeTimer();
