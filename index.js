// index.js -> entry point for the bot
// Landon Lego
// Last updated 1/31/2026

// flags: 64 -> ephemeral

// imports
require('dotenv').config();
const { ActivityType, Client, GatewayIntentBits } = require('discord.js');
const { executeSlashCommands, registerSlashCommands } = require('./src/handlers/slash-command-handler.js');
const { executePrefixCommands, registerPrefixCommands } = require('./src/handlers/prefix-command-handler.js');

// client
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildModeration,
        GatewayIntentBits.GuildMessageReactions
    ],
    partials: [
        'MESSAGE', 
        'CHANNEL', 
        'REACTION', 
        'GUILD_MEMBER', 
        'USER'
    ]
});

// initialization
client.once('clientReady', () => {
    // set presence
    client.user.setPresence({
        activities: [{
            name: '/help for commands',
            type: ActivityType.Watching
        }]
    });
    console.log('✅ Presence set');

    // execute commands
    registerSlashCommands(client);
    executeSlashCommands(client);

    registerPrefixCommands(client);
    executePrefixCommands(client);

    // log
    console.log(`✅ Logged in as ${client.user.tag}`);
});

// login
client.login(process.env.BOT_TOKEN);