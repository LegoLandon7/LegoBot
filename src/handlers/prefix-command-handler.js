// prefix-command-handler.js -> Handles prefix commands
// Landon Lego
// Last updated 2/6/2026

// imports
const { msToDuration } = require('../utils/time.js');
const db = require('../../scripts/init-databases.js');
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
                
                // validate command
                if (!command.structure || !command.execute || !command.name) {
                    console.warn(`[WARNING] Command at ${fullPath} missing 'structure', 'execute', or 'name'`);
                    continue;
                }
                commands.set(command.name.toLowerCase(), command);
            }
        }
    }
    
    // load all commands
    loadCommands(commandsPath);
    console.log(`✅ Loaded ${commands.size} prefix commands`);
}

// execute commands
function executePrefixCommands(client) {
    client.on('messageCreate', async (message) => {
        if (message.author.bot) return;
        if (!message.guild) return;
        
        // command content
        const content = message.content.toLowerCase();

        // load guild specific prefixes from database
        let allPrefixes = [...DEFAULT_PREFIXES];
        
        if (message.guild) {
            const stmt = db.prepare('SELECT prefix FROM prefixes WHERE guild_id = ? AND enabled = 1');
            const guildPrefixes = stmt.all(message.guild.id).map(p => p.prefix);
            allPrefixes = [...DEFAULT_PREFIXES, ...guildPrefixes];
        }

        // find used prefix
        let usedPrefix = null;
        for (const prefix of allPrefixes) {
            if (content.startsWith(prefix)) {
                usedPrefix = prefix;
                break;
            }
        }

        // No valid prefix found
        if (!usedPrefix) return;
        
        // command arguments
        const args = content.slice(usedPrefix.length).trim().split(/\s+/);
        const commandName = args.shift().toLowerCase();
        const command = commands.get(commandName);
        
        // skip if command not found
        if (!command) return;
        
        // execute
        try {
            if (checkCooldown(message.author.id, command.cooldown || 0, commandName)) {
                // execute command
                await command.execute(client, message, args);
            } else {
                // cooldown active
                const entry = cooldowns[message.author.id][commandName];
                const remaining = entry.time - (Date.now() - entry.date);
                const reply = await message.reply({ content: `⏳ Try again in \`${msToDuration(remaining)}\`` });
                setTimeout(() => reply.delete().catch(err => console.error('[WARNING] Failed to delete message:', err)), timeout * 1000);
            }
        } catch (error) {
            console.error('[ERROR]', error);
            await message.reply({ content: `✗ Error executing command.\n**Usage:** \`${command.structure}\`` });
        }
    });
}

// exports
module.exports = { registerPrefixCommands, executePrefixCommands, DEFAULT_PREFIXES, MAX_PREFIX_AMOUNT, MAX_PREFIX_LENGTH };