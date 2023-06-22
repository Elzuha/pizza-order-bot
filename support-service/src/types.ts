import { Request } from "express";

export type RequestWithToken = Request & { token?: string };
export interface ResponseError extends Error {
  status?: number;
}
export interface IAnswer {
  conversationId: string;
  message: string;
  questionId: number;
}
export interface CustomerData {
  username: string;
  avatarUrl: string;
}
export interface GetUserParams {
  id?: number;
  username?: string;
  refreshToken?: string;
}
export interface UpdateData {
  status: Status;
}

type SupportInteractionReceivedEvents = "createOrder" | "userMessage";
export interface SupportInteractionReceivedMessage {
  eventType: SupportInteractionReceivedEvents;
  conversationId: string;
  message?: string;
  order?: IAnswer[];
  customerData?: CustomerData;
}

type SupportInteractionSentEvents = "orderStatusUpdated" | "messageRecieved";
export interface SupportInteractionSentMessage {
  eventType: SupportInteractionSentEvents;
  conversationId: string;
  data: string;
}

export interface IOrder {
  id?: number;
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

export interface IUser {
  id?: number;
  username: string;
  passHash: string;
  refreshToken: string;
}

export interface IFormattedOrder {
  id: number;
  name: string;
  size: string;
  dough: string;
  side: string;
  additions: string;
  address: string;
  orderComment: string;
  clientAvatar: string;
  clientName: string;
  status: Status;
  showDropoutPanel?: boolean;
}

export interface IMessageDto {
  text: string;
  orderId: number;
}

export interface IMessage {
  id?: number;
  text: string;
  orderId: number;
  conversationId: string;
  from: "support" | "user";
}

export type Status =
  | "accepted"
  | "cooking"
  | "delivering"
  | "delivered"
  | "canceled";

export type InteractionMessageSender = (
  message: SupportInteractionSentMessage
) => void;

export interface DB {
  createOrder: (order: IOrder) => Promise<void>;
  getOrders: () => Promise<IOrder[]>;
  getOrderById: (id: number) => Promise<IOrder | null>;
  getLastOrderByConversationId: (conversationId: string) => Promise<IOrder>;
  getAndUpdateOrder: (id: number, updateData: UpdateData) => Promise<IOrder>;
  createUser: (user: IUser) => Promise<void>;
  getUser: (params: GetUserParams) => Promise<IUser | null>;
  createMessage: (message: IMessage) => Promise<void>;
  getMessages: (orderId: number) => Promise<IMessage[]>;
}

export interface API {
  setInteractionMessageSender: (sender: InteractionMessageSender) => void;
}

export interface SupportInteraction {
  sendMessage: InteractionMessageSender;
}
