import { TRACKED_DATA_KEY } from '../settings.js';
import { getData, sendData, setData } from './data.js';

export class Timer {
	constructor() {
		this.timer = null;
	}

	startTimer({ hours, minutes, seconds }, trackedURL) {
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

			this._tick({
				trackedURL: trackedURL,
				hours: hours,
				minutes: minutes,
				seconds: seconds,
			});
		}, 1000);
	}

	stopTimer() {
		clearInterval(this.timer);
	}

	async _tick({ trackedURL, hours, minutes, seconds }) {
		const timerData = { hours: hours, minutes: minutes, seconds: seconds };

		await sendData('timer', timerData);

		const trackedData = await getData(TRACKED_DATA_KEY);
		const safeTrackedData = trackedData || {};

		const newTrackedData = {
			...safeTrackedData,
			[trackedURL]: {
				...(safeTrackedData[trackedURL] || {}),
				timer: timerData,
			},
		};
		await setData(TRACKED_DATA_KEY, newTrackedData);
	}
}
