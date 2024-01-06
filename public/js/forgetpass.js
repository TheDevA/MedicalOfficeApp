const socket = io();
const form = document.querySelector("#loginForm");


form.addEventListener("submit", (e) => {
  e.preventDefault();
  let fd = new FormData(e.target);

  socket.emit("loginIDReq", {
    email: fd.get("emailLogin"),
    id: fd.get("idLogin"),
  });
});
socket.on("IDloginComplite", (user) => {

  document.cookie = `sid=${user.sid}; path=/`;
  document.location.href = `user/${user.uuid}`;
});
