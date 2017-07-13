function openSettings () {
	chrome.runtime.openOptionsPage();
	window.close();
};

function openClient () {
	var url = localStorage["url"] || "";
	chrome.windows.create({
		url: "webclient/lnd.html?endpoint=" + encodeURIComponent(url),
		type: "normal",
		focused: true
	});
	window.close();
};

document.addEventListener("DOMContentLoaded", function () {
	document.querySelector("#menu-settings").addEventListener("click", openSettings);
	document.querySelector("#menu-client").addEventListener("click", openClient);
});