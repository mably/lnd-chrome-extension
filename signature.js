function getParameterByName(name, url) {
	if (!url) url = window.location.href;
	name = name.replace(/[\[\]]/g, "\\$&");
	var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
		results = regex.exec(url);
	if (!results) return null;
	if (!results[2]) return '';
	return decodeURIComponent(results[2].replace(/\+/g, " "));
}

var requestId;
var message;
var signature;

function validate() {
	chrome.runtime.sendMessage({ state: "validated", reqid: requestId, proof: signature }, function (response) {
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
	var url = localStorage["url"] || "";
	var login = localStorage["login"] || "";
	var pwd = localStorage["password"] || "";
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

function initDialog () {
	requestId = getParameterByName("request");
	message = getParameterByName("message");
	document.querySelector("#signature-message").innerHTML = message;
	signMessage();
}

document.addEventListener("DOMContentLoaded", function () {
	document.querySelector("#validate-button").addEventListener("click", validate);
	document.querySelector("#cancel-button").addEventListener("click", cancel);
	initDialog();
});

window.onunload = function (event) {
	chrome.runtime.sendMessage({ state: "closed", reqid: requestId });
};
