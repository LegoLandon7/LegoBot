import type { Interaction } from 'discord.js';
import { handleInteraction } from '../handlers/interactionHandler.js';

export const name = 'interactionCreate';
export const once = false;

export async function execute(interaction: Interaction) {
  if (!interaction.isChatInputCommand()) return;
  await handleInteraction(interaction);
}