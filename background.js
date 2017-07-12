chrome.browserAction.onClicked.addListener(function (tab) {
	chrome.runtime.openOptionsPage();
});

var lnPayments = {};

function sleep(ms) {
	return new Promise(resolve => setTimeout(resolve, ms));
}

chrome.webRequest.onAuthRequired.addListener(function (details, callback) {
	console.log("onAuthRequired", details);
	var executeCallback = true;
	if (details.method === "GET") {
		var headers = details.responseHeaders;
		for (var i = 0; headers && i < headers.length; ++i) {
			if (headers[i].name.toLowerCase() === "www-authenticate") {
				if (headers[i].value.substr(12, 8).toLowerCase() === "lnpayreq") {
					lnPayments[details.requestId] = { requestId: details.requestId, running: true };
					var payreq = headers[i].value.substr(21);
					var url = "payment.html?payreq=" + encodeURIComponent(payreq) + "&request=" + details.requestId;
					chrome.windows.create({
						url: url,
						type: "panel",
						width:600,
						height: 400,
						left: 300,
						top: 150,
						focused: true
					}, function (popup) {
						console.log("popup", popup);
						lnPayments[details.requestId].popup = popup;
					});
					async function waitForPaymentValidation() {
						executeCallback = false;
						var lnPayment;
						while (true) {
							lnPayment = lnPayments[details.requestId];
							if (!lnPayment || !lnPayment.running) break;
							await sleep(100); // sleep 100 ms
						}
						if (lnPayment && lnPayment.proof) {
							callback({ authCredentials: { username: lnPayment.proof, password: "" }});
						} else {
							callback({ cancel: true });
						}
					}
					waitForPaymentValidation();
				}
			}
		}
		if (executeCallback) {
			callback();
		}
	}
}, { urls: [ "*://*/*" ] }, [ "asyncBlocking", "responseHeaders" ]);

chrome.runtime.onMessage.addListener(
	function (request, sender, sendResponse) {
		console.log("onMessage (request, sender)", request, sender);
		if (request.state === "validated") {
			lnPayments[request.reqid].proof = request.proof;
			lnPayments[request.reqid].running = false;
			sendResponse({ state: "success" });
		} else if (request.state === "canceled") {
			delete lnPayments[request.reqid];
			sendResponse({ state: "success" });
		} else if (request.state === "closed") {
			if (lnPayments[request.reqid] && !lnPayments[request.reqid].proof) { // not validating
				delete lnPayments[request.reqid];
			}
		}
	}
);
