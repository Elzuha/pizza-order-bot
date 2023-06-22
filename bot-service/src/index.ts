import { BotService } from "./bot";
import { BotInteractionService } from "./interaction";
import { Bot, BotInteraction } from "./types";
let bot: Bot, interaction: BotInteraction;

export function InitializeBotService(services: {
  bot: Bot;
  interaction: BotInteraction;
}): void {
  bot = services.bot || bot;
  interaction = services.interaction || interaction;
  bot.setInteractionMessageSender(interaction.sendMessage);
  interaction.setBotMessageSender(bot.sendMessage);
  bot.resumeChatOnRestart();
}

(async function main(): Promise<void> {
  InitializeBotService({
    bot: await BotService(),
    interaction: await BotInteractionService(),
  });
})();
