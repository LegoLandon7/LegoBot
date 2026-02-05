// remove.js -> remove a prefix
// Landon Lego
// Last updated 2/5/2026

// imports
const { PermissionFlagsBits } = require('discord.js');
const { buildEmbed, COLORS } = require('../../../utils/embeds.js');
const db = require('../../../../scripts/init-databases.js');

// subcommand data
function data(subcommand) {
    subcommand
        .setName('remove')
        .setDescription('Removes a prefix from the guild')
        .addStringOption(o =>
            o.setName('prefix')
                .setDescription('The prefix to remove')
                .setRequired(true));
}

// execute data
async function execute(interaction) {
    await interaction.deferReply();

    if (!interaction.inGuild())
        return interaction.editReply({ content: "❌ This command can only be used in servers." });

    // data
    const prefix = interaction.options.getString('prefix');
    const guildId = interaction.guild.id;


    // permissions
    if (!interaction.member.permissions.has(PermissionFlagsBits.ManageGuild))
        return interaction.editReply({ content: "❌ You need the `Manage Guild` permission."});

    try {
        // add prefix
        const stmt = db.prepare('DELETE FROM prefixes WHERE guild_id = ? AND prefix = ?');
        const result = stmt.run(guildId, prefix);

        // reply
        if (result.changes > 0) {
            const embed = buildEmbed('❌ Removed prefix', `**Prefix:** \`${prefix}\``, 
                COLORS.BAD, interaction.user);

            await interaction.editReply({ embeds: [embed]}); 
        } else
            await interaction.editReply({content: `❌ couldn't find the prefix \`${prefix}\``}); 
    } catch(error) {
        // error
        console.error(`[ERROR] [DATABASE] - ${error}`);
        await interaction.editReply({content: `❌ Error removing prefix`}); 
    }
}

// exports
module.exports = { data, execute };