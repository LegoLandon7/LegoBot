// index.js -> prefixes main command
// Landon Lego
// Last updated 2/5/2026

// imports
const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const fs = require('fs');
const path = require('path');

// get subcommands
const subcommands = new Map();
const subcommandsPath = path.join(__dirname, 'sub');
const subcommandFiles = fs.readdirSync(subcommandsPath).filter(file => file.endsWith('.js'));

// command builder
const data = new SlashCommandBuilder()
    .setName('prefixes')
    .setDescription('Prefix commands')
    .setContexts(0); // guild only

// register subcommands
for (const file of subcommandFiles) {
    const subcommand = require(`./sub/${file}`);
    let subCommandName;

    data.addSubcommand(sub => {
        subcommand.data(sub);
        subCommandName = sub.name;
        return sub;
    });

    subcommands.set(subCommandName, subcommand);
}

// execute subcommand
async function execute(interaction) {
    // get subcommand
    const subcommandName = interaction.options.getSubcommand();
    const subcommand = subcommands.get(subcommandName);

    // invalid subcommand
    if (!subcommand) {
        return interaction.reply('❌ Subcommand not found!');
    }

    // execute subcommand
    try {
        await subcommand.execute(interaction);
    } catch (error) {
        console.error(error);
        
        // error
        if (interaction.deferred || interaction.replied) {
            await interaction.editReply('❌ Sorry, something went wrong!');
        } else {
            await interaction.reply('❌ Sorry, something went wrong!');
        }
    }
}

// exports
module.exports = { data, execute, cooldown: 0};