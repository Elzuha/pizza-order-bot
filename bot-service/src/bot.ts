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
import { Database } from "./db";
import {
  SLACK_APP_TOKEN,
  SLACK_SIGNIN_SECRET,
  START_ORDER_TEXT,
  ORDER_CREATED_TEXT,
  QUESTIONS,
  APP_PORT,
} from "./config";

let db: DB;
(async () => {
  db = await Database.getInstance();
})();
const lastQuestionId = +Object.keys(QUESTIONS).reduce(
  (previosValue: string, questionId: string) => {
    return +questionId > +previosValue ? questionId : previosValue;
  },
  "0"
);
const conversationIdToLastQuestionId: { [key: string]: number } = {};
let sendInteractionMessage: InteractionMessageSender;
const parseMessage: (event: MessagePayloadEvent) => {
  message: string;
  conversationId: string;
} = (event) => {
  const message = event.text ? event.text.trim() : "";
  const conversationId = event.user || event.channel || "";
  return { message, conversationId };
};
const slackClient = new WebClient(SLACK_APP_TOKEN);
const slackEvents = new SlackEventAdapter(SLACK_SIGNIN_SECRET);

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

async function resumeChatOnRestart() {
  const lastAnswers: IAnswer[] = await db.getLastAnswers();
  for (const answer of lastAnswers) {
    conversationIdToLastQuestionId[answer.conversationId] =
      answer.questionId + 1;
    if (answer.questionId == lastQuestionId) continue;
    if (QUESTIONS[answer.questionId + 1]) {
      sendMessage(answer.conversationId, QUESTIONS[answer.questionId + 1]);
    }
  }
}

async function getCustomerData(conversationId: string) {
  const identity: WebApi.UsersInfoResponse = await slackClient.users.info({
    user: conversationId,
  });
  const username =
    identity && identity.user && identity.user.name ? identity.user.name : "";
  const avatarUrl =
    identity && identity.user.profile && identity.user.profile.image_72
      ? identity.user.profile.image_72
      : "";
  return {
    username,
    avatarUrl,
  };
}

async function messageHandler(conversationId: string, message: string) {
  let answerMessage = "";
  if (conversationIdToLastQuestionId[conversationId] > lastQuestionId) {
    sendInteractionMessage({
      eventType: "userMessage",
      conversationId,
      message,
    });
    return;
  }
  if (conversationIdToLastQuestionId[conversationId] == null) {
    const startOrder = message.toLowerCase() == "yes";
    answerMessage = startOrder ? QUESTIONS[0] : START_ORDER_TEXT;
    if (startOrder) conversationIdToLastQuestionId[conversationId] = 0;
  } else {
    await db.createAnswer({
      conversationId,
      message,
      questionId: conversationIdToLastQuestionId[conversationId],
    });
    conversationIdToLastQuestionId[conversationId]++;
    answerMessage = QUESTIONS[conversationIdToLastQuestionId[conversationId]];
    if (lastQuestionId < conversationIdToLastQuestionId[conversationId]) {
      const customerData = await getCustomerData(conversationId);
      const answers = await db.getAnswers(conversationId);
      sendInteractionMessage({
        eventType: "createOrder",
        conversationId,
        order: answers,
        customerData,
      });
      answerMessage = ORDER_CREATED_TEXT;
    }
  }
  if (answerMessage) sendMessage(conversationId, answerMessage);
}

export async function BotService(): Promise<Bot> {
  return {
    sendMessage,
    resumeChatOnRestart,
    setInteractionMessageSender: (sender: InteractionMessageSender) => {
      sendInteractionMessage = sender;
    },
  };
}
