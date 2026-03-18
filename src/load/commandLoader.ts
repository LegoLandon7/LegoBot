import { Client, Collection } from 'discord.js';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
import type { Command } from '../types/commands.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export async function loadCommands(client: Client & { commands: Collection<string, Command> }) {
    const commandsPath = path.join(__dirname, '..', 'commands');
    
    async function getAllCommands(dir: string) {
        const files = fs.readdirSync(dir);
        for (const file of files) {
            const filePath = path.join(dir, file);
            const stat = fs.statSync(filePath);
            if (stat.isDirectory()) {
                await getAllCommands(filePath);
            } else if (file.endsWith('.ts') && file !== 'index.ts') {
                const command = await import(pathToFileURL(filePath).href);
                if (command.data && command.execute) {
                    client.commands.set(command.data.name, command);
                }
            }
        }
    }
    
    await getAllCommands(commandsPath);
}
