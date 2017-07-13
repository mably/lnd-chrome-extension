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
