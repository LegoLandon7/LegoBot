// prefix-command-handler.js -> handle commands for the bot
// Landon Lego
// Last updated 2/4/2026

// imports
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

// data
let commands = new Map();
const DEFAULT_PREFIXES = ['<@1466095962765398068>'];
const MAX_PREFIX_LENGTH = 10;
const MAX_PREFIX_AMOUNT = 100;

const timeout = 5;

// register commands
function registerPrefixCommands(client) { 
    const commandsPath = path.join(__dirname, '../prefix-commands');
    
    // load the commands
    function loadCommands(dir) {
        const files = fs.readdirSync(dir, { withFileTypes: true });
        
        // loop through every file
        for (const file of files) {
            const fullPath = path.join(dir, file.name);
            if (file.isDirectory()) {
                // load file
                loadCommands(fullPath);
            } else if (file.name.endsWith('.js')) {
                const command = require(fullPath);
                
                // invalid file
                if (!command.structure || !command.execute || !command.name) {
                    console.warn(`⚠️ The command at ${fullPath} is missing a required "structure", "execute", or "name" property.`);
                    continue;
                }
                commands.set(command.name.toLowerCase(), command);
            }
        }
    }
    
    // load
    loadCommands(commandsPath);
    console.log(`✅ Successfully loaded ${commands.size} application (prefix) commands.`);
}

// execute commands
function executePrefixCommands(client) {
    client.on('messageCreate', async (message) => {
        if (message.author.bot) return;
        
        // command content
        const content = message.content;
        const prefix = content[0];
        
        // valid prefix
        if (!DEFAULT_PREFIXES.includes(prefix)) return;
        
        // command arguments
        const args = content.slice(1).trim().split(/\s+/);
        const commandName = args.shift().toLowerCase();
        const command = commands.get(commandName);
        
        // command doesn't exist
        if (!command) return;
        
        // execute
        try {
            if (checkCooldown(message.author.id, command.cooldown || 0, commandName)) {
                // execute command
                await command.execute(client, message, args);
            } else {
                // tell user the cooldown
                const entry = cooldowns[message.author.id][commandName];
                const remaining = entry.time - (Date.now() - entry.date);
                const reply = await message.reply({ content: `⚠️ Try this command again in \`${msToDuration(remaining)}\`` });
                
                // delete after 5 seconds
                setTimeout(() => {
                    reply.delete().catch(err => console.error('⚠️ Failed to delete cooldown message:', err));
                }, timeout * 1000);
            }
        } catch (error) {
            console.error(error);
            
            // error - show structure
            const errorMsg = await message.reply({ content: `❌ Error executing command.\n**Usage:** \`${prefix}${command.structure}\`` });
            
            // delete after 5 seconds
            setTimeout(() => {
                errorMsg.delete().catch(err => console.error('Failed to delete error message:', err));
            }, 5000);
        }
    });
}

// exports
module.exports = { registerPrefixCommands, executePrefixCommands, DEFAULT_PREFIXES, MAX_PREFIX_AMOUNT, MAX_PREFIX_LENGTH };