const { initPopup } = require('../popup.js');

const mockSendMessage = jest.fn();
const mockWindowClose = jest.fn();

global.chrome = {
	runtime: {
		sendMessage: mockSendMessage,
	},
};
global.window = {
	close: mockWindowClose,
};

describe('initPopup', () => {
	let newWebButton;
	let newWebResult;
	let originalChrome;
	let originalWindowClose;

	beforeEach(() => {
		document.body.innerHTML = `
            <button id="newWebButton">Add New Website</button>
            <div id="addResult"></div>
			<form id="limit-form">
					<input
						type="number"
						name="hourLimit"
						id="hourLimit"
						min="0"
						max="24"
					/>
					<input type="number" name="minLimit" id="minLimit" min="1" max="59" />
					<button type="submit">Set limit</button>
				</form>
        `;

		newWebButton = document.querySelector('#newWebButton');
		newWebResult = document.querySelector('#addResult');

		if (!newWebButton) {
			console.error(
				'newWebButton was not found in DOM after setting innerHTML!'
			);
		}
		if (!newWebResult) {
			console.error(
				'newWebResult was not found in DOM after setting innerHTML!'
			);
		}

		originalChrome = global.chrome;
		originalWindowClose = window.close;

		global.chrome = {
			runtime: {
				sendMessage: jest.fn(),
			},
		};

		jest.spyOn(window, 'close').mockImplementation(() => {});

		jest.useFakeTimers();
	});

	afterEach(() => {
		global.chrome = originalChrome;
		window.close = originalWindowClose;
		jest.restoreAllMocks();
		jest.useRealTimers();
	});

	it('should send a message to the background script when newWebButton is clicked', () => {
		initPopup();

		newWebButton.click();

		expect(chrome.runtime.sendMessage).toHaveBeenCalledTimes(1);
		expect(chrome.runtime.sendMessage).toHaveBeenCalledWith(
			{ action: 'addNewWebsite' },
			expect.any(Function)
		);
	});

	it('should display success message and close window on successful response', async () => {
		initPopup();

		chrome.runtime.sendMessage.mockImplementationOnce((message, callback) => {
			callback({ status: 'success', message: 'Website added successfully!' });
		});

		newWebButton.click();

		expect(newWebResult.textContent).toBe('Website added successfully!');

		jest.advanceTimersByTime(2000);
		expect(newWebResult.textContent).toBe('');

		jest.advanceTimersByTime(1000);
		expect(window.close).toHaveBeenCalledTimes(1);
	});

	it('should display error message and clear it on error response', async () => {
		initPopup();

		chrome.runtime.sendMessage.mockImplementationOnce((message, callback) => {
			callback({ status: 'error', message: 'Failed to add website.' });
		});

		newWebButton.click();

		expect(newWebResult.textContent).toBe('Failed to add website.');

		jest.advanceTimersByTime(2000);
		expect(newWebResult.textContent).toBe('');

		expect(window.close).not.toHaveBeenCalled();
	});
});
