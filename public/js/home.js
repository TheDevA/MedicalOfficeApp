const socket = io();
const form = document.querySelector("#loginForm");
const emailField = document.querySelector("#emailLogin");
const passField = document.querySelector("#passLogin");

form.addEventListener("submit", (e) => {
  e.preventDefault();
  let fd = new FormData(e.target);

  socket.emit("loginReq", {
    email: fd.get("emailLogin"),
    password: fd.get("passLogin"),
  });
});

socket.on("loginComplite", (user) => {

  passField.classList.remove("is-invalid");
  emailField.classList.remove("is-invalid");
  emailField.classList.add("is-valid");
  passField.classList.add("is-valid");
  document.cookie = `sid=${user.sid}; path=/`;
  document.location.href = `user/${user.uuid}`;
});
socket.on("wrongPassword", () => {

  passField.classList.remove("is-valid");
  passField.classList.add("is-invalid");
  emailField.classList.remove("is-invalid");
  emailField.classList.add("is-valid");
});
socket.on("userNotFound", (user) => {

  passField.classList.remove("is-valid");
  emailField.classList.remove("is-valid");
  passField.classList.add("is-invalid");
  emailField.classList.add("is-invalid");
});
