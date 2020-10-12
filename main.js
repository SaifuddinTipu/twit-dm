const {
  Autohook,
  validateWebhook,
  validateSignature,
} = require("twitter-autohook");
const express = require("express");
const bodyParser = require("body-parser");
const http = require("http");
const session = require("express-session");
var pmrequest = require("request");
const uuid = require("uuid/v4");

const auth = require("./auth");
const socket = require("./socket");

const app = express();

require("dotenv").config();
const config = {
  token: process.env.TWITTER_ACCESS_TOKEN,
  token_secret: process.env.TWITTER_ACCESS_TOKEN_SECRET,
  consumer_key: process.env.TWITTER_CONSUMER_KEY,
  consumer_secret: process.env.TWITTER_CONSUMER_SECRET,
  env: process.env.TWITTER_WEBHOOK_ENV,
};

app.set("port", process.env.PORT);
app.set("views", __dirname + "/views");
app.set("view engine", "ejs");

app.use(express.static(__dirname + "/public"));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.use(
  session({
    secret: "keyboard cat",
    resave: false,
    saveUninitialized: true,
  })
);

function getDirectMessageRequestOptions(recipientID, messageText) {
  var dmParameters = {
    event: {
      type: "message_create",
      message_create: {
        target: {
          recipient_id: recipientID,
        },
        message_data: {
          text: messageText,
        },
      },
    },
  };

  var requestOptions = {
    url: `${process.env.POST_MESSAGE_JSON_URL}`,
    oauth: config,
    json: true,
    headers: {
      "content-type": "application/json",
    },
    body: dmParameters,
  };

  return requestOptions;
}

function sendDM(recipientID, messageText) {
  // POST request to send Direct Message
  pmrequest.post(
    getDirectMessageRequestOptions(recipientID, messageText),
    function (error, response, body) {
      if (error) {
        console.log(error);
      }
    }
  );
}
app.get("/webhook/twitter", async (request, response) => {
  // Fulfills the CRC check when Twitter sends a CRC challenge
  if (request.query.crc_token) {
    const signature = validateWebhook(request.query.crc_token, {
      consumer_secret: process.env.TWITTER_CONSUMER_SECRET,
    });
    response.json(signature);
  }
  else {
    response.status(400);
    response.send('Error: crc_token missing from request.')
  }
}
app.post("/webhook/twitter", async (request, response) => {
  //Detect incoming and outgoing DM events
  if (request.body.direct_message_events) {
    var directMessageEvent = request.body.direct_message_events[0];
    if (directMessageEvent.type == "message_create") {
      const senderUserID = directMessageEvent.message_create.sender_id;
      //const sourceAppID = directMessageEvent.message_create.source_app_id;
      const senderScreenName =
        request.body.users[directMessageEvent.message_create.sender_id].name;

      var messageText = ``;

      if (directMessageEvent.message_create.message_data.attachment) {
        messageText = `sent an attachment`;
        console.log(senderScreenName, messageText);
        sendDM(senderUserID, "You are not allowed to send attachment");
      } else {
        messageText = directMessageEvent.message_create.message_data.text;
        console.log(senderScreenName, `says`, messageText);
      }

      socket.io.emit(socket.activity_event, {
        internal_id: uuid(),
        senderUserID: senderUserID,
        senderScreenName: senderScreenName,
        messageText: messageText,
      });
    }
  }
  // Send a successful response to Twitter
  response.sendStatus(200);
});

//post direct message
const messageRoutes = require("./sendDM");
app.use(messageRoutes);

//Receive direct message events on UI
app.get("/activity", auth.basic, require("./routes/activity"));

const server = http.createServer(app);

const listener = server.listen(process.env.PORT, async () => {
  const webhookURL = `${process.env.WEBHOOK_URL}`;
  const webhook = new Autohook(config);
  await webhook.removeWebhooks();
  await webhook.start(webhookURL);
  await webhook.subscribe({
    oauth_token: config.token,
    oauth_token_secret: config.token_secret,
  });
  console.log(`Your app is listening on port ${listener.address().port}`);
});

// initialize socket.io
socket.init(server);
