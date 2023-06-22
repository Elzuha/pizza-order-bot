import mongoose, { Schema, Document } from "mongoose";
import { IAnswer } from "../types";

export interface IAnswerModel extends IAnswer, Document {
  message: string;
  questionId: number;
  conversationId: string;
}

const AnswerSchema: Schema = new Schema({
  message: { type: String, required: true },
  questionId: { type: Number, required: true },
  conversationId: { type: String, required: true },
});

export default mongoose.model<IAnswerModel>("Answer", AnswerSchema);
