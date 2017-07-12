chrome.browserAction.onClicked.addListener(function (tab) {
	chrome.runtime.openOptionsPage();
});

var lnAuths = {};

function sleep(ms) {
	return new Promise(resolve => setTimeout(resolve, ms));
}

async function waitForAuthValidation(requestId, callback) {
	var lnAuth;
	while (true) {
		lnAuth = lnAuths[requestId];
		if (!lnAuth || !lnAuth.running) break;
		await sleep(100); // sleep 100 ms
	}
	if (lnAuth && lnAuth.proof) {
		callback({ authCredentials: { username: lnAuth.proof, password: "" }});
	} else {
		callback({ cancel: true });
	}
}

chrome.webRequest.onAuthRequired.addListener(function (details, callback) {
	console.log("onAuthRequired", details);
	var executeCallback = true;
	if (details.method === "GET") {
		var requestId = details.requestId;
		var headers = details.responseHeaders;
		for (var i = 0; headers && i < headers.length; ++i) {
			if (headers[i].name.toLowerCase() === "www-authenticate") {
				if (headers[i].value.substr(12, 8).toLowerCase() === "lnpayreq") {
					lnAuths[requestId] = { requestId: requestId, running: true };
					var payreq = headers[i].value.substr(21);
					var url = "payment.html?payreq=" + encodeURIComponent(payreq) + "&request=" + requestId;
					chrome.windows.create({
						url: url,
						type: "panel",
						width:600,
						height: 400,
						left: 300,
						top: 150,
						focused: true
					});
					executeCallback = false;
					waitForAuthValidation(requestId, callback);
				} else if (headers[i].value.substr(12, 6).toLowerCase() === "lnsign") {
					lnAuths[requestId] = { requestId: requestId, running: true };
					var message = headers[i].value.substr(19);
					var url = "signature.html?message=" + encodeURIComponent(message) + "&request=" + requestId;
					chrome.windows.create({
						url: url,
						type: "panel",
						width:600,
						height: 400,
						left: 300,
						top: 150,
						focused: true
					});
					executeCallback = false;
					waitForAuthValidation(requestId, callback);
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
			lnAuths[request.reqid].proof = request.proof;
			lnAuths[request.reqid].running = false;
			sendResponse({ state: "success" });
		} else if (request.state === "canceled") {
			delete lnAuths[request.reqid];
			sendResponse({ state: "success" });
		} else if (request.state === "closed") {
			if (lnAuths[request.reqid] && !lnAuths[request.reqid].proof) { // not validating
				delete lnAuths[request.reqid];
			}
		}
	}
);
