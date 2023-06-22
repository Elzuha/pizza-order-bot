import client, { Connection, Channel, ConsumeMessage } from "amqplib";

import {
  SupportInteractionReceivedMessage,
  SupportInteractionSentMessage,
  IMessage,
  IOrder,
  SupportInteraction,
  DB,
} from "./types";
import { Database } from "./db";
import {
  AMPQ_CONNECT_URL,
  ORDER_DATA_FIELDS,
  RABBITMQ_QUEUE_FROM,
  RABBITMQ_QUEUE_TO,
} from "./config";

let db: DB;
(async () => {
  db = await Database.getInstance();
})();
let rabbitMQConnection: Connection, rabbitMQChannel: Channel;

function parseMessage(msgContent: Buffer): SupportInteractionReceivedMessage {
  return JSON.parse(msgContent.toString("utf8"));
}

async function messageHandler(message: SupportInteractionReceivedMessage) {
  console.log("Message recieved:", message.eventType);
  if (message.eventType == "createOrder" && message.customerData) {
    const ordersData: IOrder["data"] = {
      name: "",
      size: 20,
      dough: "",
      side: "",
      additions: "",
      address: "",
      comment: "",
    };
    (Object.keys(ordersData) as (keyof IOrder["data"])[]).forEach(
      (fieldName) => {
        const answerIndex = ORDER_DATA_FIELDS.indexOf(fieldName);
        if (message.order) {
          if (
            fieldName == "size" &&
            message.order[answerIndex] &&
            !isNaN(+message.order[answerIndex].message)
          ) {
            ordersData[fieldName] = +message.order[answerIndex].message;
          } else if (fieldName != "size" && message.order[answerIndex]) {
            ordersData[fieldName] = message.order[answerIndex].message;
          }
        }
      }
    );
    const order: IOrder = {
      customer: {
        id: message.conversationId,
        avatarUrl: message.customerData.avatarUrl || "",
        name: message.customerData.username || "",
      },
      data: ordersData,
    };
    db.createOrder(order);
  } else {
    const order = await db.getLastOrderByConversationId(message.conversationId);
    const chatMessage: IMessage = {
      conversationId: message.conversationId,
      text: message.message || "",
      orderId: order.id || 0,
      from: "user",
    };
    db.createMessage(chatMessage);
  }
}

function consume(msg: ConsumeMessage | null): void {
  if (msg) {
    let parsedMessage: SupportInteractionReceivedMessage | null = null;
    try {
      parsedMessage = parseMessage(msg.content);
    } catch (e) {
      console.log("Error on message parsing:", e);
    }
    if (parsedMessage) messageHandler(parsedMessage);
    setTimeout(function () {
      rabbitMQChannel.ack(msg);
    }, 1000);
  }
}

function sendMessage(message: SupportInteractionSentMessage) {
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

export async function SupportInteractionService(): Promise<SupportInteraction> {
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
    sendMessage,
  };
}
