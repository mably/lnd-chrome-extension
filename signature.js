var requestId;
var message;
var signature;

function validate() {
	chrome.runtime.sendMessage({ state: "validated", reqid: requestId, proof: [ signature, "" ] }, function (response) {
		console.log("validated response", response);
		window.close();
	});
}

function cancel() {
	console.log("signature canceled");
	chrome.runtime.sendMessage({ state: "canceled", reqid: requestId }, function (response) {
		console.log("response", response);
		window.close();
	});
}

function signMessage() {
	var client = getClient(document.querySelector("#webclient-select").value);
	var url = client.endpoint || "";
	var login = client.login || "";
	var pwd = client.password || "";
	var xhr = new XMLHttpRequest();
	xhr.open("POST", url + "/api/lnd/signmessage", true);
	xhr.setRequestHeader("Authorization", "Basic " + window.btoa(login + ":" + pwd));
	xhr.setRequestHeader("Content-Type", "application/json");
	xhr.onload = function () {
		if (xhr.status >= 200 && xhr.status < 300) {
			var signatureResponse = JSON.parse(xhr.responseText);
			console.log(signatureResponse);
			signature = signatureResponse.signature;
			document.querySelector("#signature-value").innerHTML = signature;
		} else {
			alert(xhr.responseText);
		}
	};
	xhr.onerror = function () {
		alert(xhr.responseText);
	};
	xhr.send(JSON.stringify({ msg: message }));
}

function changeClient() {
	var clientSelect = document.querySelector("#webclient-select");
	localStorage["defaultClient"] = clientSelect.value;
	refreshDialog();
}

function refreshDialog() {
	signMessage();
}

function initDialog () {
	requestId = getParameterByName("request");
	message = getParameterByName("message");
	document.querySelector("#signature-message").innerHTML = message;
	var clientSelect = document.querySelector("#webclient-select");
	for (var endpoint in webClients) {
		if (webClients.hasOwnProperty(endpoint)) {
			var client = webClients[endpoint];
			var opt = document.createElement("option");
			opt.value = client.endpoint;
			opt.innerHTML = client.endpoint;
			clientSelect.appendChild(opt);
		}
	}
	clientSelect.value = defaultClient;
	if ((clientSelect.selectedIndex < 0)  && (clientSelect.length > 0)) {
		clientSelect[0].selected = true;
	}
	refreshDialog();
}

document.addEventListener("DOMContentLoaded", function () {
	document.querySelector("#validate-button").addEventListener("click", validate);
	document.querySelector("#cancel-button").addEventListener("click", cancel);
	document.querySelector("#webclient-select").addEventListener("change", changeClient);
	initDialog();
});

window.onunload = function (event) {
	chrome.runtime.sendMessage({ state: "closed", reqid: requestId });
};
