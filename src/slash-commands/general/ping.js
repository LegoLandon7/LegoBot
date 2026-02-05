// ping.js -> ping command to get latency
// Landon Lego
// Last updated 1/31/2026

// imports
const { SlashCommandBuilder } = require('discord.js');

// command data
const data = new SlashCommandBuilder()
    .setName('ping')
    .setDescription('Replies with Pong!');

// execute data
async function execute(interaction) {
    const sent = await message.reply('Pinging...');
    const ping = sent.createdTimestamp - message.createdTimestamp;
    await interaction.reply({content: `🏓 Pong!\n\nLatency: ${ping}ms\nAPI: ${client.ws.ping}ms`});
}

// exports
module.exports = { data, execute, cooldown: 10 };