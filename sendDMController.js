require("dotenv").config();
const request = require("request");
const oAuthConfig = {
  token: process.env.TWITTER_ACCESS_TOKEN,
  token_secret: process.env.TWITTER_ACCESS_TOKEN_SECRET,
  consumer_key: process.env.TWITTER_CONSUMER_KEY,
  consumer_secret: process.env.TWITTER_CONSUMER_SECRET,
};

exports.sendMessage = (req, res, next) => {
  var sender_id = req.body.sender_id;
  var chat = req.body.chat;
  // direct message request body
  var dm_params = {
    event: {
      type: "message_create",
      message_create: {
        target: {
          recipient_id: sender_id,
        },
        message_data: {
          text: chat,
        },
      },
    },
  };

  // request options
  var request_options = {
    url: "https://api.twitter.com/1.1/direct_messages/events/new.json",
    oauth: oAuthConfig,
    json: true,
    headers: {
      "content-type": "application/json",
    },
    body: dm_params,
  };

  // POST request to send Direct Message
  request.post(request_options, function (error, response, body) {
    console.log("Message sent..!");
  });
  res.redirect("/activity");
};
