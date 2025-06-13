const mockTimerUIInstance = {
	updateTimerElem: jest.fn(),
	createTimerElem: jest.fn(),
	timerElem: document.createElement('div'),
};

const MockTimerUI = jest.fn(() => mockTimerUIInstance);

jest.mock('../utils/timerUI', () => ({
	TimerUI: MockTimerUI,
}));

describe('Content Script Message Listener', () => {
	let originalChrome;

	beforeEach(() => {
		mockTimerUIInstance.updateTimerElem.mockClear();
		mockTimerUIInstance.createTimerElem.mockClear();
		MockTimerUI.mockClear();

		mockTimerUIInstance.timerElem = document.createElement('div');

		originalChrome = global.chrome;
		global.chrome = {
			runtime: {
				onMessage: {
					addListener: jest.fn(),
					removeListener: jest.fn(),
					callListeners: jest.fn(),
				},
				sendMessage: jest.fn(),
			},
		};
		jest.resetModules();
		require('../content.js');
	});

	afterEach(() => {
		global.chrome = originalChrome;
		jest.restoreAllMocks();
	});

	test('should initialize TimerUI once', () => {
		expect(MockTimerUI).toHaveBeenCalledTimes(1);
	});

	test('should call mockTimerUIInstance.updateTimerElem when a "background" message is received', () => {
		const testTimerData = { hours: 0, minutes: 5, seconds: 30 };
		const request = { type: 'background', timer: testTimerData };
		const sender = { tab: { id: 123 } };
		const sendResponse = jest.fn();

		expect(chrome.runtime.onMessage.addListener).toHaveBeenCalledTimes(1);
		const listenerFunction =
			chrome.runtime.onMessage.addListener.mock.calls[0][0];

		listenerFunction(request, sender, sendResponse);

		expect(mockTimerUIInstance.updateTimerElem).toHaveBeenCalledTimes(1);
		expect(mockTimerUIInstance.updateTimerElem).toHaveBeenCalledWith(
			testTimerData
		);
		expect(mockTimerUIInstance.createTimerElem).not.toHaveBeenCalled();
	});

	test('should call mockTimerUIInstance.createTimerElem when a "createTimerElement" message is received and timerElem is null', () => {
		const request = { type: 'createTimerElement' };
		const sender = { tab: { id: 123 } };
		const sendResponse = jest.fn();

		mockTimerUIInstance.timerElem = null;

		const listenerFunction =
			chrome.runtime.onMessage.addListener.mock.calls[0][0];
		listenerFunction(request, sender, sendResponse);

		expect(mockTimerUIInstance.createTimerElem).toHaveBeenCalledTimes(1);
		expect(mockTimerUIInstance.updateTimerElem).not.toHaveBeenCalled();
	});

	test('should NOT call mockTimerUIInstance.createTimerElem when a "createTimerElement" message is received and timerElem is already set', () => {
		const request = { type: 'createTimerElement' };
		const sender = { tab: { id: 123 } };
		const sendResponse = jest.fn();

		const listenerFunction =
			chrome.runtime.onMessage.addListener.mock.calls[0][0];
		listenerFunction(request, sender, sendResponse);

		expect(mockTimerUIInstance.createTimerElem).not.toHaveBeenCalled();
		expect(mockTimerUIInstance.updateTimerElem).not.toHaveBeenCalled();
	});

	test('should do nothing for unknown message types', () => {
		const request = { type: 'unknownMessage' };
		const sender = { tab: { id: 123 } };
		const sendResponse = jest.fn();

		const listenerFunction =
			chrome.runtime.onMessage.addListener.mock.calls[0][0];
		listenerFunction(request, sender, sendResponse);

		expect(mockTimerUIInstance.updateTimerElem).not.toHaveBeenCalled();
		expect(mockTimerUIInstance.createTimerElem).not.toHaveBeenCalled();
	});
});
