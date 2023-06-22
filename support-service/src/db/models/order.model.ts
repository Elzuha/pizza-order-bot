import mongoose, { Schema, Document } from "mongoose";
import { IOrder } from "../../types";

export interface IOrderModel extends IOrder, Document {
  id: number;
  customer: {
    id: string;
    avatarUrl: string;
    name: string;
  };
  data: {
    name: string;
    size: number;
    dough: string;
    side: string;
    additions: string;
    address: string;
    comment: string;
  };
}

const OrderSchema: Schema = new Schema({
  id: { type: Number, required: true, unique: true },
  customer: {
    type: {
      id: String,
      avatarUrl: String,
      name: String,
    },
    required: true,
  },
  data: {
    type: {
      name: String,
      size: Number,
      dough: String,
      side: String,
      additions: String,
      address: String,
      comment: String,
    },
    required: true,
  },
});

export default mongoose.model<IOrderModel>("Order", OrderSchema);
