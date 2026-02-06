// deploy-commands.js -> Deploy slash commands to bot
// Landon Lego
// Last updated 1/31/2026

// imports
require('dotenv').config();
const { REST, Routes } = require('discord.js');
const fs = require('fs');
const path = require('path');

// initialize
const commands = [];

const commandsPath = path.join(__dirname, '../src/slash-commands');

// load commands
function loadCommands(dir) {
    const files = fs.readdirSync(dir, { withFileTypes: true });

    // loop through folder
    for (const file of files) {
        const fullPath = path.join(dir, file.name);

        if (file.isDirectory()) {
            // load file
            if (file.name === 'sub') continue;
            loadCommands(fullPath);
        } else if (file.name.endsWith('.js')) {
            // load command
            const command = require(fullPath);

            // invalid file
            if (!command.data || !command.execute) {
                console.warn(`❌ The command at ${fullPath} is missing a required "data" or "execute" property.`);
                continue;
            }

            // push command
            commands.push(command.data.toJSON());
        }
    }
}

loadCommands(commandsPath);

// deploy
const rest = new REST().setToken(process.env.BOT_TOKEN);

(async () => { 
    try {
        console.log(`🔄 Started refreshing ${commands.length} application (/) commands.`);

        // data
        const data = await rest.put(
            Routes.applicationCommands(process.env.CLIENT_ID),
            { body: commands }
        );

        console.log(`✅ Successfully deployed ${data.length} application (/) commands.`);
    } catch (error) {
        console.error(error);
    }
})();