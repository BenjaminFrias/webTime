document.addEventListener('DOMContentLoaded', function () {
	const newWebBtn = document.querySelector('#newWebButton');
	const newWebResult = document.querySelector('#addResult');

	newWebBtn.addEventListener('click', () => {
		chrome.runtime.sendMessage(
			{
				action: 'addNewWebsite',
			},
			function (response) {
				if (response && response.status === 'success') {
					newWebResult.textContent = response.message;
					setTimeout(() => {
						newWebResult.textContent = '';
					}, 2000);

					setTimeout(() => {
						window.close();
					}, 1000);
				} else {
					newWebResult.textContent = response.message;
					setTimeout(() => {
						newWebResult.textContent = '';
					}, 2000);
				}
			}
		);
	});
});
