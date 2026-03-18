import { Client } from 'discord.js';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export function loadEvents(client: Client) {
    const eventsPath = path.join(__dirname, '..', 'events');

    for (const file of fs.readdirSync(eventsPath).filter(f => f.endsWith('.ts'))) {
        import(pathToFileURL(path.join(eventsPath, file)).href).then((event) => {
            if (event.once) {
                client.once(event.name, (...args: unknown[]) => event.execute(...args));
            } else {
                client.on(event.name, (...args: unknown[]) => event.execute(...args));
            }
        });
    }
}