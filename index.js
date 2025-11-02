import { Client, GatewayIntentBits, EmbedBuilder, PermissionsBitField, ActionRowBuilder, ButtonBuilder, Partials } from "discord.js";
import { doLogging } from "./logging/logger.js";
import { doCommands } from "./commands/main-commands.js";
import { doTriggers } from "./triggers/triggers.js";
import { doAfk } from "./afk/afker.js";
import dotenv from "dotenv";

dotenv.config();

// client
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildMessageReactions,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.DirectMessages,
        GatewayIntentBits.GuildPresences,
    ],
    partials: [Partials.Message, Partials.Channel, Partials.Reaction],
});

// error
client.on('error', (err) => {
    console.error('Client error event:', err);
});

// ready
client.once("clientReady", () => {
	console.log(`✅ Logged in as ${client.user.tag}`);
	client.user.setPresence({
		status: "online",
		activities: [{ name: "$help for commands", type: 0 }]
	});
    // afk
    doAfk(client);
    
	// logging
	doLogging(client);

	// commands
	doCommands(client);

	// triggers
	doTriggers(client);
});

// login
client.login(process.env.TOKEN);