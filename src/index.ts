import { Client, GatewayIntentBits, Collection } from 'discord.js';
import * as dotenv from 'dotenv';
import { loadEvents } from './handlers/eventHandler.js';
import { loadCommands } from './load/commandLoader.js';
import { deployCommands } from './deploy/deployCommands.js';
import type { Command } from './types/commands.js';

dotenv.config();

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
    ]
}) as Client & { commands: Collection<string, Command> };

client.commands = new Collection();

loadEvents(client);

await loadCommands(client);
await deployCommands(client);

client.login(process.env.DISCORD_TOKEN);