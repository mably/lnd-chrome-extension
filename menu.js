function openSettings () {
	chrome.runtime.openOptionsPage();
	window.close();
};

function openClient () {
	chrome.windows.create({
		url: "webclient/lnd.html",
		type: "popup",
		focused: true
	});
	window.close();
};

document.addEventListener("DOMContentLoaded", function () {
	document.querySelector("#menu-settings").addEventListener("click", openSettings);
	document.querySelector("#menu-client").addEventListener("click", openClient);
});
