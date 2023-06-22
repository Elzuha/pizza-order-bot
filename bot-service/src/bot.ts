import express from "express";
import bodyParser from "body-parser";
import { WebClient } from "@slack/web-api";
import { SlackEventAdapter } from "@slack/events-api";
import * as WebApi from "seratch-slack-types/web-api";

import {
  MessagePayloadEvent,
  IAnswer,
  Bot,
  DB,
  InteractionMessageSender,
} from "./types";
import getDB from "./db";

const SLACK_APP_TOKEN = process.env.SLACK_APP_TOKEN;
const SLACK_SIGNIN_SECRET = process.env.SLACK_SIGNIN_SECRET || "";
const APP_PORT = process.env.BOT_APP_PORT || 3000;
const conversationIdToLastQuestionId: { [key: string]: number } = {};
const questions: { [key: string]: string } = {
  "0": "Pizza name",
  "1": "Size",
  "2": "Dough Type",
  "3": "Side Type",
  "4": "Additions",
  "5": "Delivery Address",
  "6": "Order Comment",
};
const lastQuestionId = +Object.keys(questions).sort(
  (keyA: string, keyB: string) => {
    return +keyB - +keyA;
  }
)[0];
const startOrderText = "Want to place an order? (yes/no)";
const orderCreated = "Order created, preparation started!";
const slackClient = new WebClient(SLACK_APP_TOKEN);
const slackEvents = new SlackEventAdapter(SLACK_SIGNIN_SECRET);
const parseMessage: (event: MessagePayloadEvent) => {
  message: string;
  conversationId: string;
} = (event) => {
  const message = event.text ? event.text.trim() : "";
  const conversationId = event.user || event.channel || "";
  return { message, conversationId };
};
let sendInteractionMessage: InteractionMessageSender;
let db: DB;
(async () => {
  db = await getDB();
})();

async function sendMessage(conversationId: string, message: string) {
  await slackClient.chat.postMessage({
    text: message,
    channel: conversationId,
  });
  if (["recieved", "canceled"].includes(message)) {
    delete conversationIdToLastQuestionId[conversationId];
    db.deleteAnswers(conversationId);
  }
}

async function getCustomerData(conversationId: string) {
  const identity: WebApi.UsersInfoResponse = await slackClient.users.info({
    user: conversationId,
  });
  const username =
    identity && identity.user && identity.user.name ? identity.user.name : "";
  const avatarUrl =
    identity && identity.user.profile && identity.user.profile.image_24
      ? identity.user.profile.image_24
      : "";
  return {
    username,
    avatarUrl,
  };
}

async function resumeChatOnRestart() {
  const lastAnswers: IAnswer[] = await db.getLastAnswers();
  for (const answer of lastAnswers) {
    conversationIdToLastQuestionId[answer.conversationId] =
      answer.questionId + 1;
    if (answer.questionId == lastQuestionId) continue;
    if (questions[answer.questionId + 1]) {
      sendMessage(answer.conversationId, questions[answer.questionId + 1]);
    }
  }
}

async function messageHandler(conversationId: string, message: string) {
  let answerMessage = "";
  if (conversationIdToLastQuestionId[conversationId] > lastQuestionId) {
    sendInteractionMessage({
      eventType: "userMessage",
      conversationId,
      message,
    });
    answerMessage = "Your message resent to our manager!";
    return;
  } else if (
    !conversationIdToLastQuestionId[conversationId] &&
    conversationIdToLastQuestionId[conversationId] != 0 &&
    message.toLowerCase() != "yes"
  ) {
    answerMessage = startOrderText;
  } else if (
    conversationIdToLastQuestionId[conversationId] == null &&
    message.toLowerCase() == "yes"
  ) {
    conversationIdToLastQuestionId[conversationId] = 0;
    answerMessage = questions[0];
  } else {
    await db.createAnswer({
      conversationId,
      message,
      questionId: conversationIdToLastQuestionId[conversationId],
    });
    conversationIdToLastQuestionId[conversationId]++;
    answerMessage = questions[conversationIdToLastQuestionId[conversationId]];
    if (lastQuestionId < conversationIdToLastQuestionId[conversationId]) {
      const customerData = await getCustomerData(conversationId);
      const answers = await db.getAnswers(conversationId);
      sendInteractionMessage({
        eventType: "createOrder",
        conversationId,
        order: answers,
        customerData,
      });
      answerMessage = orderCreated;
    }
  }
  if (answerMessage) sendMessage(conversationId, answerMessage);
}
slackEvents.requestListener();
slackEvents.on("error", (e) => {
  console.log(e);
});
slackEvents.on("message", (event) => {
  console.log(event);
  console.log(
    `Received a message event: user: ${event.user} text: ${event.text}`
  );
});

const app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.post("/slack/events", (req, res) => {
  const slackEvent = req.body;
  if (slackEvent.type === "url_verification") {
    return res.status(200).json({ challenge: slackEvent.challenge });
  }
  if (!slackEvent.event || !slackEvent.event.client_msg_id) {
    return res.sendStatus(200);
  }
  const { message, conversationId } = parseMessage(slackEvent.event || {});
  messageHandler(conversationId, message);
  res.sendStatus(200);
  res.status(200).send();
});
(async function () {
  await new Promise<void>((resolve) => {
    const port = APP_PORT;
    app.listen(port, () => {
      console.log(`Listening on port ${port}`);
      resolve();
    });
  });
})();

export async function BotService(): Promise<Bot> {
  return {
    sendMessage,
    getCustomerData,
    resumeChatOnRestart,
    setInteractionMessageSender: (sender: InteractionMessageSender) => {
      sendInteractionMessage = sender;
    },
  };
}
