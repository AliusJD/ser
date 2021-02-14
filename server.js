const express = require('express')
const app = express()
var MongoClient = require('mongodb').MongoClient
const dbName = 'gymme_dev'
const url = 'mongodb://mongodev:Covid2020!@95.110.131.172:27017/gymme_dev'
var multer = require('multer');
var upload = multer();

// for parsing application/x-www-form-urlencoded
app.use(express.urlencoded({ extended: true }));

app.use(upload.array());

// for parsing application/json
app.use(express.json({limit: '50mb'}));
app.use(express.urlencoded({limit: '50mb'}));

var db

MongoClient.connect(url, function (err, client) {
  if (err) return console.log(err)
  db = client.db(dbName)
  console.log(`Connected MongoDB: ${url}`)
  console.log(`Database: ${dbName}`)
})

// on the request to root (localhost:3000/)
app.get('/', function (req, res) {
  res.send('My first express http server');
});


app.get('/trainingCards', function (req, res) {
  let userId = req.query.userId;
  const query = { uid: userId };
  db.collection('users').findOne(query, { projection: { _id: 0, cards: 1 } })
    .then(results => {
      console.log(results)
      res.send(results);
    })
    .catch(error => console.error(error))

});

// Parte Calendario
app.get('/eventCalendar', function (req, res) {
  let test = req.query.uid;
  console.log(test)
  const query = { uid: test };
  db.collection('eventi').findOne(query)
    .then(results => {
      console.log(results)
      res.send(results);
    })
    .catch(error => console.error(error))

});


app.post('/uploadEvent', function (req, res) {
  console.log(req.body)
  let userId = req.body.userId;
  let evento = req.body.evento;
  let giorno = req.body.giorno;
  let strQuery = "impegni."+giorno;
  var upVal = {};
  upVal[strQuery] = evento;
  db.collection('eventi').updateOne({ uid: userId }, { "$push": upVal })
    .then(results => {
      res.send(results);
    })
    .catch(error => console.error(error))
});

app.post('/deleteEvent', function (req, res) {
  console.log(req.body)
  let userId = req.body.userId;
  let evento = req.body.evento;
  let giorno = req.body.giorno; 
  let idEvento = req.body.id;
  let strQuery = "impegni."+giorno;
  var upVal = {};
  var upVar2 = {id: idEvento};
  upVal[strQuery] = upVar2;
  console.log(upVal);
  db.collection('eventi').updateOne({ uid: userId }, { "$pull": upVal })
    .then(results => {
      res.send(results);
    })
    .catch(error => console.error(error))
});

app.get('/getTrainee', function (req, res) {
  let trainer = req.query.uid;
  console.log(trainer)
  const query = { "contacts.0" : trainer };
  db.collection('users').find(query,{ projection: { contacts : 0}}).toArray()
    .then(results => {
      console.log(results)
      res.send(results);
    })
    .catch(error => console.error(error))

});
// Fine parte Calendario

app.post('/uploadCard', function (req, res) {
  let userId = req.body.userId;
  let file = req.body.file;
  db.collection('users').updateOne({ uid: userId }, { $push: { cards: file } })
    .then(results => {
      res.send(results);
    })
    .catch(error => console.error(error))
});

//Chat
app.get('/chats', function (req, res) {
  let channelId = req.query._id;
  const query = { _id: channelId };
  db.collection('channels').findOne(query)
      .then(results => {
        res.send(results);
      })
      .catch(error => console.error(error))
});

app.post('/sendMessage', function (req, res) {
    let channelId = req.body._id;
    let message = req.body.message;
    db.collection('channels').updateOne({ _id: channelId }, { $push: { messages : message }})
        .then(results => {
            res.send(results);
        })
        .catch(error => console.error(error))
});

//Users
app.get('/user', function (req, res) {
    let uid = req.query.uid;
    const query = { uid: uid };
    db.collection('users').findOne(query)
        .then(results => {
            res.send(results);
        })
        .catch(error => console.error(error))
});

// Change the 404 message modifing the middleware
app.use(function (req, res, next) {
  res.status(404).send("Sorry, that route doesn't exist. Have a nice day :)");
});

// start the server in the port 3000 !
// To change when deploy on Linux Server 
app.listen(3000);

