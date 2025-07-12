document.addEventListener('DOMContentLoaded', () => {
	const newWebBtn = document.querySelector('#newWebButton');
	const resultMessage = document.querySelector('#result');
	const setLimitForm = document.querySelector('#limitForm');
	const hoursLimit = document.querySelector('#hoursLimit');
	const minsLimit = document.querySelector('#minsLimit');
	const removeLimitBtn = document.querySelector('#remove-limit-btn');
	const addNewWebSection = document.querySelector('.section.new-web-container');
	const removeSection = document.querySelector('.section.remove-limit');
	const stopTrackingBtn = document.querySelector('#stopTrackingBtn');
	const addLimitSection = document.querySelector(
		'.section.add-limit-container'
	);

	newWebBtn.addEventListener('click', () => {
		chrome.runtime.sendMessage(
			{
				action: 'addNewWebsite',
			},
			function (response) {
				if (response && response.status === 'success') {
					resultMessage.textContent = response.message;
					setTimeout(() => {
						resultMessage.textContent = '';
					}, 2000);

					setTimeout(() => {
						window.close();
					}, 2000);

					addNewWebSection.classList.add('hidden');
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
				action: 'stopTracking',
			},
			function (response) {
				if (response && response.status === 'success') {
					resultMessage.textContent = response.message;
					setTimeout(() => {
						resultMessage.textContent = '';
					}, 2000);

					setTimeout(() => {
						window.close();
					}, 2000);

					// TODO: add track new website section
				} else {
					resultMessage.textContent = response.message;
					setTimeout(() => {
						resultMessage.textContent = '';
					}, 2000);
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
					resultMessage.textContent = response.message;
					setTimeout(() => {
						resultMessage.textContent = '';
					}, 2000);

					setTimeout(() => {
						window.close();
					}, 2000);

					// TODO: Hide time limit form, show remove limit button and current limit
				} else {
					resultMessage.textContent = response.message;
				}
			}
		);
	});

	removeLimitBtn.addEventListener('click', () => {
		chrome.runtime.sendMessage(
			{
				action: 'removeLimit',
			},
			function (response) {
				if (response && response.status === 'success') {
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
});
