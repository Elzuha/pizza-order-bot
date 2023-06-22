import { BotService } from "./bot";
import { BotInteractionService } from "./interaction";

(async function main(): Promise<void> {
  const bot = await BotService();
  const interaction = await BotInteractionService();
  bot.setInteractionMessageSender(interaction.sendMessage);
  interaction.setBotMessageSender(bot.sendMessage);
  bot.resumeChatOnRestart();
})();
