export class Timer {
	constructor(cb) {
		this.timer = null;
		this.cb = cb;
	}

	startTimer(hours = 0, minutes = 0, seconds = 0) {
		this.timer = setInterval(async () => {
			seconds++;
			if (seconds > 59) {
				minutes++;
				seconds = 0;
			}

			if (minutes > 59) {
				hours++;
				minutes = 0;
			}

			this.cb({ hours: hours, minutes: minutes, seconds: seconds });
		}, 1000);
	}

	stopTimer() {
		clearInterval(this.timer);
	}
}
