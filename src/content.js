// Get timer data from background.js

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
	if (request.type === "background") {
		const timer = request.timer;
		console.log(timer);
	}
});

// Inject custom fonts in document
function injectGoogleFonts() {
	const link = document.createElement("link");
	link.rel = "stylesheet";
	link.href =
		"https://fonts.googleapis.com/css2?family=Rubik:wght@400;600&display=swap";
	document.head.appendChild(link);
}
injectGoogleFonts();
