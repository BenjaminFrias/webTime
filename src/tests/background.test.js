// Mocking Chrome API and local functions
const mockOnUpdatedAddListener = jest.fn((callback) => {
	// This mock allows us to manually trigger the callback in our test
	global.onUpdatedCallback = callback;
});

const mockOnActivatedAddListener = jest.fn((callback) => {
	// Capture the callback passed to addListener
	global.onActivatedListenerCallback = callback;
});

// Use this mock for chrome.tabs.sendMessage
const mockTabsSendMessage = jest.fn();

let mockChromeStorage = {};
global.chrome = {
	runtime: {
		onInstalled: {
			addListener: jest.fn(),
		},
		onStartup: {
			addListener: jest.fn(),
		},
		onMessage: {
			addListener: jest.fn(),
		},
		sendMessage: jest.fn(), // For chrome.runtime.sendMessage
	},
	tabs: {
		onUpdated: {
			addListener: mockOnUpdatedAddListener, // Use the specific mock here
		},
		onActivated: {
			addListener: mockOnActivatedAddListener, // Mock for onActivated
		},
		get: jest.fn(),
		sendMessage: mockTabsSendMessage, // Use the specific mock here for chrome.tabs.sendMessage
	},
	windows: {
		onFocusChanged: {
			addListener: jest.fn(),
		},
		WINDOW_ID_NONE: -1,
	},
	storage: {
		local: {
			get: jest.fn(async (key) => {
				if (Array.isArray(key)) {
					const result = {};
					key.forEach((k) => {
						if (mockChromeStorage[k] !== undefined) {
							result[k] = mockChromeStorage[k];
						}
					});
					return result;
				}
				return { [key]: mockChromeStorage[key] };
			}),
			set: jest.fn(async (items) => {
				Object.assign(mockChromeStorage, items);
			}),
		},
	},
};

// Mock the utility modules
jest.mock('../utils/data', () => ({
	getData: jest.fn(),
	setData: jest.fn(),
	ensureDefaultData: jest.fn(),
	addWebToTrack: jest.fn(),
}));

jest.mock('../settings', () => ({
	STORAGE_LAST_DAY_KEY: 'lastDay',
	TRACKED_DATA_KEY: 'trackedData',
}));

// Mock the Timer class
const mockTimerInstance = {
	startTimer: jest.fn(),
	stopTimer: jest.fn(),
};

jest.mock('../utils/timer', () => ({
	Timer: jest.fn(() => mockTimerInstance), // Return the mock instance
}));

jest.mock('../utils/tab', () => ({
	isTrackedURL: jest.fn(),
	getHostname: jest.fn(),
	getCurrentTab: jest.fn(),
}));

// Import the background script after all mocks are set up
// This ensures the listeners are registered with the mocked chrome API
const BackgroundModule = require('../background'); // Adjust path as needed

describe('background.js', () => {
	// Import mocked functions and constants
	const {
		getData,
		setData,
		ensureDefaultData,
		addWebToTrack,
	} = require('../utils/data');
	const { STORAGE_LAST_DAY_KEY, TRACKED_DATA_KEY } = require('../settings');
	const { Timer } = require('../utils/timer');
	const { isTrackedURL, getHostname, getCurrentTab } = require('../utils/tab');

	// Store the original Date object
	const RealDate = Date;

	beforeEach(() => {
		// Clear all mocks before each test
		jest.clearAllMocks();
		mockChromeStorage.lastDay = undefined;
		mockChromeStorage.trackedData = undefined;

		// Reset the global chrome mock listeners since they accumulate across tests
		global.chrome.runtime.onInstalled.addListener.mockClear();
		global.chrome.runtime.onStartup.addListener.mockClear();
		// Clear the specific onUpdated listener mock
		mockOnUpdatedAddListener.mockClear();
		global.chrome.windows.onFocusChanged.addListener.mockClear();
		global.chrome.tabs.onActivated.addListener.mockClear(); // Clear onActivated mock
		global.chrome.runtime.onMessage.addListener.mockClear();
		mockTabsSendMessage.mockClear();

		// Restore the original Date object
		global.Date = RealDate;

		// Re-mock the Timer to ensure a fresh instance or state for each test if necessary
		Timer.mockClear();
		Timer.mockImplementation(() => mockTimerInstance);

		// Reset isTrackedURL mock implementation for each test
		isTrackedURL.mockResolvedValue(false); // Default to false
	});

	// --- Test initializeExtension function ---
	describe('initializeExtension', () => {
		it('should ensure default data for TRACKED_DATA_KEY and STORAGE_LAST_DAY_KEY', async () => {
			// Mock Date to control the 'today' value
			const mockDate = new Date('2024-01-15T10:00:00Z');
			const mockToLocaleDateString = jest.fn(() => '1/15/2024');
			global.Date = jest.fn(() => mockDate);
			global.Date.prototype.toLocaleDateString = mockToLocaleDateString;

			await BackgroundModule.initializeExtension();

			expect(ensureDefaultData).toHaveBeenCalledTimes(2);
			expect(ensureDefaultData).toHaveBeenCalledWith(TRACKED_DATA_KEY, {});
			expect(ensureDefaultData).toHaveBeenCalledWith(
				STORAGE_LAST_DAY_KEY,
				'1/15/2024'
			);
		});
	});

	// --- Test resetTimerDaily function ---
	describe('resetTimerDaily', () => {
		it('should reset timers if the day has changed', async () => {
			const today = '1/16/2024';
			const prevDay = '1/15/2024';
			const trackedData = {
				'example.com': { timer: { hours: 1, minutes: 30, seconds: 45 } },
				'anotherexample.com': { timer: { hours: 0, minutes: 10, seconds: 0 } },
			};

			const mockDate = new Date('2024-01-16T10:00:00Z');
			const mockToLocaleDateString = jest.fn(() => today);
			global.Date = jest.fn(() => mockDate);
			global.Date.prototype.toLocaleDateString = mockToLocaleDateString;

			getData.mockResolvedValueOnce(prevDay); // For STORAGE_LAST_DAY_KEY
			getData.mockResolvedValueOnce(trackedData); // For TRACKED_DATA_KEY

			await BackgroundModule.resetTimerDaily();

			expect(getData).toHaveBeenCalledWith(STORAGE_LAST_DAY_KEY);
			expect(getData).toHaveBeenCalledWith(TRACKED_DATA_KEY);
			expect(setData).toHaveBeenCalledTimes(2);
			expect(setData).toHaveBeenCalledWith(TRACKED_DATA_KEY, {
				'example.com': { timer: { hours: 0, minutes: 0, seconds: 0 } },
				'anotherexample.com': { timer: { hours: 0, minutes: 0, seconds: 0 } },
			});
			expect(setData).toHaveBeenCalledWith(STORAGE_LAST_DAY_KEY, today);
		});
	});

	it('should not reset timers if the day has not changed', async () => {
		const today = '1/15/2024';

		// Mock Date to return 'today'
		const mockDate = new Date('2024-01-15T10:00:00Z');
		const mockToLocaleDateString = jest.fn(() => today);
		global.Date = jest.fn(() => mockDate);
		global.Date.prototype.toLocaleDateString = mockToLocaleDateString;

		getData.mockResolvedValueOnce(today); // For STORAGE_LAST_DAY_KEY
		getData.mockResolvedValueOnce({}); // For TRACKED_DATA_KEY (won't be used if day is same)

		await BackgroundModule.resetTimerDaily();

		expect(getData).toHaveBeenCalledWith(STORAGE_LAST_DAY_KEY);
		// TRACKED_DATA_KEY should not be fetched if the day hasn't changed
		expect(getData).not.toHaveBeenCalledWith(TRACKED_DATA_KEY);
		expect(setData).not.toHaveBeenCalled();
	});

	it('should log an error if STORAGE_LAST_DAY_KEY data is missing', async () => {
		console.log = jest.fn(); // Mock console.log
		getData.mockResolvedValueOnce(null); // Simulate missing prevDay

		await BackgroundModule.resetTimerDaily();

		expect(console.log).toHaveBeenCalledWith(
			'resetTimerDaily error: ',
			new Error('Error while resetting timers')
		);
		expect(setData).not.toHaveBeenCalled();
	});

	it('should log an error if TRACKED_DATA_KEY data is missing when resetting', async () => {
		console.log = jest.fn(); // Mock console.log
		const today = '1/16/2024';
		const prevDay = '1/15/2024';

		// Mock Date to return 'today'
		const mockDate = new Date('2024-01-16T10:00:00Z');
		const mockToLocaleDateString = jest.fn(() => today);
		global.Date = jest.fn(() => mockDate);
		global.Date.prototype.toLocaleDateString = mockToLocaleDateString;

		getData.mockResolvedValueOnce(prevDay); // For STORAGE_LAST_DAY_KEY
		getData.mockResolvedValueOnce(null); // Simulate missing trackedData

		await BackgroundModule.resetTimerDaily();

		expect(console.log).toHaveBeenCalledWith(
			'resetTimerDaily error: ',
			new Error('Error while resetting timers', undefined) // 'err' is undefined in the original catch
		);
		expect(setData).not.toHaveBeenCalled();
	});

	// --- Test updateTimerState function ---
	describe('updateTimerState', () => {
		it('should start the timer if the tab URL is tracked', async () => {
			const tab = { url: 'https://www.youtube.com/watch?v=123' };
			const hostname = 'youtube.com';
			const trackedData = {
				'youtube.com': { timer: { hours: 0, minutes: 5, seconds: 0 } },
			};

			isTrackedURL.mockResolvedValue(true);
			getHostname.mockReturnValue(hostname);
			getData.mockResolvedValue(trackedData);

			await BackgroundModule.updateTimerState(tab);

			expect(isTrackedURL).toHaveBeenCalledWith(tab.url);
			expect(mockTimerInstance.stopTimer).toHaveBeenCalledTimes(1);
			expect(mockTimerInstance.startTimer).toHaveBeenCalledWith(
				{ hours: 0, minutes: 5, seconds: 0 },
				hostname
			);
		});

		it('should stop the timer if the tab URL is not tracked', async () => {
			const tab = { url: 'https://www.google.com' };
			isTrackedURL.mockResolvedValue(false);

			await BackgroundModule.updateTimerState(tab);

			expect(isTrackedURL).toHaveBeenCalledWith(tab.url);
			expect(mockTimerInstance.stopTimer).toHaveBeenCalledTimes(1);
			expect(mockTimerInstance.startTimer).not.toHaveBeenCalled();
		});

		it('should throw an error if tab or tab.url is undefined', async () => {
			await expect(
				BackgroundModule.updateTimerState(undefined)
			).rejects.toThrow('Tab is undefined');
			await expect(BackgroundModule.updateTimerState({})).rejects.toThrow(
				'Tab is undefined'
			);
			expect(isTrackedURL).not.toHaveBeenCalled();
		});
	});

	describe('chrome.tabs.onUpdated.addListener', () => {
		let consoleSpy;

		beforeEach(() => {
			consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

			isTrackedURL.mockResolvedValue(false);
		});

		afterEach(() => {
			consoleSpy.mockRestore();
		});

		test('should call functions when tab update is complete and URL is tracked', async () => {
			const tabId = 123;
			const changeInfo = { status: 'complete' };
			const tab = { id: tabId, url: 'https://example.com' };

			isTrackedURL.mockResolvedValue(true);

			await global.onUpdatedCallback(tabId, changeInfo, tab);

			expect(isTrackedURL).toHaveBeenCalledTimes(2);
			expect(isTrackedURL).toHaveBeenCalledWith(tab.url);

			expect(mockTabsSendMessage).toHaveBeenCalledTimes(1);
			expect(mockTabsSendMessage).toHaveBeenCalledWith(tabId, {
				type: 'createTimerElement',
			});
		});

		test('should call functions except sendMessage when tab update is complete but URL is not tracked', async () => {
			const tabId = 456;
			const changeInfo = { status: 'complete' };
			const tab = { id: tabId, url: 'https://untracked-example.com' };

			await global.onUpdatedCallback(tabId, changeInfo, tab);

			expect(isTrackedURL).toHaveBeenCalledTimes(2);
			expect(isTrackedURL).toHaveBeenCalledWith(tab.url);

			expect(mockTabsSendMessage).not.toHaveBeenCalled();
		});

		test('should not call functions if tab status is not complete', async () => {
			const tabId = 789;
			const changeInfo = { status: 'loading' }; // Not 'complete'
			const tab = { id: tabId, url: 'https://another-example.com' };

			await global.onUpdatedCallback(tabId, changeInfo, tab);

			expect(isTrackedURL).not.toHaveBeenCalled();
			expect(mockTabsSendMessage).not.toHaveBeenCalled();
		});

		test('should log error if any function throws an error', async () => {
			const tabId = 101;
			const changeInfo = { status: 'complete' };
			const tab = { id: tabId, url: 'https://error-example.com' };
			const errorMessage = 'Something went wrong!';

			isTrackedURL.mockRejectedValue(new Error(errorMessage));

			await global.onUpdatedCallback(tabId, changeInfo, tab);

			expect(isTrackedURL).toHaveBeenCalledTimes(1);
			expect(consoleSpy).toHaveBeenCalledTimes(1);
			expect(consoleSpy).toHaveBeenCalledWith(expect.any(Error));
			expect(consoleSpy.mock.calls[0][0].message).toBe(errorMessage);
		});
	});

	describe('chrome.tabs.onActivated.addListener', () => {
		let consoleSpy;

		beforeEach(() => {
			consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
			getCurrentTab.mockResolvedValue(false);
		});

		afterEach(() => {
			consoleSpy.mockRestore();
		});

		test('should do nothing when tab is not being tracked', async () => {
			const tabId = 123;
			const changeInfo = { status: 'complete' };
			const tab = { id: tabId, url: 'https://example.com' };

			await global.onActivatedListenerCallback(tabId, changeInfo, tab);
			getCurrentTab.mockResolvedValue(false);

			expect(getCurrentTab).toHaveBeenCalledTimes(1);
		});
	});
});
