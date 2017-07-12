function getParameterByName(name, url) {
	if (!url) url = window.location.href;
	name = name.replace(/[\[\]]/g, "\\$&");
	var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
		results = regex.exec(url);
	if (!results) return null;
	if (!results[2]) return '';
	return decodeURIComponent(results[2].replace(/\+/g, " "));
}

function array2hex(byteArray) {
	// for each element, we want to get its two-digit hexadecimal representation
	const hexParts = [];
	for(let i = 0; i < byteArray.length; i++) {
		// convert value to hexadecimal
		const hex = byteArray[i].toString(16);
		// pad with zeros to length 2
		const paddedHex = ('00' + hex).slice(-2);
		// push to array
		hexParts.push(paddedHex);
	}
	// join all the hex values of the elements into a single string
	return hexParts.join('');
}

var requestId;
var paymentRequest;

function validate() {
	var url = localStorage["url"] || "";
	var login = localStorage["login"] || "";
	var pwd = localStorage["password"] || "";
	var xhr = new XMLHttpRequest();
	xhr.open("POST", url + "/api/lnd/sendpayment", true);
	xhr.setRequestHeader("Authorization", "Basic " + window.btoa(login + ":" + pwd));
	xhr.setRequestHeader("Content-Type", "application/json");
	xhr.onload = function () {
		if (xhr.status >= 200 && xhr.status < 300) {
			var paymentResponse = JSON.parse(xhr.responseText);
			console.log(paymentResponse);
			var paymentPreImage = array2hex(paymentResponse.payment_preimage.data);
			chrome.runtime.sendMessage({ state: "validated", reqid: requestId, proof: paymentPreImage }, function (response) {
				console.log("validated response", response);
				window.close();
			});
		} else {
			alert(xhr.responseText);
		}
	};
	xhr.onerror = function () {
		alert(xhr.responseText);
	};
	xhr.send(JSON.stringify({ payreq: paymentRequest }));
}

function cancel() {
	console.log("payment canceled");
	chrome.runtime.sendMessage({ state: "canceled", reqid: requestId }, function (response) {
		console.log("response", response);
		window.close();
	});
}

function decodePaymentRequest() {
	var url = localStorage["url"] || "";
	var login = localStorage["login"] || "";
	var pwd = localStorage["password"] || "";
	var xhr = new XMLHttpRequest();
	xhr.open("POST", url + "/api/lnd/decodepayreq", true);
	xhr.setRequestHeader("Authorization", "Basic " + window.btoa(login + ":" + pwd));
	xhr.setRequestHeader("Content-Type", "application/json");
	xhr.onload = function () {
		if (xhr.status >= 200 && xhr.status < 300) {
			var paymentResponse = JSON.parse(xhr.responseText);
			console.log(paymentResponse);
			document.querySelector("#payment-pubkey").innerHTML = paymentResponse.destination;
			document.querySelector("#payment-amount").innerHTML = paymentResponse.num_satoshis;
			document.querySelector("#payment-hash").innerHTML = paymentResponse.payment_hash;
		} else {
			alert(xhr.responseText);
		}
	};
	xhr.onerror = function () {
		alert(xhr.responseText);
	};
	xhr.send(JSON.stringify({ payreq: paymentRequest }));
}

function initDialog () {
	requestId = getParameterByName("request");
	paymentRequest = getParameterByName("payreq");
	document.querySelector("#payment-request").innerHTML = paymentRequest;
	decodePaymentRequest();
}

document.addEventListener("DOMContentLoaded", function () {
	document.querySelector("#validate-button").addEventListener("click", validate);
	document.querySelector("#cancel-button").addEventListener("click", cancel);
	initDialog();
});

window.onunload = function (event) {
	chrome.runtime.sendMessage({ state: "closed", reqid: requestId });
};
