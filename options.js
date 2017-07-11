var defaultColor = "blue";

function loadOptions() {
	var urlElt = document.getElementById("url");
	urlElt.value = localStorage["url"] || "";
	var loginElt = document.getElementById("login");
	loginElt.value = localStorage["login"] || "";
	var pwdElt = document.getElementById("password");
	pwdElt.value = localStorage["password"] || "";
}

function saveOptions() {
	var url = document.getElementById("url").value;
	localStorage["url"] = url;
	var login = document.getElementById("login").value;
	localStorage["login"] = login;
	var pwd = document.getElementById("password").value;
	localStorage["password"] = pwd;
}

function resetOptions() {
	localStorage.removeItem("url");
	localStorage.removeItem("login");
	localStorage.removeItem("password");
	location.reload();
}

document.addEventListener("DOMContentLoaded", function () {
  document.querySelector("#save-button").addEventListener("click", saveOptions);
  document.querySelector("#reset-button").addEventListener("click", resetOptions);
  loadOptions();
});