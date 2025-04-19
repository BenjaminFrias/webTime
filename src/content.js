// Get timer data from background.js
function requestTimerData() {
	chrome.runtime.sendMessage({ action: "getTimerData" }, function (response) {
		if (response) {
			console.log("Response from background: ", response);
		} else {
			console.log("ERROR in receiving from background: ", response);
		}
	});
}
requestTimerData();

// Inject custom fonts in document
function injectGoogleFonts() {
	const link = document.createElement("link");
	link.rel = "stylesheet";
	link.href =
		"https://fonts.googleapis.com/css2?family=Rubik:wght@400;600&display=swap";
	document.head.appendChild(link);
}
injectGoogleFonts();
