// list.js ->  Lists all prefixes
// Landon Lego
// Last updated 2/5/2026

// imports
const { buildEmbed, COLORS } = require('../../../utils/embeds.js');
const { DEFAULT_PREFIXES } = require('../../../handlers/prefix-command-handler.js');
const db = require('../../../../scripts/init-databases.js');
const prefixes = require('../index.js');

// subcommand data
function data(subcommand) {
    subcommand
        .setName('list')
        .setDescription('Lists all prefixes in this guild');
}

// execute data
async function execute(interaction) {
    await interaction.deferReply();

    if (!interaction.inGuild())
        return interaction.editReply({ content: "❌ This command can only be used in servers." });

    // data
    const guildId = interaction.guild.id;

    try {
        // list prefixes
        const stmt = db.prepare('SELECT id, prefix, enabled FROM prefixes WHERE guild_id = ? ORDER BY created_at');
        const prefixes = stmt.all(guildId) || [];

        const defaultPrefixList = DEFAULT_PREFIXES.map(p => `\`${p}\``).join(' ');

        const enabledList = prefixes
            .filter(p => p.enabled === 1)
            .map(p => `\`${p.prefix}\``)
            .join(' ') || '[NONE]';

        const disabledList = prefixes
            .filter(p => p.enabled === 0)
            .map(p => `\`${p.prefix}\``)
            .join(' ') || '[NONE]';

        const description = [
            `🌐 **Default:** ${defaultPrefixList}`,
            `✅ **Enabled:** ${enabledList}`,
            `❌**Disabled:** ${disabledList}`
        ].join('\n\n');

        const embed = buildEmbed(`📄**${interaction.guild.name}**'s prefixes`,
            description, COLORS.GOOD, interaction.user);

        await interaction.editReply({ embeds: [embed]});
    } catch(error) {
        console.error(`[ERROR] [DATABASE] - ${error}`);
        await interaction.editReply({content: `❌ Error listing prefixes`});
    }

}

// exports
module.exports = { data, execute };