import client, { Connection, Channel, ConsumeMessage } from "amqplib";

import {
  BotInteractionReceivedMessage,
  BotInteractionSentMessage,
  BotInteraction,
  BotMessageSender,
} from "./types";

const AMPQ_CONNECT_URL = process.env.AMPQ_CONNECT_URL || "";
const statusUpdatedText = "Order's status updated! New status: ",
  queueFrom = "fromPizzaBotQueue",
  queueTo = "toPizzaBotQueue";
let rabbitMQConnection: Connection,
  rabbitMQChannel: Channel,
  sendBotMessage: BotMessageSender;

function consumer(msg: ConsumeMessage | null): void {
  if (msg) {
    let parsedMessage: BotInteractionReceivedMessage | null = null;
    try {
      parsedMessage = parseMessage(msg.content);
    } catch (e) {}
    if (parsedMessage) handleSupportServiceMessage(parsedMessage);
    setTimeout(function () {
      rabbitMQChannel.ack(msg);
    }, 1000);
  }
}

function setBotMessageSender(sender: BotMessageSender) {
  sendBotMessage = sender;
}
async function handleSupportServiceMessage(
  message: BotInteractionReceivedMessage
): Promise<void> {
  if (message.eventType == "orderStatusUpdated") {
    const usersMessageText = statusUpdatedText + message.data;
    sendBotMessage(message.conversationId, usersMessageText);
  } else if (message.eventType == "messageRecieved") {
    sendBotMessage(message.conversationId, message.data);
  }
}

function parseMessage(msgContent: Buffer): BotInteractionReceivedMessage {
  return JSON.parse(msgContent.toString("utf8"));
}

function sendMessage(message: BotInteractionSentMessage) {
  rabbitMQChannel.assertQueue(queueFrom, {
    durable: true,
  });

  rabbitMQChannel.sendToQueue(queueFrom, Buffer.from(JSON.stringify(message)), {
    persistent: true,
  });
}

export async function BotInteractionService(): Promise<BotInteraction> {
  try {
    rabbitMQConnection = await client.connect(AMPQ_CONNECT_URL);
    rabbitMQChannel = await rabbitMQConnection.createChannel();
    rabbitMQChannel.assertQueue(queueTo, {
      durable: true,
    });
    rabbitMQChannel.consume(queueTo, consumer);
  } catch (e) {
    console.log(e);
  }
  return {
    setBotMessageSender,
    sendMessage,
  };
}
