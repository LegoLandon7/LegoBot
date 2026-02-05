// index.js -> ai main command
// Landon Lego
// Last updated 1/31/2026

// imports
const { SlashCommandBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

// get subcommands
const subcommands = new Map();
const subcommandsPath = path.join(__dirname, 'sub');
const subcommandFiles = fs.readdirSync(subcommandsPath).filter(file => file.endsWith('.js'));

// command builder
const data = new SlashCommandBuilder()
    .setName('ai')
    .setDescription('AI commands');

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

// execute command
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
module.exports = { data, execute, cooldown: 15};