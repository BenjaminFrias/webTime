import { getHostname, getCurrentTab, isTrackedURL } from '../utils/tab';
import { chrome } from 'jest-chrome';
import { TRACKED_DATA_KEY } from '../settings';
import { getData } from '../utils/data';

// getHostname test
describe('getHostname', () => {
	test('should return the origin with a trailing slash for a valid URL', () => {
		const url = 'https://www.youtube.com/path/to/page?query=123';
		const expected = 'https://www.youtube.com/';
		expect(getHostname(url)).toBe(expected);
	});

	test('should handle http URLs correctly', () => {
		const url = 'http://sub.domain.org/another/path';
		const expected = 'http://sub.domain.org/';
		expect(getHostname(url)).toBe(expected);
	});

	test('should handle empty URLs', () => {
		expect(() => getHostname('')).toThrow('Invalid url provided.');
	});
});

// getCurrentTab test
describe('getCurrentTab', () => {
	beforeEach(() => {
		chrome.tabs.query.mockClear();
	});

	test('should return active tab', async () => {
		const mockTab = {
			id: 1,
			url: 'https://www.youtube.com/page1',
			active: true,
			currentWindow: true,
		};

		chrome.tabs.query.mockResolvedValueOnce([mockTab]);

		const result = await getCurrentTab();
		expect(result).toBeTruthy();
		expect(chrome.tabs.query).toHaveBeenCalledWith({
			active: true,
			currentWindow: true,
		});

		expect(result).toEqual(mockTab);
	});

	test('should return null if no active tab is found in the current window', async () => {
		chrome.tabs.query.mockResolvedValueOnce([]);

		const resultTab = await getCurrentTab();

		expect(resultTab).toBeNull();
		expect(chrome.tabs.query).toHaveBeenCalledWith({
			active: true,
			currentWindow: true,
		});
	});

	test('should return null if an error occurs during tab query', async () => {
		chrome.tabs.query.mockRejectedValueOnce(new Error('Failed to query tabs'));

		const consoleErrorSpy = jest
			.spyOn(console, 'error')
			.mockImplementation(() => {});

		const resultTab = await getCurrentTab();

		expect(resultTab).toBeNull();
		expect(consoleErrorSpy).toHaveBeenCalledWith(
			'Error getting current tab:',
			expect.any(Error)
		);

		consoleErrorSpy.mockRestore();
	});
});

// isTrackedURL
jest.mock('../utils/data', () => {
	const actual = jest.requireActual('../utils/data');
	return {
		...actual,
		getData: jest.fn(async (key) => {
			if (key === actual.TRACKED_DATA_KEY) {
				return {
					'test.org': {},
					'example.com': {},
				};
			}
			return {};
		}),
	};
});

describe('isTrackedUrl', () => {
	beforeEach(() => {
		getData.mockClear();
		chrome.storage.local.get.mockClear();
	});

	test('should return false if empty url is passed', async () => {
		chrome.tabs.query.mockResolvedValueOnce([]);

		const result = await isTrackedURL();
		expect(result).toBeFalsy();
	});

	test('should return true if the URL is tracked', async () => {
		// Mock getData to return a specific set of tracked websites
		getData.mockResolvedValueOnce({
			'https://x.com/': {},
			'https://www.youtube.com/': {},
		});

		const result = await isTrackedURL('https://www.youtube.com/');
		expect(result).toBe(true);
		expect(getData).toHaveBeenCalledWith(TRACKED_DATA_KEY);
	});

	test('should return true if the URL is a partial match within a tracked URL', async () => {
		getData.mockResolvedValueOnce({
			'https://www.youtube.com/': {},
		});

		const result = await isTrackedURL('https://www.youtube.com/watch?v/=video');
		expect(result).toBe(true);
	});

	test('should return false if the URL is not tracked', async () => {
		getData.mockResolvedValueOnce({
			'https://www.youtube.com/': {},
		});

		const result = await isTrackedURL('https://www.notTracked.com/');
		expect(result).toBe(false);
	});

	test('should return false if the provided URL is empty or null', async () => {
		const resultNull = await isTrackedURL(null);
		expect(resultNull).toBe(false);
		expect(getData).not.toHaveBeenCalled();

		const resultEmpty = await isTrackedURL('');
		expect(resultEmpty).toBe(false);
		expect(getData).not.toHaveBeenCalled();

		const resultUndefined = await isTrackedURL(undefined);
		expect(resultUndefined).toBe(false);
		expect(getData).not.toHaveBeenCalled();
	});
});
