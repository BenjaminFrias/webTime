document.addEventListener('DOMContentLoaded', function () {
	const newWebBtn = document.getElementById('newWebButton');

	newWebBtn.addEventListener('click', () => {
		chrome.runtime.sendMessage(
			{
				action: 'addNewWebsite',
			},
			function (response) {
				if (response && response.status === 'success') {
					// TODO: Show message to user
					console.log(response.message);
					window.close();
				} else {
					console.error('Failed to send form data to background.');
				}
			}
		);
	});
});
