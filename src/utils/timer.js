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
		// Send data to timer
		const timerData = { hours: hours, minutes: minutes, seconds: seconds };

		await sendData('timerData', 'timer', timerData);

		const trackedData = await getData(TRACKED_DATA_KEY);

		// Check for timer limit and send alert to content
		const hoursLimit = trackedData[trackedURL]?.limit?.hours;
		const minutesLimit = trackedData[trackedURL]?.limit?.minutes;

		// Check if hours and minutes exist
		if (
			(hoursLimit === 0 || hoursLimit) &&
			(minutesLimit === 0 || minutesLimit)
		) {
			// Check if current time is equal to limit
			if (hours >= hoursLimit && minutes >= minutesLimit) {
				sendData('timeout', 'limit', {
					hoursLimit: hoursLimit,
					minutesLimit: minutesLimit,
				});
				this.stopTimer();
				return;
			}
		}

		// Set new timer data
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
