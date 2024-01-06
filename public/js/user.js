const socket = io();
const actionBtn = document.querySelectorAll(".actionBtn");
const uuid = window.location.pathname.split("/").pop();
const sid = document.cookie
  .split("; ")
  .find((row) => row.startsWith("sid="))
  ?.split("=")[1];
function select(id) {
  if (id.startsWith("#")) {
    return document.querySelector(id);
  } else {
    return document.querySelectorAll(id);
  }
}

if (uuid.startsWith("D")) {
  document.body.style = "background-color:#7BD3EA";
  select("#type").textContent = "Viewing Doctor";
} else {
  document.body.style = "background-color:#A1EEBD";
  select("#type").textContent = "Viewing Patient";
}

let userData = { uuid: uuid, sid: sid };
socket.emit("viweUser", userData);

socket.on("viweUserInfo", (viweInfo) => {
  if (viweInfo.viwetype != "V&E") {
    for (let btn of actionBtn) {
      btn.disabled = "true";
    }
  }
  select("#name").textContent = viweInfo.name;
  select("#lastname").textContent = viweInfo.lastname;
  select("#uuid").textContent = viweInfo.uuid;
  select("#email").textContent = viweInfo.email;
  select("#city").textContent = viweInfo.city;
  select("#state").textContent = viweInfo.state;
  select("#address").textContent = viweInfo.address;
});

select("#downloadDoc").addEventListener("click", (e) => {
  socket.emit("downloadDocReq", { uuid: uuid, sid: sid });
});
select("#session").addEventListener("click", (e) => {
  window.location.pathname = "/session.html";
});
socket.on("PdfDone", (data) => {
  window.location.pathname = `file/${data.uuid}`;
});
