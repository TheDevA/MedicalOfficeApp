// impoting mangodb modules
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");

// declaring static var for database 
const MAIN_COLLECTION = "users";
const MAIN_DB = "main_DB";
const PASS = process.env["PASS"]
const uri =
  `mongodb+srv://admin:${PASS}@cluster0.8whrnci.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

// function to find one user that matches query in specific collection and extra options
// TODO: handle error better 
async function find(query, opt,opt2) {
  let options = opt2 || {}
  let collection = opt || MAIN_COLLECTION;
  try {
    let clientM = await client.connect();
    let db = clientM.db(MAIN_DB);
    let col = db.collection(collection);
    let user = await col.findOne(query,options);
    return user;
  } catch (e) {
    throw e;
  }finally {
    await client.close();
  }
}

// function to find users that matches query in specific collection and extra options
// TODO: handle error better
async function findAll(query, opt,opt2) {
  let options = opt2 || {}
  let collection = opt || MAIN_COLLECTION;
  try {
    let docs = [];
    let clientM = await client.connect();
    let db = clientM.db(MAIN_DB);
    let col = db.collection(collection);
    let users = col.find(query,options);
    for await (const doc of users) {
      docs.push(doc);
    }
    return docs;
  } catch (e) {
    throw e;
  }finally {
    await client.close();
  }
}

// function to add one user that matches query in specific collection
// TODO: handle error better
async function insertOne(userData, opt) {
  let collection = opt || MAIN_COLLECTION;
  try {
    let clientM = await client.connect();
    let db = clientM.db(MAIN_DB);
    let col = db.collection(collection);
    let user = await col.insertOne(userData);
    return user;
  } catch (e) {
    throw e;
  }finally {
    await client.close();
  }
}

// function to update one user that matches filter in specific collection with abilty to create 
// new user if doesn't exist 
// TODO: handle error better
async function updateOne(filter, userData, upsert, opt) {
  let collection = opt || MAIN_COLLECTION;
  try {
    let clientM = await client.connect();
    let db = clientM.db(MAIN_DB);
    let col = db.collection(collection);
    let user = await col.updateOne(filter, {$set:userData}, { upsert: upsert });
    return user;
  } catch (e) {
    throw e;
  }finally {
    await client.close();
  }
}

// function to delete one user that matches filter in specific collection with extra options 
// TODO: handle error better
async function deleteOne(query, opt,opt2) {
  let options = opt2 || {}
  let collection = opt || MAIN_COLLECTION;
  try {
    let clientM = await client.connect();
    let db = clientM.db(MAIN_DB);
    let col = db.collection(collection);
    let user = await col.deleteOne(query,options);
    return user;
  } catch (e) {
    throw e;
  }finally {
    await client.close();
  }
}

// function to search for user using the sid 
// TODO: handle error better
async function isThereUser(userData, opt) {
  let id = new ObjectId(userData.sid);
  let user = await find({ _id: id }, opt);
  if (user != null) {
    return user;
  } else {
    return false;
  }
}
module.exports = { find, findAll, insertOne, ObjectId, isThereUser, updateOne,deleteOne };
