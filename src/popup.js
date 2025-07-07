document.addEventListener('DOMContentLoaded', () => {
	const newWebBtn = document.querySelector('#newWebButton');
	const resultMessage = document.querySelector('#result');
	const setLimitForm = document.querySelector('#limitForm');
	const hoursLimit = document.querySelector('#hoursLimit');
	const minsLimit = document.querySelector('#minsLimit');

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
					}, 1000);
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
					}, 1000);
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
