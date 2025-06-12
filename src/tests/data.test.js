import { TRACKED_DATA_KEY } from '../settings';
import {
	addWebToTrack,
	ensureDefaultData,
	getData,
	sendData,
	setData,
} from '../utils/data';
import { chrome } from 'jest-chrome';
import { getCurrentTab } from '../utils/tab';

describe('getData', () => {
	beforeEach(() => {
		chrome.storage.local.get.mockClear();
	});

	const mockStoredData = {
		'https://x.com/': { timer: { hours: 1, minutes: 9, seconds: 21 } },
		'https://www.youtube.com/': {
			timer: { hours: 0, minutes: 39, seconds: 54 },
		},
	};

	test('should return true if retrieved data match the stored data', async () => {
		chrome.storage.local.get.mockImplementationOnce((keys, callback) => {
			if (Array.isArray(keys) && keys.includes(TRACKED_DATA_KEY)) {
				callback({ [TRACKED_DATA_KEY]: mockStoredData });
			} else {
				callback({});
			}
		});

		const result = await getData(TRACKED_DATA_KEY);

		expect(chrome.storage.local.get).toHaveBeenCalledWith(
			[TRACKED_DATA_KEY],
			expect.any(Function)
		);

		expect(result).toEqual(mockStoredData);
	});

	test('should return undefined if no data is stored for the key', async () => {
		chrome.storage.local.get.mockImplementationOnce((keys, callback) => {
			callback({});
		});

		const result = await getData(TRACKED_DATA_KEY);

		expect(chrome.storage.local.get).toHaveBeenCalledWith(
			[TRACKED_DATA_KEY],
			expect.any(Function)
		);
		expect(result).toBeUndefined();
	});

	test('should reject with chrome.runtime.lastError if an error occurs', async () => {
		const mockError = new Error('get error message');
		chrome.runtime.lastError = mockError;

		chrome.storage.local.get.mockImplementationOnce((keys, callback) => {
			callback({});
		});

		await expect(getData(TRACKED_DATA_KEY)).rejects.toThrow(mockError);

		expect(chrome.storage.local.get).toHaveBeenCalledWith(
			[TRACKED_DATA_KEY],
			expect.any(Function)
		);
	});
});

describe('setData', () => {
	beforeEach(() => {
		chrome.storage.local.set.mockClear();
		Object.defineProperty(chrome.runtime, 'lastError', {
			get: jest.fn(() => undefined),
			configurable: true,
		});
	});

	test('should successfully set data in local storage', async () => {
		Object.defineProperty(chrome.runtime, 'lastError', {
			set: jest.fn(() => undefined),
			configurable: true,
		});

		const testKey = 'trackedData';
		const testData = {
			'https://x.com/': { timer: { hours: 1, minutes: 23, seconds: 45 } },
		};

		chrome.storage.local.set.mockImplementationOnce((items, callback) => {
			callback();
		});

		// Call the function under test
		await setData(testKey, testData);
		// Assert that chrome.storage.local.set was called correctly
		expect(chrome.storage.local.set).toHaveBeenCalledTimes(1);
		expect(chrome.storage.local.set).toHaveBeenCalledWith(
			{ [testKey]: testData },
			expect.any(Function)
		);
	});

	test('should handle error when setting data fails', async () => {
		const testKey = 'trackedData';
		const testData = {
			'https://x.com/': { timer: { hours: 1, minutes: 23, seconds: 45 } },
		};
		const mockError = new Error('Storage quota exceeded');
		mockError.message = 'Storage quota exceeded';

		Object.defineProperty(chrome.runtime, 'lastError', {
			get: jest.fn(() => mockError),
			configurable: true,
		});

		chrome.storage.local.set.mockImplementationOnce((items, callback) => {
			callback();
		});

		await expect(setData(testKey, testData)).rejects.toThrow(mockError.message);

		expect(chrome.storage.local.set).toHaveBeenCalledTimes(1);
		expect(chrome.storage.local.set).toHaveBeenCalledWith(
			{ [testKey]: testData },
			expect.any(Function)
		);

		expect(chrome.runtime.lastError).toEqual(mockError);
	});
});

// SEND DATA
describe('sendData', () => {
	beforeEach(() => {
		chrome.tabs.query.mockClear();
		chrome.tabs.sendMessage.mockClear();
		Object.defineProperty(chrome.runtime, 'lastError', {
			get: jest.fn(() => undefined),
			configurable: true,
		});
	});

	test('should send data to the current tab', async () => {
		const mockTabId = 123;
		const testDataType = 'myFeatureData';
		const testData = { some: 'value', another: [1, 2, 3] };

		chrome.tabs.query.mockResolvedValueOnce([
			{ id: mockTabId, active: true, currentWindow: true },
		]);

		await sendData(testDataType, testData);

		expect(chrome.tabs.query).toHaveBeenCalledTimes(1);
		expect(chrome.tabs.query).toHaveBeenCalledWith({
			active: true,
			currentWindow: true,
		});

		expect(chrome.tabs.sendMessage).toHaveBeenCalledTimes(1);
		expect(chrome.tabs.sendMessage).toHaveBeenCalledWith(mockTabId, {
			type: 'background',
			[testDataType]: testData,
		});
	});

	test('should handle cases where no active tab is found', async () => {
		const testDataType = 'myFeatureData';
		const testData = { some: 'value' };

		chrome.tabs.query.mockResolvedValueOnce([]);

		const consoleWarnSpy = jest
			.spyOn(console, 'warn')
			.mockImplementation(() => {});

		await sendData(testDataType, testData);

		expect(chrome.tabs.query).toHaveBeenCalledTimes(1);
		expect(chrome.tabs.sendMessage).not.toHaveBeenCalled();
		expect(consoleWarnSpy).toHaveBeenCalledWith(
			'Could not get current tab. Message not sent.'
		);

		consoleWarnSpy.mockRestore();
	});
});

describe('ensureDefaultData', () => {
	const testKey = 'testKey';
	const defaultValue = { default: 'value' };

	beforeEach(() => {
		chrome.storage.local.get.mockClear();
		chrome.storage.local.set.mockClear();
		Object.defineProperty(chrome.runtime, 'lastError', {
			get: jest.fn(() => undefined),
			configurable: true,
		});
	});

	test('should set default data if no existing data is found (undefined)', async () => {
		chrome.storage.local.get.mockImplementationOnce((keys, callback) => {
			callback({});
		});

		chrome.storage.local.set.mockImplementationOnce((items, callback) => {
			callback();
		});

		await ensureDefaultData(testKey, defaultValue);

		expect(chrome.storage.local.get).toHaveBeenCalledWith(
			[testKey],
			expect.any(Function)
		);
		expect(chrome.storage.local.set).toHaveBeenCalledWith(
			{ [testKey]: defaultValue },
			expect.any(Function)
		);
	});

	test('should set default data if no existing data is found (null)', async () => {
		chrome.storage.local.get.mockImplementationOnce((keys, callback) => {
			callback({ [testKey]: null }); // Simulate null data for the key
		});

		chrome.storage.local.set.mockImplementationOnce((items, callback) => {
			callback();
		});

		await ensureDefaultData(testKey, defaultValue);

		expect(chrome.storage.local.get).toHaveBeenCalledWith(
			[testKey],
			expect.any(Function)
		);
		expect(chrome.storage.local.set).toHaveBeenCalledWith(
			{ [testKey]: defaultValue },
			expect.any(Function)
		);
	});

	test('should not set default data if existing data is found', async () => {
		const existingData = { existing: 'data' };
		chrome.storage.local.get.mockImplementationOnce((keys, callback) => {
			callback({ [testKey]: existingData });
		});

		chrome.storage.local.set.mockImplementation(() => {
			throw new Error('setData should not be called');
		});

		await ensureDefaultData(testKey, defaultValue);

		expect(chrome.storage.local.get).toHaveBeenCalledWith(
			[testKey],
			expect.any(Function)
		);
		expect(chrome.storage.local.set).not.toHaveBeenCalled();
	});

	test('should log an error if setData fails', async () => {
		const mockError = new Error('Failed to set data');

		chrome.storage.local.get.mockImplementationOnce((keys, callback) => {
			callback({});
		});

		chrome.storage.local.set.mockImplementationOnce((items, callback) => {
			Object.defineProperty(chrome.runtime, 'lastError', {
				get: jest.fn(() => mockError),
				configurable: true,
			});
			callback();
		});

		const consoleErrorSpy = jest
			.spyOn(console, 'error')
			.mockImplementation(() => {});

		await ensureDefaultData(testKey, defaultValue);

		expect(chrome.storage.local.get).toHaveBeenCalledWith(
			[testKey],
			expect.any(Function)
		);
		expect(chrome.storage.local.set).toHaveBeenCalledWith(
			{ [testKey]: defaultValue },
			expect.any(Function)
		);
		expect(consoleErrorSpy).toHaveBeenCalledWith(
			'Error in ensureDefaultData:',
			mockError
		);

		consoleErrorSpy.mockRestore();
	});
});

describe('addWebToTrack', () => {
	const newUrl = 'https://example.com/';
	const initialTrackedData = {
		'https://x.com/': {
			timer: { hours: 0, minutes: 34, seconds: 11 },
		},
		'https://www.youtube.com/': {
			timer: { hours: 1, minutes: 9, seconds: 21 },
		},
	};
	const defaultTimer = { hours: 0, minutes: 0, seconds: 0 };

	beforeEach(() => {
		// Clear all mocks and reset lastError before each test
		chrome.storage.local.get.mockClear();
		chrome.storage.local.set.mockClear();
		Object.defineProperty(chrome.runtime, 'lastError', {
			get: jest.fn(() => undefined),
			configurable: true,
		});
	});

	test('should successfully add a new website to track', async () => {
		// Mock getData to return existing tracked data (without the new URL)
		chrome.storage.local.get.mockImplementationOnce((keys, callback) => {
			callback({ [TRACKED_DATA_KEY]: initialTrackedData });
		});

		// Mock setData to simulate a successful save
		chrome.storage.local.set.mockImplementationOnce((items, callback) => {
			callback();
		});

		await addWebToTrack(newUrl);

		// Expect getData to have been called once
		expect(chrome.storage.local.get).toHaveBeenCalledTimes(1);
		expect(chrome.storage.local.get).toHaveBeenCalledWith(
			[TRACKED_DATA_KEY],
			expect.any(Function)
		);

		// Expect setData to have been called once with the updated data
		expect(chrome.storage.local.set).toHaveBeenCalledTimes(1);
		const expectedNewTrackedData = {
			...initialTrackedData,
			[newUrl]: { timer: defaultTimer },
		};
		expect(chrome.storage.local.set).toHaveBeenCalledWith(
			{ [TRACKED_DATA_KEY]: expectedNewTrackedData },
			expect.any(Function)
		);
	});

	test('should throw an error if the website is already being tracked', async () => {
		const existingUrl = 'https://x.com/';

		// Mock getData to return tracked data that includes the existing URL
		chrome.storage.local.get.mockImplementationOnce((keys, callback) => {
			callback({ [TRACKED_DATA_KEY]: initialTrackedData });
		});

		// Ensure setData is never called
		chrome.storage.local.set.mockImplementation(() => {
			throw new Error(
				'setData should not be called when website is already tracked'
			);
		});

		await expect(addWebToTrack(existingUrl)).rejects.toThrow(
			'Website is already being tracked.'
		);

		// Expect getData to have been called
		expect(chrome.storage.local.get).toHaveBeenCalledTimes(1);
		// Expect setData not to have been called
		expect(chrome.storage.local.set).not.toHaveBeenCalled();
	});
});
