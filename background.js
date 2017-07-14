var lnAuths = {};

var webClients = localStorage["clients"] ? JSON.parse(localStorage["clients"]) : {};

const LNREALMS_REGEXP = "^ln(payreq|sign|signpayreq):";

function getWebClientFromUrl(url) {
	for (var endpointProp in webClients) {
		if (webClients.hasOwnProperty(endpointProp)) {
			if (url.startsWith(endpointProp)) {
				return webClients[endpointProp];
			}
		}
	}
	return null;
}

function webClientSocketHandshakeListenerFunction (details) {
	console.log("onBeforeSendHeaders webclient", details);
	var webClient = getWebClientFromUrl(details.url);
	if (webClient) {
		details.requestHeaders.push({
			name: "Authorization",
			value: "Basic " + btoa(webClient.login + ":" + webClient.password)
		});
		return { requestHeaders: details.requestHeaders };
	}
}

function webClientAuthenticateListenerFunction (details, callback) {
	console.log("onAuthRequired webclient", details);
	var re = new RegExp(LNREALMS_REGEXP, "i");
	if (re.test(details.realm)) { // handled by other listener
		callback();
	} else {
		var webClient = getWebClientFromUrl(details.url);
		if (webClient) {
			callback({ authCredentials: { username: webClient.login, password: webClient.password }});
		} else {
			callback();
		}
	}
}

function getWebClientListenerUrls (suffix) {
	var urls = [];
	for (var endpointProp in webClients) {
		if (webClients.hasOwnProperty(endpointProp)) {
			urls.push(endpointProp + suffix);
		}
	}
	return urls;
}

function refreshWebClientContext () {
	webClients = localStorage["clients"] ? JSON.parse(localStorage["clients"]) : {};
	chrome.webRequest.onBeforeSendHeaders.removeListener(
			webClientSocketHandshakeListenerFunction); // Remove existing listener
	chrome.webRequest.onBeforeSendHeaders.addListener(
			webClientSocketHandshakeListenerFunction,
			{ urls: getWebClientListenerUrls("/socket.io/*") },
			[ "blocking", "requestHeaders" ]);
	chrome.webRequest.onAuthRequired.removeListener(
			webClientAuthenticateListenerFunction); // Remove existing listener
	chrome.webRequest.onAuthRequired.addListener(
			webClientAuthenticateListenerFunction,
			{ urls: getWebClientListenerUrls("/*") },
			[ "asyncBlocking", "responseHeaders" ]);
}

refreshWebClientContext ();

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
		callback({ authCredentials: { username: lnAuth.proof[0], password: lnAuth.proof[1] }});
	} else {
		callback({ cancel: true });
	}
}

chrome.webRequest.onAuthRequired.addListener(function (details, callback) {
	console.log("onAuthRequired default", details);
	var re = new RegExp(LNREALMS_REGEXP, "i");
	if (re.test(details.realm)) {
		var requestId = details.requestId;
		if (details.realm.startsWith("lnpayreq:")) {
			lnAuths[requestId] = { requestId: requestId, running: true };
			var payreq = details.realm.substr(9);
			var url = "payment.html?payreq=" + encodeURIComponent(payreq) + "&request=" + requestId;
			chrome.windows.create({
				url: url,
				type: "popup",
				width:600,
				height: 480,
				left: 300,
				top: 150,
				focused: true
			});
			waitForAuthValidation(requestId, callback);
			return;
		} else if (details.realm.startsWith("lnsign:")) {
			lnAuths[requestId] = { requestId: requestId, running: true };
			var message = details.realm.substr(7);
			var url = "signature.html?message=" + encodeURIComponent(message) + "&request=" + requestId;
			chrome.windows.create({
				url: url,
				type: "popup",
				width:600,
				height: 400,
				left: 300,
				top: 150,
				focused: true
			});
			waitForAuthValidation(requestId, callback);
			return;
		} else if (details.realm.startsWith("lnsignpayreq:")) {
			lnAuths[requestId] = { requestId: requestId, running: true };
			var payreq = details.realm.substr(13);
			var url = "signpayreq.html?payreq=" + encodeURIComponent(payreq) + "&request=" + requestId;
			chrome.windows.create({
				url: url,
				type: "popup",
				width:600,
				height: 620,
				left: 300,
				top: 120,
				focused: true
			});
			waitForAuthValidation(requestId, callback);
			return;
		}
	}
	callback();
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
		} else if (request.state === "refresh") {
			refreshWebClientContext();
		}
	}
);
