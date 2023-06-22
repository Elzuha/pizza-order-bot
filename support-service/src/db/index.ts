import mongoose from "mongoose";
import { connectDB } from "./connection";
import Order, { IOrderModel } from "./models/order.model";
import User, { IUserModel } from "./models/user.model";
import Message, { IMessageModel } from "./models/message.model";
import {
  IOrder,
  IUser,
  GetUserParams,
  IMessage,
  UpdateData,
  DB,
} from "../types";

let connection: mongoose.Connection;
let lastOrderId = -1,
  lastUserId = -1,
  lastMessageId = -1;

(async () => {
  lastOrderId = await new Promise((resolve) => {
    Order.find({})
      .sort({ id: -1 })
      .limit(1)
      .exec((err: Error | null, orders: IOrderModel[]) => {
        if (err) console.log("Err on getting last order id:", err);
        resolve(orders[0] && orders[0].id != null ? +orders[0].id : -1);
      });
  });
  lastUserId = await new Promise((resolve) => {
    User.find({})
      .sort({ id: -1 })
      .limit(1)
      .exec((err: Error | null, orders: IUserModel[]) => {
        if (err) console.log("Err on getting last user id:", err);
        resolve(orders[0] && orders[0].id != null ? +orders[0].id : -1);
      });
  });
  lastMessageId = await new Promise((resolve) => {
    Message.find({}, { _id: 0 })
      .sort({ id: -1 })
      .limit(1)
      .exec((err: Error | null, messages: IMessageModel[]) => {
        if (err) console.log("Err on getting last message id:", err);
        resolve(messages[0] && messages[0].id != null ? +messages[0].id : -1);
      });
  });
})();

async function createOrder(order: IOrder): Promise<void> {
  lastOrderId++;
  try {
    Order.create({
      id: lastOrderId,
      ...order,
    });
  } catch (e) {}
}

async function getOrders(): Promise<IOrder[]> {
  const orders = await Order.find({}, { _id: 0 }).exec();
  return orders || [];
}

async function getOrderById(id: number): Promise<IOrder | null> {
  const order = await Order.findOne({ id }, { _id: 0 }).exec();
  return order;
}

async function getLastOrderByConversationId(
  conversationId: string
): Promise<IOrder> {
  return new Promise((resolve) => {
    Order.find({ "customer.id": conversationId })
      .sort({ id: -1 })
      .limit(1)
      .exec((err: Error | null, orders: IOrder[]) => {
        if (err) console.log("Error on updating order status" + err);
        resolve(orders[0]);
      });
  });
}

function getAndUpdateOrder(
  id: number,
  updateData: UpdateData
): Promise<IOrder> {
  return new Promise((resolve) => {
    Order.findOneAndUpdate(
      { id },
      updateData,
      { new: true, projection: { _id: 0 }, lean: true, upsert: true },
      (err: Error | null, doc: IOrder) => {
        if (err) console.log("Error on updating order status" + err);
        resolve(doc);
      }
    );
  });
}

async function createUser(user: IUser): Promise<void> {
  lastUserId++;
  User.create({
    id: lastUserId,
    ...user,
  });
}

async function getUser(params: GetUserParams): Promise<IUser | null> {
  const user = await User.findOne(params, { _id: 0 }).exec();
  return user;
}

async function createMessage(message: IMessage): Promise<void> {
  lastMessageId++;
  Message.create({
    id: lastMessageId,
    ...message,
  });
}

async function getMessages(orderId: number): Promise<IMessageModel[]> {
  const messages = await Message.find({ orderId }, { _id: 0 }).exec();
  return messages || [];
}

export default async function getDB(): Promise<DB> {
  if (!connection) connection = await connectDB();
  return {
    createOrder,
    getOrders,
    getOrderById,
    getLastOrderByConversationId,
    getAndUpdateOrder,
    createUser,
    getUser,
    createMessage,
    getMessages,
  };
}
