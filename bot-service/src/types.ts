type BotInteractionReceivedEvents = "orderStatusUpdated" | "messageRecieved";
type BotInteractionSentEvents = "createOrder" | "userMessage";
export type InteractionMessageSender = (
  message: BotInteractionSentMessage
) => void;
export type BotMessageSender = (
  conversationId: string,
  message: string
) => Promise<void>;

export interface BotInteractionReceivedMessage {
  eventType: BotInteractionReceivedEvents;
  conversationId: string;
  data: string;
}

export interface BotInteractionSentMessage {
  eventType: BotInteractionSentEvents;
  conversationId: string;
  message?: string;
  order?: IAnswer[];
  customerData?: CustomerData;
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

export interface MessagePayloadEvent {
  client_msg_id?: string;
  type?: string;
  team?: string;
  channel?: string;
  user?: string;
  bot_id?: string;
  bot_profile?: object;
  text?: string;
  blocks?: object[];
  attachments?: object[];
  ts?: string;
  parent_user_id?: string;
  thread_ts?: string;
  event_ts?: string;
  channel_type?: string;
  edited?: object;
}

export interface Bot {
  setInteractionMessageSender: (
    sender: (message: BotInteractionSentMessage) => void
  ) => void;
  sendMessage: BotMessageSender;
  getCustomerData: (conversationId: string) => Promise<CustomerData>;
  resumeChatOnRestart: () => Promise<void>;
}

export interface BotInteraction {
  setBotMessageSender: (sender: BotMessageSender) => void;
  sendMessage: (message: BotInteractionSentMessage) => void;
}

export interface DB {
  createAnswer: (answer: IAnswer) => Promise<void>;
  getAnswers: (conversationId: string) => Promise<IAnswer[]>;
  getLastAnswers: () => Promise<IAnswer[]>;
  deleteAnswers: (conversationId: string) => Promise<void>;
}
