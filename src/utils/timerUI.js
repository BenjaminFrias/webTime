export class TimerUI {
	constructor() {
		this.timerElem = null;
		this.blockElem = null;
	}

	createTimerElem() {
		const timerContainer = document.createElement('div');
		timerContainer.classList.add('timer-container');

		const timer = document.createElement('p');

		timerContainer.appendChild(timer);
		document.body.appendChild(timerContainer);

		this.timerElem = timer;
	}

	updateTimerElem({ hours, minutes, seconds }) {
		let formmatedMin = minutes <= 9 ? `0${minutes}` : minutes;
		let formmatedSec = seconds <= 9 ? `0${seconds}` : seconds;
		let formmatedHours = hours <= 9 ? `0${hours}` : hours;

		if (hours > 0) {
			this.timerElem.textContent = `${formmatedHours}:${formmatedMin}:${formmatedSec}`;
		} else {
			this.timerElem.textContent = `${formmatedMin}:${formmatedSec}`;
		}
	}

	createBlockElem() {
		const blockContainer = document.createElement('div');
		blockContainer.classList.add('block-container');

		const limitText = document.createElement('p');
		limitText.textContent = 'Limit reached!';

		blockContainer.appendChild(limitText);
		document.body.appendChild(blockContainer);

		this.blockElem = blockContainer;

		// Block scroll
		document.body.classList.add('no-scroll');
	}
}
