const httpAuth = require("http-auth");

require("dotenv").config();

var auth = {};

const RequiredEnv = [
  "TWITTER_CONSUMER_KEY",
  "TWITTER_CONSUMER_SECRET",
  "TWITTER_ACCESS_TOKEN",
  "TWITTER_ACCESS_TOKEN_SECRET",
  "TWITTER_WEBHOOK_ENV",
];

if (!RequiredEnv.every((key) => typeof process.env[key] !== "undefined")) {
  console.error(
    `One of more of the required environment variables (${RequiredEnv.join(
      ", "
    )}) are not defined. Please check your environment and try again.`
  );
  process.exit(-1);
}

// twitter info
auth.twitter_oauth = {
  consumer_key: process.env.TWITTER_CONSUMER_KEY,
  consumer_secret: process.env.TWITTER_CONSUMER_SECRET,
  token: process.env.TWITTER_ACCESS_TOKEN,
  token_secret: process.env.TWITTER_ACCESS_TOKEN_SECRET,
};
auth.twitter_webhook_environment = process.env.TWITTER_WEBHOOK_ENV;

// basic auth middleware for express

if (
  typeof process.env.BASIC_AUTH_USER !== "undefined" &&
  typeof process.env.BASIC_AUTH_PASSWORD !== "undefined"
) {
  auth.basic = httpAuth.connect(
    httpAuth.basic(
      {
        realm: "admin-dashboard",
      },
      function (username, password, callback) {
        callback(
          username === process.env.BASIC_AUTH_USER &&
            password === process.env.BASIC_AUTH_PASSWORD
        );
      }
    )
  );
} else {
  console.warn(
    [
      "Your admin dashboard is accessible by everybody.",
      "To restrict access, setup BASIC_AUTH_USER and BASIC_AUTH_PASSWORD",
      "as environment variables.",
    ].join(" ")
  );
}
module.exports = auth;
