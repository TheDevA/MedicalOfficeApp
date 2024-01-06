// importing 3 party modules
const bcrypt = require("bcrypt");
const PDFDocument = require("pdfkit");
const QRCode = require("qrcode");
const fs = require("fs");


// function to clean input
function objCleanup(obj) {
  let newObj = {};
  for (const key in obj) {
    newObj[key] = obj[key].toString().trim();
  }
  return newObj;
}

// function to check name validity
function chckName(Name, LName) {
  if (Name.length > 0 && LName.length > 0) {
    return true;
  } else {
    return false;
  }
}

// function to check email validity
function chckEmail(Email) {
  const regex = /\S+@\S+\.\S+/;
  if (regex.test(Email)) {
    return true;
  } else {
    return false;
  }
}

// function to check id validity
function chckID(Id) {
  const regex = /\d{9}/;
  if (regex.test(Id) && Id.length < 10) {
    return true;
  } else {
    return false;
  }
}

// function to check age validity
function chckAge(Age) {
  const regex = /\d{1,3}/;
  if (regex.test(Age) && Age.length < 4) {
    return true;
  } else {
    return false;
  }
}

// function to check password validity
function chckPass(Pass, Rpass) {
  if (Pass.length > 8 && Pass.localeCompare(Rpass) == 0) {
    return true;
  } else {
    return false;
  }
}

// function to check address,state,city validity
function chckLoc(Address, State, City) {
  const regex = /\d{2}/;
  if (
    Address.length > 0 &&
    State.length > 0 &&
    regex.test(State) &&
    City.length > 0
  ) {
    return true;
  } else {
    return false;
  }
}

// function to check user type validity
function chckUserType(Type) {
  if (Type == "D" || Type == "P") {
    return true;
  } else {
    return false;
  }
}

// function to check input validity
function secCheck(input) {
  let state = 0;
  let name = chckName(input.name, input.lastname);
  let age = chckAge(input.age);
  let email = chckEmail(input.email);
  let id = chckID(input.id);
  let pass = chckPass(input.password, input.rpassword);
  let loc = chckLoc(input.address, input.state, input.city);
  let type = chckUserType(input.type);

  if (email && id && pass && loc && type && age) {
    state = 1;
  }
  return {
    state: state,
    res: [name, email, id, pass, loc, type, age],
  };
}

// function to hash password
async function hash(pass) {
  const slatround = 10;
  try {
    let hash = await bcrypt.hash(pass, slatround);
    return hash;
  } catch (e) {
    console.log(e);
  }
}

// function to compare hashed password and plain text
async function compHash(pass, hash) {
  try {
    let res = await bcrypt.compare(pass, hash);
    return res;
  } catch (e) {
    console.log(e);
  }
}

// class to generate user 
class User {
  constructor(body) {
    this.body = objCleanup(body);
    this.email = this.body.email;
    this.name = this.body.name;
    this.lastname = this.body.lastname;
    this.password = this.body.password;
    this.id = this.body.id;
    this.address = this.body.address;
    this.city = this.body.city;
    this.state = this.body.state;
    this.type = this.body.type;
    this.bt = this.body.bt;
    this.age = this.body.age;
  }
  async createUser() {
    let uuid = this.type + this.state + Math.floor(Math.random() * 10000000);
    return {
      uuid: uuid,
      name: this.name,
      lastname: this.lastname,
      id:this.id,
      age: this.age,
      address: this.address,
      city: this.city,
      state: this.state,
      type: this.type,
      email: this.email,
      password: await hash(this.password),
      bt: this.bt,
    };
  }
}

// function to create pdfs of the user
async function createPDF(userData) {
  let today = new Date();
  let dd = String(today.getDate()).padStart(2, "0");
  let mm = String(today.getMonth() + 1).padStart(2, "0");
  let yyyy = today.getFullYear();
  today = mm + "/" + dd + "/" + yyyy;
  let pdfData = objCleanup(userData);
  let qrCodeImg = await QRCode.toDataURL(
    `https://${pdfData.url}/user/${pdfData.uuid}`,
  );
  const doc = new PDFDocument({ font: "Helvetica" });
  let pdfTitle = pdfData.type == "P" ? "Patient" : "Doctor";
  doc.pipe(fs.createWriteStream(process.cwd() + `/pdfs/${pdfData.uuid}.pdf`));
  doc.fontSize(25).font("Helvetica-Bold").text(`${pdfTitle} Certificate`, {
    align: "center",
  });
  doc.moveDown(2);
  doc.rect(doc.x, doc.y, 470, 175).stroke();
  doc.moveDown();
  doc
    .fontSize(15)
    .font("Helvetica-Bold")
    .text("Name: ", doc.x + 10, doc.y, { continued: true })
    .font("Helvetica")
    .text(pdfData.name);
  doc
    .fontSize(15)
    .font("Helvetica-Bold")
    .text("Last Name: ", { continued: true })
    .font("Helvetica")
    .text(pdfData.lastname);
  doc
    .fontSize(15)
    .font("Helvetica-Bold")
    .text("Age: ", { continued: true })
    .font("Helvetica")
    .text(pdfData.age);
  doc
    .fontSize(15)
    .font("Helvetica-Bold")
    .text("Blood Type: ", { continued: true })
    .font("Helvetica")
    .text(pdfData.bt);
  doc
    .fontSize(15)
    .font("Helvetica-Bold")
    .text("Address: ", { continued: true })
    .font("Helvetica")
    .text(pdfData.address);
  doc
    .fontSize(15)
    .font("Helvetica-Bold")
    .text("City: ", { continued: true })
    .font("Helvetica")
    .text(pdfData.city);
  doc
    .fontSize(15)
    .font("Helvetica-Bold")
    .text("State: ", { continued: true })
    .font("Helvetica")
    .text(pdfData.state);
  doc
    .fontSize(15)
    .font("Helvetica")
    .text(
      `  This is to certify that ${pdfData.name} ${pdfData.lastname} has been registered with clinic as a ${pdfTitle}. And for this certification to be used under what the law allows.`,
      doc.x,
      350,
    );
  doc
    .fontSize(12)
    .font("Helvetica")
    .text("Created on: " + today, doc.x, 650, {
      align: "right",
    });
  doc.addPage();
  doc.rect(10, 10, 250, 150).stroke();
  doc.fontSize(13).font("Helvetica-Bold").text(`${pdfTitle} Card`, 10, 20, {
    align: "center",
    width: 250,
  });
  doc.moveDown();
  doc
    .fontSize(12)
    .font("Helvetica-Bold")
    .text("Name: ", 20, doc.y, { continued: true })
    .font("Helvetica")
    .text(pdfData.name);
  doc
    .fontSize(12)
    .font("Helvetica-Bold")
    .text("Last Name: ", 20, doc.y, { continued: true })
    .font("Helvetica")
    .text(pdfData.lastname);
  doc
    .fontSize(12)
    .font("Helvetica-Bold")
    .text("Age: ", 20, doc.y, { continued: true })
    .font("Helvetica")
    .text(pdfData.age);
  doc
    .fontSize(12)
    .font("Helvetica-Bold")
    .text("BT: ", 20, doc.y, { continued: true })
    .font("Helvetica")
    .text(pdfData.bt);
  doc
    .fontSize(12)
    .font("Helvetica-Bold")
    .text("ID: ", 20, doc.y, { continued: true })
    .font("Helvetica")
    .text(pdfData.uuid);
  doc
    .fontSize(12)
    .font("Helvetica-Bold")
    .text("Type: ", 20, doc.y, { continued: true })
    .font("Helvetica")
    .text(pdfTitle);
  doc.image(qrCodeImg, 250 - 100, 160 / 2 - 40, { width: 100, height: 100 });
  doc.end();
}

module.exports = {
  secCheck,
  objCleanup,
  User,
  compHash,
  objCleanup,
  createPDF,
};
