import { Timer } from '../utils/timer';
import * as dataModule from '../utils/data';
import { TRACKED_DATA_KEY } from '../settings';
jest.mock('../utils/data');

describe('Timer Class', () => {
	let timerInstance;
	let tickSpy;

	beforeEach(() => {
		jest.useFakeTimers();

		setIntervalSpy = jest.spyOn(global, 'setInterval');
		clearIntervalSpy = jest.spyOn(global, 'clearInterval');

		dataModule.getData.mockClear();
		dataModule.sendData.mockClear();
		dataModule.setData.mockClear();

		timerInstance = new Timer();

		tickSpy = jest.spyOn(timerInstance, '_tick');

		tickSpy.mockImplementation(async (args) => {});

		dataModule.getData.mockResolvedValue({});
	});

	afterEach(() => {
		jest.runOnlyPendingTimers();
		jest.clearAllTimers();
		jest.useRealTimers();

		if (tickSpy) {
			tickSpy.mockRestore();
		}

		if (setIntervalSpy) {
			setIntervalSpy.mockRestore();
		}
		if (clearIntervalSpy) {
			clearIntervalSpy.mockRestore();
		}
	});

	describe('constructor', () => {
		test('should initialize timer to null', () => {
			expect(timerInstance.timer).toBeNull();
		});
	});

	describe('startTimer', () => {
		const trackedURL = 'https://example.com';

		test('should call setInterval with a 1-second interval', () => {
			const initialTime = { hours: 0, minutes: 0, seconds: 0 };
			timerInstance.startTimer(initialTime, trackedURL);

			expect(setInterval).toHaveBeenCalledTimes(1);
			expect(setInterval).toHaveBeenCalledWith(expect.any(Function), 1000);
		});

		test('should call _tick immediately and then every second with incremented time', async () => {
			const initialTime = { hours: 0, minutes: 0, seconds: 58 };
			timerInstance.startTimer(initialTime, trackedURL);

			jest.advanceTimersByTime(1000);
			await Promise.resolve();

			expect(tickSpy).toHaveBeenCalledTimes(1);
			expect(tickSpy).toHaveBeenCalledWith({
				trackedURL,
				hours: 0,
				minutes: 0,
				seconds: 59,
			});

			jest.advanceTimersByTime(1000);
			await Promise.resolve();

			expect(tickSpy).toHaveBeenCalledTimes(2);
			expect(tickSpy).toHaveBeenCalledWith({
				trackedURL,
				hours: 0,
				minutes: 1,
				seconds: 0,
			});

			jest.advanceTimersByTime(59 * 60 * 1000);
			jest.advanceTimersByTime(59 * 1000);
			await Promise.resolve();

			expect(tickSpy).toHaveBeenCalledWith({
				trackedURL,
				hours: 1,
				minutes: 0,
				seconds: 0,
			});
			expect(tickSpy.mock.calls.length).toBeGreaterThanOrEqual(60 * 60 + 1);
		});

		test('should use the currentHours, currentMinutes, currentSeconds variables for calculations', async () => {
			const initialTime = { hours: 0, minutes: 0, seconds: 59 };
			timerInstance.startTimer(initialTime, trackedURL);

			jest.advanceTimersByTime(1000);
			await Promise.resolve();

			expect(tickSpy).toHaveBeenCalledWith({
				trackedURL,
				hours: 0,
				minutes: 1,
				seconds: 0,
			});
		});
	});

	describe('stopTimer', () => {
		test('should call clearInterval with the stored timer ID', () => {
			const initialTime = { hours: 0, minutes: 0, seconds: 0 };
			const trackedURL = 'https://example.com';

			timerInstance.startTimer(initialTime, trackedURL);
			const timerId = timerInstance.timer;

			timerInstance.stopTimer();

			expect(clearInterval).toHaveBeenCalledTimes(1);
			expect(clearInterval).toHaveBeenCalledWith(timerId);
		});

		test('should not call _tick after stopTimer is called', async () => {
			const initialTime = { hours: 0, minutes: 0, seconds: 0 };
			const trackedURL = 'https://example.com';

			timerInstance.startTimer(initialTime, trackedURL);
			jest.advanceTimersByTime(1000);
			await Promise.resolve();
			expect(tickSpy).toHaveBeenCalledTimes(1);

			timerInstance.stopTimer();
			tickSpy.mockClear();

			jest.advanceTimersByTime(5000);
			await Promise.resolve();

			expect(tickSpy).not.toHaveBeenCalled();
		});
	});

	describe('_tick method', () => {
		beforeEach(() => {
			if (tickSpy) {
				tickSpy.mockRestore();
			}
			dataModule.getData.mockClear();
			dataModule.sendData.mockClear();
			dataModule.setData.mockClear();
		});

		test('should call sendData with "timer" and current time data', async () => {
			const testTime = { hours: 1, minutes: 2, seconds: 3 };
			const trackedURL = 'https://test.com';

			await timerInstance._tick({ ...testTime, trackedURL });

			expect(dataModule.sendData).toHaveBeenCalledTimes(1);
			expect(dataModule.sendData).toHaveBeenCalledWith('timer', testTime);
		});

		test('should call getData with TRACKED_DATA_KEY', async () => {
			dataModule.getData.mockResolvedValueOnce({});
			const testTime = { hours: 1, minutes: 2, seconds: 3 };
			const trackedURL = 'https://test.com';

			await timerInstance._tick({ ...testTime, trackedURL });

			expect(dataModule.getData).toHaveBeenCalledTimes(1);
			expect(dataModule.getData).toHaveBeenCalledWith(TRACKED_DATA_KEY);
		});

		test('should update existing tracked URL data correctly', async () => {
			const initialTrackedData = {
				'https://test.com': {
					timer: { hours: 0, minutes: 0, seconds: 5 },
				},
			};
			dataModule.getData.mockResolvedValueOnce(initialTrackedData);

			const testTime = { hours: 1, minutes: 2, seconds: 3 };
			const trackedURL = 'https://test.com';

			await timerInstance._tick({ ...testTime, trackedURL });

			const expectedNewTrackedData = {
				'https://test.com': { timer: testTime },
			};

			expect(dataModule.setData).toHaveBeenCalledTimes(1);
			expect(dataModule.setData).toHaveBeenCalledWith(
				TRACKED_DATA_KEY,
				expectedNewTrackedData
			);
		});

		test('should add new tracked URL data if URL does not exist', async () => {
			const initialTrackedData = {
				'https://existing.com': { otherData: 'value' },
			};
			dataModule.getData.mockResolvedValueOnce(initialTrackedData);

			const testTime = { hours: 0, minutes: 1, seconds: 45 };
			const trackedURL = 'https://new.com';

			await timerInstance._tick({ ...testTime, trackedURL });

			const expectedNewTrackedData = {
				'https://existing.com': { otherData: 'value' },
				'https://new.com': { timer: testTime },
			};

			expect(dataModule.setData).toHaveBeenCalledTimes(1);
			expect(dataModule.setData).toHaveBeenCalledWith(
				TRACKED_DATA_KEY,
				expectedNewTrackedData
			);
		});

		test('should handle empty or null initial tracked data gracefully', async () => {
			dataModule.getData.mockResolvedValueOnce(null); // Simulate no data initially

			const testTime = { hours: 0, minutes: 5, seconds: 0 };
			const trackedURL = 'https://empty.com';

			await timerInstance._tick({ ...testTime, trackedURL });

			const expectedNewTrackedData = {
				'https://empty.com': { timer: testTime },
			};

			expect(dataModule.setData).toHaveBeenCalledTimes(1);
			expect(dataModule.setData).toHaveBeenCalledWith(
				TRACKED_DATA_KEY,
				expectedNewTrackedData
			);
		});
	});
});
