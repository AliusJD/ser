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


app.post('/uploadCard', function (req, res) {
  let userId = req.body.userId;
  let file = req.body.file;
  db.collection('users').updateOne({ uid: userId }, { $push: { cards: file } })
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

