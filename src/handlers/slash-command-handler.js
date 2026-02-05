// slash-command-handler.js -> handle commands for the bot
// Landon Lego
// Last updated 2/4/2026

// imports
const { Collection } = require('discord.js');
const { msToDuration } = require('../utils/time.js');
const fs = require('fs');
const path = require('path');

// cooldowns
let cooldowns = {};

function checkCooldown(userId, time, commandName) {
    // initialize cooldown
    if (!cooldowns[userId]) cooldowns[userId] = {};

    // check if cooldown exists
    if (cooldowns[userId][commandName]) {
        const entry = cooldowns[userId][commandName];

        // check if cooldown is gone
        if (Date.now() - entry.date >= entry.time) {
            delete cooldowns[userId][commandName];
            if (Object.keys(cooldowns[userId]).length === 0) {
                delete cooldowns[userId];
            }
        } else {
            // still on cooldown
            return false;
        }
    }

    // re-initialize
    if (!cooldowns[userId]) cooldowns[userId] = {};

    // set new cooldown
    cooldowns[userId][commandName] = {
        date: Date.now(),
        time: time * 1000,
    };

    return true;
}

// register commands
function registerSlashCommands(client) { 
    client.commands = new Collection();

    const commandsPath = path.join(__dirname, '../slash-commands');

    // load the commands
    function loadCommands(dir) {
        const files = fs.readdirSync(dir, { withFileTypes: true });

        // loop through every file
        for (const file of files) {
            const fullPath = path.join(dir, file.name);

            if (file.isDirectory()) {
                // load file
                if (file.name === 'sub') continue;
                loadCommands(fullPath);
            } else if (file.name.endsWith('.js')) {
                const command = require(fullPath);

                // invalid file
                if (!command.data || !command.execute) {
                    console.warn(`⚠️ The command at ${fullPath} is missing a required "data" or "execute" property.`);
                    continue;
                }

                client.commands.set(command.data.name, command);
            }
        }
    }

    // load
    loadCommands(commandsPath);

    console.log(`✅ Successfully loaded ${client.commands.size} application (/) commands.`);
}

// execute comnmands
function executeSlashCommands(client) {
    client.on('interactionCreate', async (interaction) => {
        if (!interaction.isChatInputCommand()) return;

        // get command
        const command = client.commands.get(interaction.commandName);

        // invalid command
        if (!command) {
            console.warn(`⚠️ Unknown command: ${interaction.commandName}`);
            return;
        }

        // execute
        try {
            if (checkCooldown(interaction.user.id, command.cooldown, interaction.commandName)) {
                // execute command
                await command.execute(interaction, client);
            } else {
                // tell user the cooldown
                const entry = cooldowns[interaction.user.id][interaction.commandName];
                const remaining = entry.time - (Date.now() - entry.date);
                await interaction.reply({ content: `⚠️ Try this command again in \`${msToDuration(remaining)}\``, flags: 64 }); // ephermeral
            }
        } catch (error) {
            console.error(error);

            // error
            if (interaction.replied || interaction.deferred) {
                await interaction.followUp({ content: '❌ Error executing command.', flags: 64 }); // ephermeral
            } else {
                await interaction.reply({ content: '❌ Error executing command.', flags: 64 }); // ephermeral
            }
        }
    });
}

// exports
module.exports = { registerSlashCommands, executeSlashCommands };