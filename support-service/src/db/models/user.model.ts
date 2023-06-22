import mongoose, { Schema, Document } from "mongoose";
import { IMessage } from "../../types";

export interface IUserModel extends IMessage, Document {
  id: number;
  username: string;
  passHash: string;
  refreshToken: string;
}

const UserSchema: Schema = new Schema({
  id: { type: Number, required: true, unique: true },
  username: { type: String, required: true },
  passHash: { type: String, required: true },
  refreshToken: { type: String, required: true, unique: true },
});

export default mongoose.model<IUserModel>("User", UserSchema);
