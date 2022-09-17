const express = require("express");
const app = express();
var MongoClient = require("mongodb").MongoClient;
const dbName = "gymme";
const url =
  "mongodb+srv://gymme:Gymme2022@gymme.pypbz.mongodb.net/test?authSource=admin&replicaSet=atlas-q7k3kv-shard-0&readPreference=primary&appname=MongoDB%20Compass&ssl=true";

// for parsing application/json
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

var db;

MongoClient.connect(url, function (err, client) {
  if (err) return console.log(err);
  db = client.db(dbName);
  console.log(`Connected MongoDB: ${url}`);
  console.log(`Database: ${dbName}`);
});

// on the request to root (localhost:3000/)
app.get("/", function (req, res) {
  res.send("My first express http server");
});

app.get("/getUserInfo", function (req, res) {
  // Recupera le info base dell'utente
  let query = { uid: req.query.uid };
  db.collection("users")
    .findOne(query, { projection: { _id: 0, info: 1 } })
    .then((results) => {
      res.send(results);
    })
    .catch((error) => console.error(error));
});


app.get("/getUserContacts", async function (req, res) {
  // Recupera le info base dell'utente
  let query = { uid: req.query.uid };
  contacts = await db.collection("users").findOne(query, { projection: { _id: 0, contacts: 1 } })
  trainees =  await Promise.all(
    contacts.contacts.map( async contact => {
     return await db.collection("users").findOne({ uid: contact.uid }, { projection: { _id: 0, "info.name": 1, "info.surname": 1, "info.profilePic":1 } })
  }))
  var result = []
  Object.keys(trainees).forEach(function (key) {
    result.push(trainees[key].info)
  })
  res.send(result)
  });


  


  //*********************************************************************************** */
  app.post("/registerTrainer", function (req, res) {
    let user = req.body.user;
    let channel = req.body.channel;
    let event = req.body.event;
    let faq = req.body.faq;
    let trainingcard = req.body.trainingcard;
    let application = req.body.application;
    db.collection("users")
      .insertOne(user)
      .then((results) => {
        db.collection("channels")
          .insertOne(channel)
          .then((results) => {
            db.collection("eventi")
              .insertOne(event)
              .then((results) => {
                db.collection("faq")
                  .insertOne(faq)
                  .then((results) => {
                    db.collection("training_cards")
                      .insertOne(trainingcard)
                      .then((results) => {
                        db.collection("application")
                          .insertOne(application)
                          .then((results) => {
                            res.send(results);
                          })
                          .catch((error) => console.error(error));
                      })
                      .catch((error) => console.error(error));
                  })
                  .catch((error) => console.error(error));
              })
              .catch((error) => console.error(error));
          })
          .catch((error) => console.error(error));
      })
      .catch((error) => console.error(error));
  });

  app.post("/registerTrainee", function (req, res) {
    let user = req.body.user;
    let channel = req.body.channel;
    let application = req.body.application;
    db.collection("users")
      .insertOne(user)
      .then((results) => {
        db.collection("channels")
          .insertOne(channel)
          .then((results) => {
            db.collection("application")
              .insertOne(application)
              .then((results) => {
                res.send(results);
              })
              .catch((error) => console.error(error));
          })
          .catch((error) => console.error(error));
      })
      .catch((error) => console.error(error));
  });

  // Trainig Card
  app.get("/trainingCards", function (req, res) {
    let userId = req.query.userId;
    const query = { trainerId: userId };
    db.collection("training_cards")
      .findOne(query, {
        projection: {
          _id: 0,
          "cards.name": 1,
          "cards.trainees": 1,
          "cards.date": 1,
        },
      })
      .then((results) => {
        res.send(results);
      })
      .catch((error) => console.error(error));
  });

  // Get training card for trainees
  app.get("/traineeCards", function (req, res) {
    let trainerId = req.query.trainerId;
    let userId = req.query.userId;
    const query = { trainerId: trainerId };
    db.collection("training_cards")
      .findOne(query, {
        projection: {
          _id: 0,
          "cards.name": 1,
          "cards.trainees": 1,
          "cards.date": 1,
        },
      })
      .then((results) => {
        var cards = [];
        if (results.cards.length > 0) {
          results.cards.map((card) => {
            if (card.trainees.length > 0) {
              card.trainees.map((trainee) => {
                console.log(trainee.value);
                if (trainee.value == userId) {
                  cards.push(card);
                }
              });
            }
          });
        }
        res.send(cards);
      })
      .catch((error) => console.error(error));
  });

  app.get("/getCard", function (req, res) {
    let trainerId = req.query.trainerId;
    let date = req.query.date;
    const query = { trainerId: trainerId };
    console.log(trainerId);
    db.collection("training_cards")
      .findOne(query, {
        projection: {
          _id: 0,
          "cards.name": 1,
          "cards.content": 1,
          "cards.date": 1,
        },
      })
      .then((results) => {
        var cardContent;
        if (results.cards.length > 0) {
          results.cards.map((card) => {
            if (card.date == date) {
              cardContent = card;
            }
          });
        }
        console.log(cardContent);
        res.send(cardContent);
      })
      .catch((error) => console.error(error));
  });

  app.post("/uploadCard", function (req, res) {
    let userId = req.body.userId;
    let file = req.body.file;
    console.log(file.date);
    db.collection("training_cards")
      .updateOne({ trainerId: userId }, { $push: { cards: file } })
      .then((results) => {
        res.send(results);
      })
      .catch((error) => console.error(error));
  });

  app.post("/deleteCard", function (req, res) {
    let trainerId = req.body.trainerId;
    let filename = req.body.filename;
    console.log(trainerId);
    db.collection("training_cards")
      .updateOne(
        { trainerId: trainerId },
        { $pull: { cards: { name: filename } } }
      )
      .then((results) => {
        res.send(results);
      })
      .catch((error) => console.error(error));
  });

  app.post("/cardTrainees", function (req, res) {
    let trainerId = req.body.trainerId;
    let trainees = req.body.trainees;
    let filename = req.body.filename;
    console.log(JSON.stringify(trainees));
    db.collection("training_cards")
      .updateOne(
        { trainerId: trainerId, "cards.name": filename },
        { $set: { "cards.$.trainees": trainees } }
      )
      .then((results) => {
        res.send(results);
      })
      .catch((error) => console.error(error));
  });

  app.get("/getTrainees", function (req, res) {
    let userId = req.query.userId;
    const query = { uid: userId };
    const filter = {
      _id: 0,
      contacts: 1,
    };
    db.collection("users")
      .findOne(query, { projection: filter })
      .then((results) => {
        res.send(results);
      })
      .catch((error) => console.error(error));
  });

  // Calendar
  app.get("/eventCalendar", function (req, res) {
    let test = req.query.uid;
    console.log(test);
    const query = { uid: test };
    db.collection("eventi")
      .findOne(query)
      .then((results) => {
        console.log(results);
        res.send(results);
      })
      .catch((error) => console.error(error));
  });

  app.post("/uploadEvent", function (req, res) {
    //console.log(req.body)
    let userId = req.body.userId;
    let eventi = req.body.eventi;
    let strQuery = "";
    var upVal = {};
    Object.keys(eventi).forEach((key) => {
      strQuery = "impegni." + key;
      upVal[strQuery] = eventi[key];
    });

    db.collection("eventi")
      .updateOne({ uid: userId }, { $push: upVal })
      .then((results) => {
        res.send(results);
      })
      .catch((error) => console.error(error));
  });

  app.post("/deleteEvent", function (req, res) {
    console.log(req.body);
    let userId = req.body.userId;
    let giorno = req.body.giorno;
    let eventi = req.body.eventi;
    let idEvento = req.body.evento.id;
    let idRip = req.body.evento.idRip;
    let tipo = req.body.tipo;

    let upVal = {};
    let strQuery = "";
    let upVar2 = {};
    if (tipo == "none") {
      strQuery = "impegni." + giorno;
      upVar2 = { id: idEvento };
      upVal[strQuery] = upVar2;
    } else {
      Object.keys(eventi).forEach((key) => {
        strQuery = "impegni." + key;
        upVar2 = { idRip: idRip };
        upVal[strQuery] = upVar2;
      });
    }

    console.log(upVal);
    db.collection("eventi")
      .updateOne({ uid: userId }, { $pull: upVal })
      .then((results) => {
        res.send(results);
      })
      .catch((error) => console.error(error));
  });

  /*
   *   getEvents recupera tutti gli eventi in cui è l'utente trainee è presente nel campo trainee
   *   PARAMS: trainerID e userID
   *   RETURN: dizionario di tutti gli eventi = "day": [array di eventi]
   */
  app.get("/getEvents", function (req, res) {
    let trainerId = req.query.trainerId;
    let userId = req.query.userId;
    db.collection("eventi")
      .find({ uid: trainerId }, { impegni: 1 })
      .toArray()
      .then((results) => {
        let filteredEvents = createEventDictionary(results[0].impegni, userId);
        res.send(filteredEvents);
      })
      .catch((error) => console.error(error));
  });

  function createEventDictionary(fullList, userId) {
    var dict = {};
    function isTraineeInside(val) {
      let isInside = val.trainee.filter((trainee) => trainee.value == userId);
      return isInside.length > 0;
    }
    for (const [key, value] of Object.entries(fullList)) {
      if (value.length > 0) {
        let env = value.filter(isTraineeInside);
        if (env.length != 0) {
          dict[key] = env;
        }
      }
    }
    return dict;
  }

  /*
   *   getUpcomingEvents recupera tutti gli eventi prossimi per il trainee (2 giorni)
   *   PARAMS: trainerID e userID
   *   RETURN: dizionario di tutti gli eventi = "day": [array di eventi]
   */
  app.get("/getUpcomingEvents", function (req, res) {
    let trainerId = req.query.trainerId;
    let userId = req.query.userId;
    db.collection("eventi")
      .find({ uid: trainerId }, { impegni: 1 })
      .toArray()
      .then((results) => {
        let filteredEvents = createEventDictionary(results[0].impegni, userId);
        let upcomingEvents = {};
        console.log(filteredEvents);
        if (Object.keys(filteredEvents).length > 2) {
          let [first, second] = Object.keys(filteredEvents);
          upcomingEvents[first] = filteredEvents[first];
          upcomingEvents[second] = filteredEvents[second];
        } else {
          upcomingEvents = filteredEvents;
        }
        res.send(upcomingEvents);
      })
      .catch((error) => console.error(error));
  });

  app.get("/getUpcomingTrainerEvents", function (req, res) {
    let userId = req.query.userId;
    db.collection("eventi")
      .find({ uid: userId }, { impegni: 1 })
      .toArray()
      .then((results) => {
        let filteredEvents = {};
        for (const [key, value] of Object.entries(results[0].impegni)) {
          if (value.length > 0) {
            filteredEvents[key] = value;
          }
        }

        let upcomingEvents = {};
        if (Object.keys(filteredEvents).length > 2) {
          let [first, second] = Object.keys(filteredEvents);
          upcomingEvents[first] = filteredEvents[first];
          upcomingEvents[second] = filteredEvents[second];
        } else {
          upcomingEvents = filteredEvents;
        }

        let result = [];
        for (let key in upcomingEvents) {
          upcomingEvents[key].forEach((element) => {
            result.push(element);
          });
        }

        res.send(result);
      })
      .catch((error) => console.error(error));
  });

  app.get("/getTrainee", function (req, res) {
    let trainer = req.query.uid;
    console.log(trainer);
    const query = { "contacts.0": trainer };
    db.collection("users")
      .find(query, { projection: { contacts: 0 } })
      .toArray()
      .then((results) => {
        console.log(results);
        res.send(results);
      })
      .catch((error) => console.error(error));
  });

  //Chat
  app.get("/chats", function (req, res) {
    let channelId = req.query._id;
    const query = { _id: channelId };
    db.collection("channels")
      .findOne(query)
      .then((results) => {
        res.send(results);
      })
      .catch((error) => console.error(error));
  });

  app.get("/chatMessages", function (req, res) {
    let channelId = req.query._id;
    const query = { _id: channelId };
    db.collection("channels")
      .findOne(query)
      .then((results) => {
        res.send(results.messages);
      })
      .catch((error) => console.error(error));
  });

  app.get("/chatImages", function (req, res) {
    let channelId = req.query._id;
    const query = { _id: channelId };
    db.collection("channels")
      .findOne(query)
      .then((results) => {
        res.send(results.messages.filter((m) => m.image !== ""));
      })
      .catch((error) => console.error(error));
  });

  app.post("/sendMessage", function (req, res) {
    let channelId = req.body._id;
    let message = req.body.message;
    db.collection("channels")
      .updateOne({ _id: channelId }, { $push: { messages: message } })
      .then((results) => {
        res.send(results);
      })
      .catch((error) => console.error(error));
  });

  //Users
  app.get("/user", function (req, res) {
    let uid = req.query.uid;
    const query = { uid: uid };
    db.collection("users")
      .findOne(query)
      .then((results) => {
        if (results.contacts) {
          results.contacts.map((user) => {
            db.collection("users")
              .findOne({ uid: user.uid }, { projection: { profile_pic: 1 } })
              .then((result) => {
                if (result) {
                  user["profile_pic"] = result.profile_pic
                    ? result.profile_pic
                    : null;
                }
              });
          });
          res.send(results);
        }
      })
      .catch((error) => console.error(error));
  });

  const getContactsPic = (contacts) => {
    contacts.map((user) => {
      db.collection("users")
        .findOne({ uid: user.uid }, { projection: { profile_pic: 1 } })
        .then((result) => {
          if (result) {
            user["picture"] = result.profile_pic ? result.profile_pic : null;
          }
        });
    });
  };

  app.post("/updateDescription", function (req, res) {
    let uid = req.body.uid;
    let description = req.body.description;
    console.log("uid: " + uid);
    console.log("descrizione: " + description);
    db.collection("users")
      .updateOne({ uid: uid }, { $set: { description: description } })
      .then((results) => {
        res.send(results);
      })
      .catch((error) => console.error(error));
  });

  app.post("/updateFormazione", function (req, res) {
    let uid = req.body.uid;
    let formazione = req.body.formazione;
    console.log("uid: " + uid);
    console.log("formazione: " + formazione);
    db.collection("users")
      .updateOne({ uid: uid }, { $set: { formazione: formazione } })
      .then((results) => {
        res.send(results);
      })
      .catch((error) => console.error(error));
  });

  app.post("/updatePicture", function (req, res) {
    let uid = req.body.uid;
    let profile_pic = req.body.profile_pic;
    console.log("uid: " + uid);
    db.collection("users")
      .updateOne({ uid: uid }, { $set: { profile_pic: profile_pic } })
      .then((results) => {
        res.send(results);
      })
      .catch((error) => console.error(error));
  });

  app.post("/updatePersInfo", function (req, res) {
    let uid = req.body.uid;
    let eta = req.body.eta;
    let peso = req.body.peso;
    let altezza = req.body.altezza;
    console.log("uid: " + uid);
    db.collection("users")
      .updateOne(
        { uid: uid },
        { $set: { eta: eta, peso: peso, altezza: altezza } }
      )
      .then((results) => {
        res.send(results);
      })
      .catch((error) => console.error(error));
  });

  app.get("/faq", function (req, res) {
    let uid = req.query.uid;
    const query = { uid: uid };
    db.collection("faq")
      .findOne(query, { projection: { _id: 0, questions: 1 } })
      .then((results) => {
        res.send(results);
      })
      .catch((error) => console.error(error));
  });

  app.post("/refreshFaq", function (req, res) {
    let uid = req.body.uid;
    let questions = req.body.questions;
    console.log("uid: " + uid);
    console.log("questions: " + questions);
    db.collection("faq")
      .updateOne({ uid: uid }, { $set: { questions: questions } })
      .then((results) => {
        res.send(results);
      })
      .catch((error) => console.error(error));
  });

  // Change the 404 message modifing the middleware
  app.use(function (req, res, next) {
    res.status(404).send("Sorry, that route doesn't exist. Have a nice day :)");
  });

  // start the server in the port 3000 !
  // To change when deploy on Linux Server
  app.listen(3000);
