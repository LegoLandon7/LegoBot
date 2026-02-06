// clear.js -> Removes all prefixes 
// Landon Lego
// Last updated 2/5/2026

// imports
const { PermissionFlagsBits } = require('discord.js');
const { buildEmbed, COLORS } = require('../../../utils/embeds.js');
const db = require('../../../../scripts/init-databases.js');

// subcommand data
function data(subcommand) {
    subcommand
        .setName('clear')
        .setDescription('Removes all custom prefixes from the guild');
}

// execute data
async function execute(interaction) {
    await interaction.deferReply();

    if (!interaction.inGuild())
        return interaction.editReply({ content: "❌ This command can only be used in servers." });

    // data
    const guildId = interaction.guild.id;

    // permissions
    if (!interaction.member.permissions.has(PermissionFlagsBits.ManageGuild))
        return interaction.editReply({ content: "❌ You need the `Manage Guild` permission."});

    try {
        // remove all prefixes from database
        const stmt = db.prepare('DELETE FROM prefixes WHERE guild_id = ?');
        const result = stmt.run(guildId);

        // success reply
        if (result.changes > 0) {
            const embed = buildEmbed('✅ Removed all custom prefixes', null, 
                COLORS.GOOD, interaction.user);

            await interaction.editReply({ embeds: [embed]});
        } else
            await interaction.editReply({content: "❌ Couldn't find any prefixes"}); 
    } catch(error) {
        console.error(`[ERROR] [PREFIX] - ${error}`);
        await interaction.editReply({content: `❌ Error removing prefixes`}); 
    }
}

// exports
module.exports = { data, execute };