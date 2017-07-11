chrome.browserAction.onClicked.addListener(function (tab) {
	chrome.runtime.openOptionsPage();
});

var lnPaymentProofs = {};

chrome.webRequest.onBeforeSendHeaders.addListener(function (details) {
	var paymentProof = lnPaymentProofs[details.requestId];
	if (paymentProof) {
		console.log("onBeforeSendHeaders", details);
		delete lnPaymentProofs[details.requestId];
		var header = {
			"name": "ln-payment-proof",
			"value": paymentProof
		};
		details.requestHeaders.push(header);
	}
	return { requestHeaders: details.requestHeaders };
}, { urls: [ "*://*/*" ] }, [ "blocking", "requestHeaders" ]);

chrome.webRequest.onBeforeRedirect.addListener(function (details) {
	console.log("onBeforeRedirect", details);
}, { urls: [ "*://*/*" ] }, [ "responseHeaders" ]);

chrome.webRequest.onHeadersReceived.addListener(function (details) {
	if (details.method === "GET") {
		var headers = details.responseHeaders;
		for (var i = 0; headers && i < headers.length; ++i) {
			if (headers[i].name.toLowerCase() === "ln-payment-payreq") {
				console.log("onHeadersReceived", details);
				if (confirm("Validate LN payment?")) {
					var url = localStorage["url"] || "";
					var login = localStorage["login"] || "";
					var pwd = localStorage["password"] || "";
					var xhr = new XMLHttpRequest();
					xhr.open("POST", url + "/api/lnd/sendpayment", false);
					xhr.setRequestHeader("Authorization", "Basic " + window.btoa(login + ":" + pwd));
					xhr.setRequestHeader("Content-Type", "application/json");
					xhr.send(JSON.stringify({ payreq: headers[i].value }));
					if (xhr.status >= 200 && xhr.status < 300) {
						var paymentResponse = JSON.parse(xhr.responseText);
						console.log(paymentResponse);
						lnPaymentProofs[details.requestId] = "my-payment-proof";
						return { redirectUrl: details.url };
					} else {
						// TODO
						console.log(xhr.responseText);
					}
				}
				break;
			}
		}
	}
}, { urls: [ "*://*/*" ] }, [ "blocking", "responseHeaders" ]);
