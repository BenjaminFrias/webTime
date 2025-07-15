document.addEventListener('DOMContentLoaded', () => {
	const newWebBtn = document.querySelector('#newWebButton');
	const resultMessage = document.querySelector('#result');
	const setLimitForm = document.querySelector('#limitForm');
	const hoursLimit = document.querySelector('#hoursLimit');
	const minsLimit = document.querySelector('#minsLimit');
	const removeLimitBtn = document.querySelector('#remove-limit-btn');
	const stopTrackingBtn = document.querySelector('#stopTrackingBtn');
	const addNewWebSection = document.querySelector('.section.new-web');
	const stopTrackingSection = document.querySelector('.section.stop-tracking');
	const removeLimitSection = document.querySelector('.section.remove-limit');
	const addLimitSection = document.querySelector('.section.add-limit');
	const limitTimeText = document.querySelector('#limit-text');

	togglePopUpActions();

	newWebBtn.addEventListener('click', () => {
		chrome.runtime.sendMessage(
			{
				action: 'addNewWebsite',
			},
			function (response) {
				if (response && response.status === 'success') {
					togglePopUpActions();

					resultMessage.textContent = response.message;
					setTimeout(() => {
						resultMessage.textContent = '';
					}, 2000);

					setTimeout(() => {
						window.close();
					}, 2000);
				} else {
					resultMessage.textContent = response.message;
					setTimeout(() => {
						resultMessage.textContent = '';
					}, 2000);
				}
			}
		);
	});

	stopTrackingBtn.addEventListener('click', () => {
		chrome.runtime.sendMessage(
			{
				action: 'requestRemove',
				removalType: 'timer',
			},
			function (response) {
				if (response && response.status === 'success') {
					togglePopUpActions();

					resultMessage.textContent = response.message;
					setTimeout(() => {
						resultMessage.textContent = '';
					}, 5000);

					setTimeout(() => {
						window.close();
					}, 5000);
				} else {
					resultMessage.textContent = response.message;
					setTimeout(() => {
						resultMessage.textContent = '';
					}, 5000);
				}
			}
		);
	});

	setLimitForm.addEventListener('submit', (e) => {
		e.preventDefault();

		if (!hoursLimit || !minsLimit) {
			return;
		}

		const timeLimit = {
			hoursLimit: hoursLimit.value,
			minsLimit: minsLimit.value,
		};

		chrome.runtime.sendMessage(
			{
				action: 'addTimeLimit',
				timeLimit: timeLimit,
			},
			function (response) {
				if (response && response.status === 'success') {
					togglePopUpActions();

					resultMessage.textContent = response.message;
					setTimeout(() => {
						resultMessage.textContent = '';
					}, 5000);

					setTimeout(() => {
						window.close();
					}, 5000);
				} else {
					resultMessage.textContent = response.message;
				}
			}
		);
	});

	removeLimitBtn.addEventListener('click', () => {
		chrome.runtime.sendMessage(
			{
				action: 'requestRemove',
				removalType: 'limit',
			},
			function (response) {
				if (response && response.status === 'success') {
					togglePopUpActions();

					resultMessage.textContent = response.message;
					setTimeout(() => {
						resultMessage.textContent = '';
					}, 5000);

					setTimeout(() => {
						window.close();
					}, 5000);
				} else {
					resultMessage.textContent = response.message;
					setTimeout(() => {
						resultMessage.textContent = '';
					}, 5000);
				}
			}
		);
	});

	function togglePopUpActions() {
		chrome.runtime.sendMessage(
			{
				action: 'getCurrentTabInfo',
			},
			function (response) {
				if (response && response.status === 'success') {
					// toggle data
					addNewWebSection.classList.remove('hidden');
					removeLimitSection.classList.remove('hidden');
					addLimitSection.classList.remove('hidden');
					stopTrackingSection.classList.remove('hidden');

					if (!response.data.isTracked) {
						// Is not tracked
						addNewWebSection.classList.remove('hidden');
						removeLimitSection.classList.add('hidden');
						addLimitSection.classList.add('hidden');
						stopTrackingSection.classList.add('hidden');
					} else if (!response.data.isLimited) {
						// Url is being tracked but doesn't has a limit
						addNewWebSection.classList.add('hidden');
						removeLimitSection.classList.add('hidden');
						addLimitSection.classList.remove('hidden');
						stopTrackingSection.classList.remove('hidden');
					} else {
						// Url is being tracked and has a limit
						removeLimitSection.classList.remove('hidden');
						stopTrackingSection.classList.remove('hidden');
						addNewWebSection.classList.add('hidden');
						addLimitSection.classList.add('hidden');

						// Show timer in remove limit

						const { hours, minutes } = response.data.isLimited;
						let formmatedMin = minutes <= 9 ? `0${minutes}` : minutes;

						if (hours > 0) {
							limitTimeText.textContent += `${hours}h ${formmatedMin}min`;
						} else {
							limitTimeText.textContent += `${formmatedMin}min`;
						}
					}
				} else {
					resultMessage.textContent = response.message;
					setTimeout(() => {
						resultMessage.textContent = '';
					}, 5000);
				}
			}
		);
	}
});
