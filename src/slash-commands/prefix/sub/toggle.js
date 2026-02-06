// toggle.js -> Toggles a prefix (slash)
// Landon Lego
// Last updated 2/5/2026

// imports
const { PermissionFlagsBits } = require('discord.js');
const { buildEmbed, COLORS } = require('../../../utils/embeds.js');
const db = require('../../../../scripts/init-databases.js');
const { MAX_PREFIX_LENGTH, MAX_PREFIX_AMOUNT } = require('../../../handlers/prefix-command-handler.js');

// subcommand data
function data(subcommand) {
    subcommand
        .setName('toggle')
        .setDescription('Enables or disables a prefix')
        .addStringOption(o =>
            o.setName('prefix')
                .setDescription('The prefix to toggle')
                .setRequired(true))
        .addStringOption(o => 
            o.setName('action')
                .setDescription('The action to take on this prefix')
                .addChoices([
                    {name: 'Toggle', value: 'toggle'},
                    {name: 'Enable', value: 'enable'},
                    {name: 'Disable', value: 'disable'}
                ])
        .setRequired(false))
}

// execute data
async function execute(interaction) {
    await interaction.deferReply();

    if (!interaction.inGuild())
        return interaction.editReply({ content: "⚠️ This command can only be used in servers." });

    // data
    const prefix = interaction.options.getString('prefix');
    const action = interaction.options.getString('action') || 'toggle';
    const guildId = interaction.guild.id;

    // permissions
    if (!interaction.member.permissions.has(PermissionFlagsBits.ManageGuild))
        return interaction.editReply({ content: "⚠️ You need the `Manage Guild` permission."});

    // get the prefix state
    const enStmt = db.prepare('SELECT enabled FROM prefixes WHERE guild_id = ? AND prefix = ?');
    const result = enStmt.get(guildId, prefix);

    // validation
    if (!result)
        return interaction.editReply({ content: "❌ This prefix doesn't exist for this server" });

    let newAction = result.enabled;

    if (result.enabled === 1 && action === 'enable') 
        return interaction.editReply({ content: "⚠️ This prefix is already enabled" });
    else if (result.enabled === 0 && action === 'disable')
        return interaction.editReply({ content: "⚠️ This prefix is already disabled" });

    if (action === 'toggle') {
        if (result.enabled === 1) newAction = 0;
        else if (result.enabled === 0) newAction = 1;
    }

    try {
        // update prefix state in database
        const stmt = db.prepare('UPDATE prefixes SET enabled = ? WHERE guild_id = ? AND prefix = ?');
        const result = stmt.run(newAction, guildId, prefix);

        // success reply
        const enEmbed = buildEmbed(`✅ Enabled prefix: \`${prefix}\``, null, 
            COLORS.GOOD, interaction.user);

        const diEmbed = buildEmbed(`❌ Disabled prefix: \`${prefix}\``, null, 
            COLORS.BAD, interaction.user);

        const embed = newAction === 1 ? enEmbed : diEmbed;

        await interaction.editReply({ embeds: [embed]});
    } catch(error) {
        console.error(`[ERROR] [PREFIX] - ${error}`);
        await interaction.editReply({content: `❌ Error toggling prefix`});
    }

}

// exports
module.exports = { data, execute };