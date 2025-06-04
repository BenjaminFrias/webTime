import { TRACKED_DATA_KEY } from '../settings.js';
import { getData, sendData, setData } from './data.js';

export class Timer {
	constructor(trackedURL) {
		this.timer = null;
		this.trackedURL = trackedURL;
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

			tick({
				trackedURL: this.trackedURL,
				hours: hours,
				minutes: minutes,
				seconds: seconds,
			});
		}, 1000);
	}

	stopTimer() {
		clearInterval(this.timer);
	}
}

export async function tick({ trackedURL, hours, minutes, seconds }) {
	const timerData = { hours: hours, minutes: minutes, seconds: seconds };

	sendData('timer', timerData);

	const trackedData = await getData(TRACKED_DATA_KEY);
	const newTrackedData = {
		...trackedData,
		[trackedURL]: { ...trackedData[trackedURL], ['timer']: timerData },
	};
	setData(TRACKED_DATA_KEY, newTrackedData);
}
