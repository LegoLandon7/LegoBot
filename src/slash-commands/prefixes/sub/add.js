// add.js -> adds a prefix
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
        .setName('add')
        .setDescription('Adds a prefix to the guild')
        .addStringOption(o =>
            o.setName('prefix')
                .setDescription('The prefix to add')
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

    // validations
    const countStmt = db.prepare('SELECT COUNT(*) AS total FROM prefixes WHERE guild_id = ?');
    const result = countStmt.get(guildId);
    const prefixCount = result.total;

    if (prefixCount > MAX_PREFIX_AMOUNT) 
        return interaction.editReply({ content: `❌ Max prefix amount of **${MAX_PREFIX_AMOUNT}**. Try removing some prefixes.`});
    if (prefix.length > MAX_PREFIX_LENGTH)
        return interaction.editReply({ content: `❌ Max prefix length of **${MAX_PREFIX_LENGTH}** characters.`});

    try {
        // add prefix
        const stmt = db.prepare('INSERT INTO prefixes (guild_id, prefix) VALUES (?, ?)');
        const result = stmt.run(guildId, prefix);

        // reply
        const embed = buildEmbed('✅ Added prefix', `**Prefix:** \`${prefix}\``, 
            COLORS.GOOD, interaction.user);

        await interaction.editReply({ embeds: [embed]});
    } catch(error) {
        // error
        console.error(`[ERROR] [DATABASE] - ${error}`);
         if (error.message.includes('UNIQUE constraint'))
            await interaction.editReply({content: `❌ Prefix already exists for this server`});
        else
            await interaction.editReply({content: `❌ Error adding prefix`});
    }

}

// exports
module.exports = { data, execute };