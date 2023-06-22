import mongoose from "mongoose";
import { connectDB } from "./connection";
import Answer from "./answer.model";
import { IAnswer } from "../types";

let connection: mongoose.Connection;
async function createAnswer(answer: IAnswer) {
  new Promise<void>((resolve) => {
    Answer.create(answer)
      .then(() => resolve())
      .catch((error: Error) => {
        console.error(error);
        resolve();
      });
  });
}

async function getAnswers(conversationId: string): Promise<IAnswer[]> {
  return new Promise<IAnswer[]>(async (resolve) => {
    const answers: IAnswer[] = await Answer.find(
      { conversationId },
      { _id: 0 }
    ).exec();
    resolve(answers || []);
  });
}

async function getLastAnswers() {
  return new Promise<IAnswer[]>(async (resolve) => {
    const answers: IAnswer[] = await Answer.aggregate([
      {
        $group: {
          _id: "$conversationId",
          questionId: { $max: "$questionId" },
          conversationId: { $last: "$conversationId" },
        },
      },
      {
        $project: { _id: 0 },
      },
    ]);
    resolve(answers || []);
  });
}

async function deleteAnswers(conversationId: string) {
  Answer.deleteOne({ conversationId });
}

export default async function getDB() {
  if (!connection) connection = await connectDB();
  return {
    createAnswer,
    getLastAnswers,
    deleteAnswers,
    getAnswers,
  };
}
