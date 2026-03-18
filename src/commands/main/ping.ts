import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';
import type { Command } from '../../types/commands.js';

export const data = new SlashCommandBuilder()
    .setName('ping')
    .setDescription('Replies with Pong!');

export const execute = async (interaction: ChatInputCommandInteraction): Promise<void> => {
    const latency = interaction.client.ws.ping;
    await interaction.reply(`Pong! Latency: ${latency}ms`);
};
