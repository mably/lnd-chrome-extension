var requestId;
var paymentRequest;
var messageToSign;
var signature;

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
			if (paymentResponse.error) {
				alert(paymentResponse.error);
			} else if (paymentResponse.payment_preimage) {
				var paymentPreImage = array2hex(paymentResponse.payment_preimage.data);
				chrome.runtime.sendMessage({ state: "validated", reqid: requestId, proof: [ signature, paymentPreImage ] }, function (response) {
					console.log("validated response", response);
					window.close();
				});
			}
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
	xhr.send(JSON.stringify({ msg: messageToSign }));
}

function initDialog () {
	requestId = getParameterByName("request");
	paymentRequest = getParameterByName("payreq");
	document.querySelector("#payment-request").innerHTML = paymentRequest;
	decodePaymentRequest();
	messageToSign = paymentRequest;
	document.querySelector("#signature-message").innerHTML = messageToSign;
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
