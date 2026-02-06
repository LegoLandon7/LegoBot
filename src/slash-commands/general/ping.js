// ping.js -> Gets latency 
// Landon Lego
// Last updated 2/6/2026

// imports
const { SlashCommandBuilder } = require('discord.js');

// command data
const data = new SlashCommandBuilder()
    .setName('ping')
    .setDescription('Replies with Pong!');

// execute command
async function execute(interaction, client) {
    const sent = await interaction.reply({ content: '⏱️ Measuring...' });
    const ping = sent.createdTimestamp - interaction.createdTimestamp;
    await interaction.editReply({ content: `🏓 Pong!\n\n**Latency:** ${ping}ms\n**API:** ${client.ws.ping}ms` });
}

// exports
module.exports = { data, execute, cooldown: 10 };