function openSettings () {
	chrome.runtime.openOptionsPage();
	window.close();
};

function openClient (endpoint) {
	chrome.windows.create({
		url: "webclient/lnd.html?endpoint=" + encodeURIComponent(endpoint),
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
		openClient(client.endpoint);
	};

});