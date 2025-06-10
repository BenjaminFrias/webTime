document.addEventListener('DOMContentLoaded', function () {
	const form = document.getElementById('newWebForm');
	form.addEventListener('submit', function (e) {
		e.preventDefault();

		const newUrl = document.getElementById('newUrl').value;

		// Send the data to the background script
		chrome.runtime.sendMessage(
			{
				action: 'addNewWebsite',
				data: {
					newUrl: newUrl,
				},
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
