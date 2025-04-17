let timerData = null;

// TODO: REFAAAAAAAACTOOOOOOORRRRRRR! => MOVE EVERYTHING TO BACKGROUND BABY AND ONLY USE THIS FOR CREATE THE ELEMENT AND GET THE TIMER INFO!
// TODO: stop timer when it's not youtube or close yt tabs
function requestTimerData() {
	chrome.runtime.sendMessage({ action: "getTimer" }, function (response) {
		if (response && response.timer) {
			console.log(response.timer);
			// Use the data received from the background script
			// timer.resetTimer();
			// const [minutes, seconds] = [
			// 	response.timer.minutes,
			// 	response.timer.seconds,
			// ];
			// timer.startTimer(minutes, seconds + 1);
		} else {
			console.log("not good response");

			// timer.startTimer();
		}
	});
}
requestTimerData();

function sendDataToBackground(data) {
	chrome.runtime.sendMessage(
		{ action: "setData", data: data },
		function (response) {
			if (response && response.success) {
				console.log("Data saved successfully in background script.", data);
			} else {
				console.error("Error saving data in background script.");
			}
		}
	);
}

// Inject custom fonts in document
function injectGoogleFonts() {
	const link = document.createElement("link");
	link.rel = "stylesheet";
	link.href =
		"https://fonts.googleapis.com/css2?family=Rubik:wght@400;600&display=swap";
	document.head.appendChild(link);
}
injectGoogleFonts();
