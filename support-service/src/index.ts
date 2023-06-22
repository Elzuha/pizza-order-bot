import { ApiService } from "./api";
import { SupportInteractionService } from "./interaction";

(async function main(): Promise<void> {
  const api = await ApiService();
  const interaction = await SupportInteractionService();
  api.setInteractionMessageSender(interaction.sendMessage);
})();
