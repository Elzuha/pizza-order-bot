import { ApiService } from "./api";
import { SupportInteractionService } from "./interaction";
import { API, SupportInteraction } from "./types";

let api: API, interaction: SupportInteraction;

export function InitializeSupportService(services: {
  api: API;
  interaction: SupportInteraction;
}): void {
  api = services.api || api;
  interaction = services.interaction || interaction;
  api.setInteractionMessageSender(interaction.sendMessage);
}

(async function main(): Promise<void> {
  InitializeSupportService({
    api: await ApiService(),
    interaction: await SupportInteractionService(),
  });
})();
