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
});

angular.module("menuApp", [])
	.controller("MenuController", function() {

	var menu = this;

	menu.clients = localStorage["clients"] ? JSON.parse(localStorage["clients"]) : {};

	menu.openClient = function(client) {
		localStorage["url"] = client.endpoint;
		openClient();
	};

});