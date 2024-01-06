const form = document.querySelector("#signupForm");
const userP = document.querySelector("#userP");
const inputState = document.querySelector("#inputState");
const socket = io();
const ids = [
  ".Name",
  ".inputEmail",
  ".inputId",
  ".inputPassword",
  ".loc",
  ".userType",
  ".inputAge",
];
window.onload = () => {
  for (let i = 2; i < 59; i++) {
    let option = document.createElement("option");
    option.value = i.toString().padStart(2, "0");
    option.text = i.toString().padStart(2, "0");
    inputState.appendChild(option);
  }
};

form.addEventListener("submit", (e) => {
  e.preventDefault();
  let fd = new FormData(e.target);
  let userData = {
    name: fd.get("name"),
    lastname: fd.get("lname"),
    age: fd.get("age"),
    email: fd.get("emile"),
    password: fd.get("password"),
    rpassword: fd.get("Rpassword"),
    id: fd.get("id"),
    address: fd.get("address"),
    city: fd.get("city"),
    state: fd.get("state"),
    type: userP.checked ? "P" : "D",
    bt: fd.get("bloodType"),
  };
  socket.emit("signUpData", userData);
});
socket.on("secCheck", (data) => {
  for (let i = 0; i < data.res.length; i++) {
    if (!data.res[i]) {
      for (let ele of document.querySelectorAll(ids[i])) {
        ele.classList.remove("is-valid");
        ele.classList.add("is-invalid");
      }
    } else {
      for (let ele of document.querySelectorAll(ids[i])) {
        ele.classList.remove("is-invalid");
        ele.classList.add("is-valid");
      }
    }
  }
  for (let ele of document.querySelectorAll(ids[data.res.indexOf(false)])) {
    ele.classList.add("is-invalid");
  }
  if (data.state == 1) {
    window.location.href = "/";
  }
});
