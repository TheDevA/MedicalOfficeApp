// importing 3 party modules
const express = require("express");
const fs = require("fs");
const { Server } = require("socket.io");
let cookieParser = require("cookie-parser");

// importing local modules
const db = require("./modules/db.js");
const util = require("./modules/util.js");

// creating server instance 
const app = express();
const port = process.env.PORT || 3000; 
const server = app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});

// creating sockeit io server
const io = new Server(server);

// seting up express
app.use(express.static("public"));
app.use(express.json());
app.use(cookieParser());

// Calls for Express JS

// managing call for /
app.get("/", (req, res) => {
  res.redirect("/home.html");
});


// managing call for /signup
app.get("/signup", (req, res) => {
  res.redirect("/signup.html");
});

// managing call for /user/:uuid 
// and only showing user if found
app.get("/user/:uuid", (req, res) => {
  db.find(req.params)
    .then((user) => {
      if (user != null) {
        res.sendFile(__dirname + "/public/user.html");
      } else {
        res.send({ msg: "No User Found" });
      }
    })
    .catch((e) => res.send(e));
});

// managing call for /file/:uuid 
// a way to provide pdf files to the correct user 
app.get("/file/:uuid", (req, res) => {
  let cookie = req.cookies;
  let uuid = req.params.uuid;
  db.find({ uuid: uuid }).then((user) => {
    if (
      user != null &&
      user._id == cookie.sid &&
      fs.existsSync(__dirname + `/pdfs/${uuid}.pdf`)
    ) {
      res.sendFile(__dirname + `/pdfs/${uuid}.pdf`);
    } else {
      res.send({ msg: "Access Denied" });
    }
  });
});

// Calls for Express JS

/* The legend
-objCleanup = clean the input/output -> object clean
-isThereUser = search for the user useing sid -> True/False
-secCheck = check for inputed name, password,etc.. -> state,[True/Flase]
*/

// managing socket connection 

io.on("connection", (socket) => {
  console.log(`user ${socket.id} is connected`);
  
  // handling socket disconnect
  
  socket.on("disconnect", () => console.log(`user is disconnected`));

  // handling socket login request
  /*
  The follwing socket will receive 
  {
    email: inputed email,
    password: inputed password,
  }
  */
  socket.on("loginReq", async (loginArg) => {
    let loginData = util.objCleanup(loginArg);
    let user = await db.find({ email: loginData.email });
    if (user != null) {
      let passComp = await util.compHash(loginArg.password, user.password);
      if (passComp) {
        socket.emit("loginComplite", { uuid: user.uuid, sid: user._id });
      } else {
        socket.emit("wrongPassword");
      }
    } else {
      socket.emit("userNotFound");
    }
  });

  // handling socket login request using id
  /*
  The follwing socket will receive 
  {
    email: inputed email,
    id: inputed id,
  }
  */
  socket.on("loginIDReq", async (data) => {

    let loginData = util.objCleanup(data);
    let user = await db.find({ email: loginData.email });
    if (user != null && user.id == loginData.id) {
      socket.emit("IDloginComplite", { uuid: user.uuid, sid: user._id });
    }
  });

  // handling socket sign up request
  /*
  The follwing socket will receive 
{
    name: inputed name,
    lastname: inputed last name,
    age: inputed age,
    email: inputed email,
    password: inputed password,
    rpassword: inputed password,
    id: inputed id,
    address: inputed address,
    city: inputed city,
    state: inputed state,
    type: inputed type D/P,
    bt: inputed blood type,
  }
  */
  socket.on("signUpData", (data) => {
    let secCheck = util.secCheck(data);
    if (secCheck.state == 1) {
      let user = new util.User(data);
      user.createUser().then((userinfo) => {
        db.insertOne(userinfo).then(() => {
          socket.emit("secCheck", secCheck);
        });
      });
    } else {
      socket.emit("secCheck", secCheck);
    }
  });

  
  // handling socket viweing user info request
  /*
  The follwing socket will receive 
  { 
  uuid: uuid,
  sid: sid 
  }
  */
  socket.on("viweUser", async (userData) => {
    let data = util.objCleanup(userData);
    let user = await db.find({ uuid: data.uuid });
    if (user != null) {
      let viweUserInfo = {
        viwetype: "VO",
        name: user.name,
        lastname: user.lastname,
        address: "Not available",
        city: "Not available",
        state: "Not available",
        email: "Not available",
        uuid: user.uuid,
      };
      if (user._id == data.sid) {
        viweUserInfo.viwetype = "V&E";
        viweUserInfo.address = user.address;
        viweUserInfo.city = user.city;
        viweUserInfo.state = user.state;
        viweUserInfo.email = user.email;
      }
      socket.emit("viweUserInfo", viweUserInfo);
    }
  });

  
  // handling socket pdf download request
  /*
  The follwing socket will receive 
  { 
  uuid: uuid,
  sid: sid 
  }
  */
  socket.on("downloadDocReq", async (userData) => {
    let data = util.objCleanup(userData);
    let user = await db.find({ uuid: data.uuid });
    if (user != null && user._id == data.sid) {
      user.url = socket.handshake.headers.host;
      util
        .createPDF(user)
        .then(() => socket.emit("PdfDone", { uuid: user.uuid }));
    }
  });

  // handling socket sessions request
  /*
  The follwing request gets
  { sid: sid }
  */
  socket.on("sendSessions", async (data) => {
    let dataSid = util.objCleanup(data);
    let user = await db.isThereUser(dataSid, "users");
    let res = {
      status: 0,
      type: "",
      onlineDocs: [],
    };
    if (user) {
      res.status = 1;
      res.type = user.type;
      res.onlineDocs = await db.findAll({}, "onlineDocs");
    }
    socket.emit("userSessionType", res);
  });

  // handling socket creating session request
  /*
  The follwing request gets
  {
    sid: sid,
  }
  */
  socket.on("createSessionReq", async (data) => {
    let dataSid = util.objCleanup(data);
    let user = await db.isThereUser(dataSid, "users");
    if (user && user.type == "D") {
      let areYouOnline = await db.find({ sessionId: user.uuid }, "onlineDocs");
      if (areYouOnline == null) {
        let sessionData = {
          sessionId: user.uuid,
          docName: `Dr.${user.name}`,
          queuePos: 1,
        };
        db.insertOne(sessionData, "onlineDocs").then(() =>
          socket.emit("sessionCreated"),
        );
      } else {

      }
    }
  });

  
  // handling socket joining session request
  /*
  The follwing request gets
  {
    sid: sid,
    sessionid: session id,
  }
  */
  socket.on("joinSessionReq", async (data) => {
    let joinSessionInfo = util.objCleanup(data);
    let user = await db.isThereUser(joinSessionInfo, "users");
    if (user && user.type == "P") {
      let doesThisSessionE = await db.find(
        { sessionId: joinSessionInfo.sessionid },
        "onlineDocs",
      );
      if (doesThisSessionE != null) {
        let queuePos = 1;
        let queue = await db.find(
          { sessionId: joinSessionInfo.sessionid },
          "queue",
          { sort: { queuePos: -1 } },
        );
        if (queue != null) {
          queuePos = queue.queuePos + 1;
        }
        let userQueueInfo = {
          sessionId: joinSessionInfo.sessionid,
          userId: user._id.toString(),
          queuePos: queuePos,
          turn: false,
        };
        await db
          .updateOne(
            { userId: user._id.toString() },
            userQueueInfo,
            true,
            "queue",
          )
          .then(() => socket.emit("sessionCreated"));
      }
    }
  });


  // handling socket refreshing session request
  /*
    The follwing request gets
  {
      sid: sid,
  }
  */
  socket.on("sessionRefresh", async (data) => {
    let SessionRdata = util.objCleanup(data);
    let user = await db.isThereUser(SessionRdata, "users");

    if (user) {
      if (user.type == "D") {
        let sessionD = await db.find({ sessionId: user.uuid }, "onlineDocs");
        if (sessionD != null) {
          let queue = await db.findAll({ sessionId: user.uuid }, "queue");
          let doctorSessionRefresh = {
            queueSize: queue.length,
            cqueuepos: sessionD.queuePos,
          };
          //send doctor
          socket.emit("doctorSessionRefresh", doctorSessionRefresh);
        } else {
          socket.emit("youNeedTojoin");
        }
      } else {
        let userInqueue = await db.find(
          { userId: user._id.toString() },
          "queue",
        );
        if (userInqueue != null) {
          let queue = await db.findAll(
            { sessionId: userInqueue.sessionId },
            "queue",
          );
          let sessionP = await db.find(
            { sessionId: userInqueue.sessionId },
            "onlineDocs",
          );
          let paitSessionRefresh = {
            queueSize: queue.length,
            cqueuepos: userInqueue.queuePos,
            now: sessionP.queuePos,
            turn: false,
          };
          if (
            userInqueue != null &&
            userInqueue.queuePos == sessionP.queuePos
          ) {
            paitSessionRefresh.turn = true;
          }
          //send the pait
          socket.emit("paitSessionRefresh", paitSessionRefresh);
        } else {
          socket.emit("youNeedTojoin");
        }
      }
    }
  });

  
  // handling socket moving queue request
  /*
  The follwing request gets
  {
    sid: sid,
  }
  */
  socket.on("nextUser", async (data) => {
    let Sessiondata = util.objCleanup(data);
    let user = await db.isThereUser(Sessiondata, "users");
    if (user != null && user.type == "D") {
      let session = await db.find({ sessionId: user.uuid }, "onlineDocs");
      if (session != null) {
        let queue = await db.findAll({ sessionId: user.uuid }, "queue", {
          sort: { queuePos: 1 },
        });
        if (queue.length > 0) {
          if (session.queuePos < queue[0].queuePos) {
            await db.updateOne(
              { sessionId: user.uuid },
              { queuePos: queue[0].queuePos },
              false,
              "onlineDocs",
            );
          } else {
            await db.updateOne(
              { sessionId: user.uuid },
              { queuePos: session.queuePos + 1 },
              false,
              "onlineDocs",
            );
            db.deleteOne(
              { sessionId: user.uuid, queuePos: queue[0].queuePos },
              "queue",
            ).then(() => socket.emit("queueUpdated"));
          }
        } else {
          await db.deleteOne({ sessionId: user.uuid }, "onlineDocs");
        }
      } else {
        socket.emit("youNeedTojoin");
      }
    }
  });
});
