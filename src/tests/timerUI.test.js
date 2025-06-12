import { TimerUI } from '../utils/timerUI';

beforeEach(() => {
	document.body.innerHTML = '';
});

describe('TimerUI', () => {
	let timerUI;

	beforeEach(() => {
		timerUI = new TimerUI();
	});

	// Test createTimerElem method
	describe('createTimerElem', () => {
		test('should create a timer container and append it to the body', () => {
			timerUI.createTimerElem();
			const timerContainer = document.querySelector('.timer-container');
			expect(timerContainer).not.toBeNull();
			expect(document.body.contains(timerContainer)).toBe(true);
		});

		test('should create a p element inside the timer container', () => {
			timerUI.createTimerElem();
			const timerContainer = document.querySelector('.timer-container');
			const timerP = timerContainer ? timerContainer.querySelector('p') : null;
			expect(timerP).not.toBeNull();
			expect(timerContainer.contains(timerP)).toBe(true);
		});

		test('should set timerElem property to the created p element', () => {
			timerUI.createTimerElem();
			const timerP = document.querySelector('.timer-container p');
			expect(timerUI.timerElem).toBe(timerP);
		});
	});

	// Test updateTimerElem method
	describe('updateTimerElem', () => {
		beforeEach(() => {
			timerUI.createTimerElem();
		});

		test('should format time correctly when hours are 0', () => {
			timerUI.updateTimerElem({ hours: 0, minutes: 5, seconds: 30 });
			expect(timerUI.timerElem.textContent).toBe('05:30');

			timerUI.updateTimerElem({ hours: 0, minutes: 12, seconds: 5 });
			expect(timerUI.timerElem.textContent).toBe('12:05');

			timerUI.updateTimerElem({ hours: 0, minutes: 0, seconds: 0 });
			expect(timerUI.timerElem.textContent).toBe('00:00');
		});

		test('should format time correctly when hours are greater than 0', () => {
			timerUI.updateTimerElem({ hours: 10, minutes: 25, seconds: 45 });
			expect(timerUI.timerElem.textContent).toBe('10:25:45');

			timerUI.updateTimerElem({ hours: 9, minutes: 9, seconds: 9 });
			expect(timerUI.timerElem.textContent).toBe('09:09:09');
		});

		test('should handle single digit minutes and seconds with leading zeros', () => {
			timerUI.updateTimerElem({ hours: 0, minutes: 7, seconds: 2 });
			expect(timerUI.timerElem.textContent).toBe('07:02');

			timerUI.updateTimerElem({ hours: 3, minutes: 4, seconds: 5 });
			expect(timerUI.timerElem.textContent).toBe('03:04:05');
		});
	});
});
