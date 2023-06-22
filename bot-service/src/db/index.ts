import { connectDB } from "./connection";
import Answer from "./answer.model";
import { DB, IAnswer } from "../types";

export class Database extends DB {
  private static instance: Database;
  public static async getInstance() {
    if (!Database.instance) {
      await connectDB();
      Database.instance = new Database();
    }
    return Database.instance;
  }
  private constructor() {
    super();
  }
  public createAnswer(answer: IAnswer): Promise<void> {
    return new Promise<void>((resolve) => {
      Answer.create(answer)
        .then(() => resolve())
        .catch((error: Error) => {
          console.error(error);
          resolve();
        });
    });
  }
  public getLastAnswers(): Promise<IAnswer[]> {
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
  public async deleteAnswers(conversationId: string) {
    await Answer.deleteOne({ conversationId });
  }
  public getAnswers(conversationId: string): Promise<IAnswer[]> {
    return new Promise<IAnswer[]>(async (resolve) => {
      const answers: IAnswer[] = await Answer.find(
        { conversationId },
        { _id: 0 }
      ).exec();
      resolve(answers || []);
    });
  }
}
