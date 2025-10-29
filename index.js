import { Client, GatewayIntentBits, EmbedBuilder, PermissionsBitField, ActionRowBuilder, ButtonBuilder } from "discord.js";
import { parseDuration,  fetchMember} from "./functions/utilities.js";
import { doLogging } from "./logging/logger.js";
import { setLogChannel, getLogChannel } from "./logging/save-log-channels.js";
import { doCommands } from "./commands/commands.js";
import dotenv from "dotenv";

dotenv.config();

// client
const client = new Client({
	intents: [
		GatewayIntentBits.Guilds,
		GatewayIntentBits.GuildMessages,
		GatewayIntentBits.MessageContent,
		GatewayIntentBits.GuildMembers,
	],
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
});

// logging
doLogging(client);

// commands
try {doCommands(client);}
catch(err) {
	console.error(err);
	
}


// login
client.login(process.env.TOKEN);