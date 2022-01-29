require("dotenv").config();
process.env.NTBA_FIX_319 = 1;

const https = require("https");
const fs = require("fs");
const path = require("path");

const express = require("express");
const bodyParser = require("body-parser");
const TelegramBot = require("node-telegram-bot-api");

const httpsOptions = {
  key: fs.readFileSync("./ssl/kill-the-zero_net.key"),
  cert: fs.readFileSync("./ssl/kill-the-zero_net__crt.pem"),
  ca: fs.readFileSync("./ssl/kill-the-zero_net__ca.pem"),
};

const { TOKEN } = process.env;
const queries = {};
const gameName = "KILLTHEZERO";

const app = express();
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, "public")));

// Create a bot that uses 'polling' to fetch new updates
const bot = new TelegramBot(TOKEN, { polling: true, canceelation: true });

// Matches "/echo [whatever]"
bot.onText(/\/echo (.+)/, (msg, match) => {
  // 'msg' is the received Message from Telegram
  // 'match' is the result of executing the regexp above on the text content
  // of the message

  const chatId = msg.chat.id;
  const resp = match[1]; // the captured "whatever"

  // send back the matched "whatever" to the chat
  bot.sendMessage(chatId, resp);
});

bot.onText(/\/start/, (msg, match) => {
  // 'msg' is the received Message from Telegram
  // 'match' is the result of executing the regexp above on the text content
  // of the message
  const chatId = msg.chat.id;
  // send back the matched "whatever" to the chat
  bot.sendGame(chatId, gameName);
});

// Listen for any kind of message. There are different kinds of
// messages.
bot.on("message", (msg) => {
  const chatId = msg.chat.id;

  // send a message to the chat acknowledging receipt of their message
  // bot.sendMessage(chatId, "Received your message!");
});

bot.on("callback_query", (query) => {
  if (query.game_short_name !== gameName) {
    bot.answerCallbackQuery(
      query.id,
      "Sorry, '" + query.game_short_name + "' is not available."
    );
  } else {
    queries[query.id] = query;
    let gameurl =
      "https://kill-the-zero.net/killthezero/index.html?id=" + query.id;
    bot.answerCallbackQuery(query.id, { url: gameurl });
  }
});

bot.on("inline_query", (iq) => {
  bot.answerInlineQuery(iq.id, [
    { type: "game", id: "0", game_short_name: gameName },
  ]);
});

app.get("/", (req, res) => {
  res.send("HI!");
});

app.get("/highscore/:score", function (req, res, next) {
  if (!Object.hasOwnProperty.call(queries, req.query.id)) return next();
  let query = queries[req.query.id];
  let options;
  if (query.message) {
    options = {
      chat_id: query.message.chat.id,
      message_id: query.message.message_id,
    };
  } else {
    options = {
      inline_message_id: query.inline_message_id,
    };
  }

  bot.setGameScore(
    query.from.id,
    req.params.score,
    options,
    function (err, result) {}
  );
});

https.createServer(httpsOptions, app).listen(5000);

//app.listen(5000);

