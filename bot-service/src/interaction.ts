import client, { Connection, Channel, ConsumeMessage } from "amqplib";

import {
  BotInteractionReceivedMessage,
  BotInteractionSentMessage,
  BotInteraction,
  BotMessageSender,
} from "./types";
import {
  AMPQ_CONNECT_URL,
  ORDER_STATUS_UPDATE_TEXT,
  RABBITMQ_QUEUE_FROM,
  RABBITMQ_QUEUE_TO,
} from "./config";
let rabbitMQConnection: Connection,
  rabbitMQChannel: Channel,
  sendBotMessage: BotMessageSender;

function consume(msg: ConsumeMessage | null): void {
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
    const usersMessageText = ORDER_STATUS_UPDATE_TEXT + message.data;
    sendBotMessage(message.conversationId, usersMessageText);
  } else if (message.eventType == "messageRecieved") {
    sendBotMessage(message.conversationId, message.data);
  }
}

function parseMessage(msgContent: Buffer): BotInteractionReceivedMessage {
  return JSON.parse(msgContent.toString("utf8"));
}

function sendMessage(message: BotInteractionSentMessage) {
  rabbitMQChannel.assertQueue(RABBITMQ_QUEUE_FROM, {
    durable: true,
  });

  rabbitMQChannel.sendToQueue(
    RABBITMQ_QUEUE_FROM,
    Buffer.from(JSON.stringify(message)),
    {
      persistent: true,
    }
  );
}

export async function BotInteractionService(): Promise<BotInteraction> {
  try {
    rabbitMQConnection = await client.connect(AMPQ_CONNECT_URL);
    rabbitMQChannel = await rabbitMQConnection.createChannel();
    rabbitMQChannel.assertQueue(RABBITMQ_QUEUE_TO, {
      durable: true,
    });
    rabbitMQChannel.consume(RABBITMQ_QUEUE_TO, consume);
  } catch (e) {
    console.log(e);
  }
  return {
    setBotMessageSender,
    sendMessage,
  };
}
