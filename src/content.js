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

	timerContainer.appendChild(timer);
	document.body.appendChild(timerContainer);

	return timer;
}

function initializeTimer() {
	const timerElem = createTimerElem();
	startTimer(timerElem);
}

initializeTimer();
