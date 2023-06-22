export const PASSWORD_SECRET = "secure-and-ultra-long-secret";
export const JWT_SECRET = "50-symbol-mega-prune-or-specially-obvious-knowledg";
export const JWT_BLACKLIST_MAINTAIN_PAUSE = 60 * 1000;
export const JWT_EXPIRATION_TIME = "60m";
export const APP_PORT = process.env.SUPPORT_APP_PORT;
export const MONGO_URL = process.env.MONGO_URL || "";
export const AMPQ_CONNECT_URL = process.env.AMPQ_CONNECT_URL || "";
export const ORDER_DATA_FIELDS = [
  "name",
  "size",
  "dough",
  "side",
  "additions",
  "address",
  "comment",
];
export const RABBITMQ_QUEUE_FROM = "toPizzaBotQueue";
export const RABBITMQ_QUEUE_TO = "fromPizzaBotQueue";
