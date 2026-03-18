import { ChatInputCommandInteraction, Collection } from 'discord.js';
import type { Command } from '../types/commands.js';

export async function handleInteraction(interaction: ChatInputCommandInteraction) {
    const commands = (interaction.client as any).commands as Collection<string, Command>;
    const command = commands.get(interaction.commandName);

    if (!command) {
        await interaction.reply({
            content: '❌ Command not found.',
            ephemeral: true,
        });
        return;
    }

    try {
        await command.execute(interaction);
    } catch (error) {
        console.error('[ERROR] Command Execution: ', error);
        if (interaction.replied) {
            await interaction.followUp({
                content: '❌ There was an error executing this command!',
                ephemeral: true,
            });
        } else {
            await interaction.reply({
                content: '❌ There was an error executing this command!',
                ephemeral: true,
            });
        }
    }
}
