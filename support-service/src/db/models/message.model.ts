import mongoose, { Schema, Document } from "mongoose";
import { IMessage } from "../../types";

export interface IMessageModel extends IMessage, Document {
  id: number;
  text: string;
  orderId: number;
  conversationId: string;
  from: "support" | "user";
}

const MessageSchema: Schema = new Schema({
  id: { type: Number, required: true, unique: true },
  text: { type: String, required: true },
  orderId: { type: Number, required: true },
  conversationId: { type: String, required: true },
  from: { type: String, required: true },
});

export default mongoose.model<IMessageModel>("Message", MessageSchema);
