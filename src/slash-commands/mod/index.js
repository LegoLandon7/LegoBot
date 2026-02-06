// mod.js -> Moderation command 
// Landon Lego
// Last updated 2/6/2026

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
    .setName('mod')
    .setDescription('Moderation commands')
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
    .setContexts(0);

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

    // validate subcommand
    if (!subcommand) {
        return interaction.reply({ content: '✗ Subcommand not found!', flags: 64 });
    }

    // execute subcommand
    try {
        await subcommand.execute(interaction);
    } catch (error) {
        console.error('[ERROR]', error);
        const errorContent = { content: '✗ An error occurred executing this command', flags: 64 };
        if (interaction.deferred || interaction.replied) {
            await interaction.editReply(errorContent);
        } else {
            await interaction.reply(errorContent);
        }
    }
}

// exports
module.exports = { data, execute, cooldown: 0}; 