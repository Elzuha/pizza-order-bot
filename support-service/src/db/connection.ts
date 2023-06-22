import mongoose, { ConnectOptions } from "mongoose";

import { MONGO_URL } from "../config";

export function connectDB(): Promise<mongoose.Connection> {
  const options = {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  };
  return new Promise((resolve) => {
    mongoose.connect(MONGO_URL, options as ConnectOptions, () => {
      const connection = mongoose.connection;

      connection.once("open", () => {
        console.log("MongoDB database connection established successfully!");
      });

      connection.on("error", (error: Error) => {
        console.error("Error connecting to the MongoDB database: ", error);
      });
      resolve(connection);
    });
  });
}
