// ping.js ->  Gets latency
// Landon Lego
// Last updated 2/4/2026

// execute command
async function execute(client, message, args) {
    const sent = await message.reply('Pinging...');
    const ping = sent.createdTimestamp - message.createdTimestamp;
    await sent.edit(`🏓 Pong!\n\nLatency: ${ping}ms\nAPI: ${client.ws.ping}ms`);
}

// exports
module.exports = { execute, name: 'ping', structure: 'ping', cooldown: 10 };