export class Timer {
	constructor(cb) {
		this.timer = null;
		this.cb = cb;
	}

	startTimer(minutes = 0, seconds = 0) {
		this.timer = setInterval(async () => {
			seconds++;
			if (seconds > 59) {
				minutes++;
				seconds = 0;
			}

			this.cb({ minutes: minutes, seconds: seconds });
		}, 1000);
	}

	stopTimer() {
		clearInterval(this.timer);
	}
}
