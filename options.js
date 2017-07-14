angular.module("optionsApp", [])
	.controller("ClientListController", function() {

	var clientList = this;

	clientList.clients = localStorage["clients"] ? JSON.parse(localStorage["clients"]) : {};

	clientList.removeClient = function(client) {
		delete clientList.clients[client.endpoint];
		persistAndRefresh();
	};
	
	clientList.editClient = function(client) {
		clientList.endpoint = client.endpoint;
		clientList.login = client.login;
		clientList.password = client.password;
	};

	clientList.addClient = function() {
		var client = {
			endpoint: clientList.endpoint,
			login: clientList.login,
			password: clientList.password
		};
		clientList.clients[client.endpoint] = client;
		persistAndRefresh();
		clientList.endpoint = "";
		clientList.login = "";
		clientList.password = "";
	};

	var persistAndRefresh = function () {
		localStorage["clients"] = JSON.stringify(clientList.clients);
		chrome.runtime.sendMessage({ state: "refresh" });
	};
});