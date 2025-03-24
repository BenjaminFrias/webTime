function timer() {
	let seconds = 0;
	let minutes = 0;

	// Create timer elements
	const timerContainer = document.createElement("div");
	timerContainer.classList.add("timer-container");
	const timer = document.createElement("p");
	timerContainer.appendChild(timer);
	document.body.appendChild(timerContainer);

	setInterval(() => {
		seconds++;
		if (seconds > 59) {
			seconds = 0;
			minutes = seconds % 60;
		}

		// Update timer element
		timer.textContent = `${minutes <= 9 ? `0${minutes}` : minutes}:${
			seconds <= 9 ? `0${seconds}` : seconds
		}`;
	}, 1000);
}

timer();
