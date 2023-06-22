export const SLACK_APP_TOKEN = process.env.SLACK_APP_TOKEN;
export const SLACK_SIGNIN_SECRET = process.env.SLACK_SIGNIN_SECRET || "";
export const APP_PORT = process.env.BOT_APP_PORT || 3000;
export const START_ORDER_TEXT = "Want to place an order? (yes/no)";
export const ORDER_CREATED_TEXT = "Order created, preparation started!";
export const QUESTIONS: { [key: string]: string } = {
  "0": "Pizza name",
  "1": "Size",
  "2": "Dough Type",
  "3": "Side Type",
  "4": "Additions",
  "5": "Delivery Address",
  "6": "Order Comment",
};
export const AMPQ_CONNECT_URL = process.env.AMPQ_CONNECT_URL || "";
export const ORDER_STATUS_UPDATE_TEXT = "Order's status updated! New status: ";
export const RABBITMQ_QUEUE_FROM = "fromPizzaBotQueue";
export const RABBITMQ_QUEUE_TO = "toPizzaBotQueue";
