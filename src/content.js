class Timer {
	constructor() {
		this.timer = null;
		this.timerElem = null;
	}

	startTimer(seconds = 0, minutes = 0) {
		this.timer = setInterval(() => {
			seconds++;
			if (seconds > 59) {
				minutes++;
				seconds = 0;
			}
			this.updateTimerElement(minutes, seconds);
			sendDataToBackground({ minutes: minutes, seconds: seconds });
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

function requestDataFromBackground() {
	chrome.runtime.sendMessage({ action: "getData" }, function (response) {
		console.log(response);

		if (response && response.timer) {
			// Use the data received from the background script
			timer.resetTimer();

			const [minutes, seconds] = [
				response.timer.minutes,
				response.timer.seconds,
			];

			timer.startTimer(minutes, seconds);
		} else {
			console.log("There is not data");

			timer.startTimer();
		}
	});
}
requestDataFromBackground();

function sendDataToBackground(data) {
	chrome.runtime.sendMessage(
		{ action: "setData", data: data },
		function (response) {
			if (response && response.success) {
				console.log("Data saved successfully in background script.", data);
			} else {
				console.error("Error saving data in background script.");
			}
		}
	);
}

// Inject custom fonts in document
function injectGoogleFonts() {
	const link = document.createElement("link");
	link.rel = "stylesheet";
	link.href =
		"https://fonts.googleapis.com/css2?family=Rubik:wght@400;600&display=swap";
	document.head.appendChild(link);
}
injectGoogleFonts();
