export class TimerUI {
	constructor() {
		this.timeText = null;
		this.timerContainer = null;
		this.blockElem = null;
	}

	createTimerElem() {
		const timerContainer = document.createElement('div');
		timerContainer.classList.add('timer-container');
		timerContainer.classList.add('draggable');

		const timer = document.createElement('p');

		timerContainer.appendChild(timer);
		document.body.appendChild(timerContainer);

		// Place timer in previously store position
		chrome.runtime.sendMessage(
			{
				action: 'getTimerPosition',
			},
			function (response) {
				if (response && response.status === 'success') {
					// Set x and y position of timer
					const { x, y } = response.positionData;

					timerContainer.style.left = `${x}px`;
					timerContainer.style.top = `${y}px`;
				}
			}
		);

		this.addDraggableFunctionality(timerContainer);

		this.timeText = timer;
		this.timerContainer = timerContainer;
	}

	removeTimerElem() {
		this.timerContainer.remove();
		this.timeText.remove();
		this.timerContainer = null;
		this.timeText = null;
	}

	updateTimerElem({ hours, minutes, seconds }) {
		let formmatedMin = minutes <= 9 ? `0${minutes}` : minutes;
		let formmatedSec = seconds <= 9 ? `0${seconds}` : seconds;
		let formmatedHours = hours <= 9 ? `0${hours}` : hours;

		if (hours > 0) {
			this.timeText.textContent = `${formmatedHours}:${formmatedMin}:${formmatedSec}`;
		} else {
			this.timeText.textContent = `${formmatedMin}:${formmatedSec}`;
		}
	}

	createBlockElem(timeSpent) {
		const blockContainer = document.createElement('div');
		blockContainer.classList.add('block-container');
		blockContainer.classList.add('show-full-page');

		const limitText = document.createElement('p');
		limitText.textContent = 'Limit reached!';

		const totalSpentText = document.createElement('p');
		totalSpentText.textContent = `You've spent your time limit - ${timeSpent}!`;

		blockContainer.appendChild(limitText);
		blockContainer.appendChild(totalSpentText);
		document.body.appendChild(blockContainer);

		this.blockElem = blockContainer;

		// Block scroll
		document.documentElement.classList.add('no-scroll');
	}

	createConfirmRemovalPopup(removalType) {
		const confirmContainer = document.createElement('div');
		confirmContainer.classList.add('confirm-container');
		confirmContainer.classList.add('show-full-page');

		const btnsContainer = document.createElement('div');
		btnsContainer.classList.add('confirm-btns');

		const confirmText = document.createElement('p');
		confirmText.textContent = `Do you still want to remove the ${removalType}?`;

		const confirmBtn = document.createElement('button');
		confirmBtn.textContent = 'Confirm';

		const cancelBtn = document.createElement('button');
		cancelBtn.textContent = 'Cancel';

		confirmBtn.addEventListener('click', () => {
			hidePopUp();
			chrome.runtime.sendMessage(
				{
					action: 'confirmedRemoval',
					removalType: removalType,
				},
				function (response) {
					if (response.status === 'success') {
						if (this.blockElem) {
							this.blockElem.remove();
							this.blockElem = null;
						}

						if (response.removalType === 'timer') {
							const timerContainer = document.querySelector('.timer-container');
							timerContainer.remove();
							this.timerContainer = null;
						}
					} else {
						alert(response.message);
						console.log(response.message);
					}
				}
			);
		});

		cancelBtn.addEventListener('click', () => {
			hidePopUp();
		});

		btnsContainer.appendChild(cancelBtn);
		btnsContainer.appendChild(confirmBtn);

		confirmContainer.appendChild(confirmText);
		confirmContainer.appendChild(btnsContainer);

		document.body.appendChild(confirmContainer);

		this.confirmPopupElem = confirmContainer;

		// Block scroll
		document.documentElement.classList.add('no-scroll');

		const hidePopUp = () => {
			document.documentElement.classList.remove('no-scroll');
			this.confirmPopupElem.remove();
			this.confirmPopupElem = null;
		};
	}

	addDraggableFunctionality(elemToDrag) {
		let activeDraggable = null;
		let initialX;
		let initialY;
		let xOffset = 0;
		let yOffset = 0;

		function dragStart(e) {
			if (e.button !== 0) return;

			activeDraggable = e.target.closest('.draggable');

			if (!activeDraggable) return;

			activeDraggable.classList.add('dragging-active');

			const rect = activeDraggable.getBoundingClientRect();

			initialX = e.clientX;
			initialY = e.clientY;

			xOffset = initialX - rect.left;
			yOffset = initialY - rect.top;

			document.addEventListener('mousemove', drag);
			document.addEventListener('mouseup', dragEnd);

			e.preventDefault();
		}

		function drag(e) {
			if (!activeDraggable) return;

			const newX = e.clientX - xOffset + 50;
			const newY = e.clientY - yOffset;

			activeDraggable.style.left = `${newX}px`;
			activeDraggable.style.top = `${newY}px`;
		}

		function dragEnd(e) {
			if (activeDraggable) {
				activeDraggable.classList.remove('dragging-active');
				activeDraggable = null;
			}

			document.removeEventListener('mousemove', drag);
			document.removeEventListener('mouseup', dragEnd);

			const newX = e.clientX - xOffset + 50;
			const newY = e.clientY - yOffset;

			chrome.runtime.sendMessage({
				action: 'saveTimerPosition',
				position: { x: newX, y: newY },
			});
		}

		elemToDrag.addEventListener('mousedown', dragStart);
	}
}
