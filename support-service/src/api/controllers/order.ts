import { NextFunction, Response } from "express";

import { RequestWithToken, DB, InteractionMessageSender } from "../../types";
import getDB from "../../db";

let db: DB;
(async () => {
  db = await getDB();
})();

export async function list(
  req: RequestWithToken,
  res: Response,
  next: NextFunction
) {
  try {
    let orders = await db.getOrders();
    if (!orders) orders = [];
    res.json({ orders });
  } catch (e) {
    next(e);
  }
}

export async function sendMessage(
  req: RequestWithToken,
  res: Response,
  next: NextFunction,
  interactionMessageSender: InteractionMessageSender
) {
  try {
    const orderId = req.body && req.body.orderId,
      message = req.body && req.body.message;
    if (orderId == null || !message) throw new Error("wrong_request");
    const order = await db.getOrderById(orderId);
    if (order) {
      interactionMessageSender({
        eventType: "messageRecieved",
        conversationId: order.customer.id,
        data: message,
      });
      await db.createMessage({
        conversationId: order.customer.id,
        text: message,
        orderId,
        from: "support",
      });
    }
    res.status(200).json({ ok: !!order });
  } catch (e) {
    next(e);
  }
}

export async function changeStatus(
  req: RequestWithToken,
  res: Response,
  next: NextFunction,
  interactionMessageSender: InteractionMessageSender
) {
  try {
    const orderId = req.body.orderId,
      status = req.body.status;
    if (orderId == null || !status) throw new Error("wrong_request");
    const order = await db.getAndUpdateOrder(orderId, { status });
    if (order) {
      interactionMessageSender({
        eventType: "orderStatusUpdated",
        conversationId: order.customer.id,
        data: status,
      });
    }
    res.status(200);
  } catch (e) {
    next(e);
  }
}
