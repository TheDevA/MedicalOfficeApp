const socket = io();
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
function createTableElement(th, tds, target) {
  let trElement = document.createElement("tr");
  let thElement = document.createElement("th");
  thElement.textContent = th.value;
  thElement.scope = th.scope;
  trElement.appendChild(thElement);
  for (let td of tds) {
    let tdElement = document.createElement("td");
    tdElement.innerHTML = td.inner;
    trElement.appendChild(tdElement);
  }
  target.appendChild(trElement);
}
function updateQueueInfo(data) {
  select("#queueSize").textContent = data.queueSize;
  select("#yourQPos").textContent = data.cqueuepos;
  select("#queuePos").textContent = data.now || data.cqueuepos;
  if (data.turn) {
    select("#queuePos").textContent = "GO";
  }
}
socket.emit("sendSessions", { sid: sid });

socket.on("userSessionType", (data) => {
  if (data.status != 0) {
    select("#refSBtn").hidden = false;
    let viweType = "";
    if (data.type == "D") {
      viweType = "disabled";
      select("#createSBtn").hidden = false;
      select("#nextBtn").hidden = false;
    }
    for (let i = 0; i < data.onlineDocs.length; i++) {
      let doctor = data.onlineDocs[i];
      let th = {
        value: i + 1,
        scope: "row",
      };
      let tds = [
        {
          inner: `${doctor.docName}`,
        },
        {
          inner: `<button data-sessionid="${doctor.sessionId}" type="button" class="joinBtn btn btn-primary" ${viweType}>Join</button>`,
        },
      ];
      createTableElement(th, tds, select("#sessionTBody"));
    }
    select("#loginAlert").hidden = true;
    select("#tableCont").hidden = false;
    for (let btn of select(".joinBtn")) {
      btn.addEventListener("click", (e) => {
        let joinSessionReq = {
          sid: sid,
          sessionid: e.target.dataset.sessionid,
        };
        socket.emit("joinSessionReq", joinSessionReq);
      });
    }
  }
});
select("#createSBtn").addEventListener("click", (e) => {
  let createSessionReq = {
    sid: sid,
  };
  socket.emit("createSessionReq", createSessionReq);
});
select("#refSBtn").addEventListener("click", () =>
  socket.emit("sessionRefresh", { sid: sid }),
);
select("#nextBtn").addEventListener("click", (e) => {
  socket.emit("nextUser", {
    sid: sid,
  });
});
socket.on("sessionCreated", () => socket.emit("sessionRefresh", { sid: sid }));

socket.on("doctorSessionRefresh", (x) => {
  updateQueueInfo(x);
});
socket.on("paitSessionRefresh", (x) => {
  updateQueueInfo(x);
});
socket.on("queueUpdated", () => socket.emit("sessionRefresh", { sid: sid }));
socket.on("youNeedTojoin", () => {
  select("#queueSize").textContent = "NA";
  select("#yourQPos").textContent = "NA";
  select("#queuePos").textContent = "NA";
});
