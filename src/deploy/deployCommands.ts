import { Client, REST, Routes } from 'discord.js';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export async function deployCommands(client: Client) {
    const commands: object[] = [];
    const commandsPath = path.join(__dirname, '..', 'commands');

    async function getAllCommands(dir: string): Promise<void> {
        const files = fs.readdirSync(dir);
        for (const file of files) {
            const filePath = path.join(dir, file);
            const stat = fs.statSync(filePath);
            if (stat.isDirectory()) {
                await getAllCommands(filePath);
            } else if (file.endsWith('.ts') && file !== 'index.ts') {
                const cmd = await import(pathToFileURL(filePath).href);
                if (cmd.data) {
                    commands.push(cmd.data.toJSON());
                }
            }
        }
    }

    await getAllCommands(commandsPath);

    const rest = new REST().setToken(process.env.DISCORD_TOKEN!);

    try {
        await rest.put(
            Routes.applicationCommands(process.env.CLIENT_ID!),
            { body: commands }
        );
        console.log('✅ Successfully deployed commands');
    } catch (err) {
        console.error('❌ Failed to deploy commands:', err);
    }
}
