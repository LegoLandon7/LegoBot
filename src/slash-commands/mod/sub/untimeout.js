// untimeout.js -> Removes timeout from user (slash)
// Landon Lego
// Last updated 2/4/2026

// imports
const { PermissionFlagsBits } = require('discord.js');

// subcommand data
function data(subcommand) {
    subcommand
        .setName('untimeout')
        .setDescription('Removes timeout from a user in the guild')
        .addUserOption(o =>
            o.setName('target_user')
                .setDescription('The user to remove timeout from')
                .setRequired(true))
        .addStringOption(o =>
            o.setName('reason')
                .setDescription('The reason the users timeout is removed')
                .setRequired(false))
        .addBooleanOption(o =>
            o.setName('ephermeral')
                .setDescription('hide the confiirmation message')
                .setRequired(false));
}

// execute data
async function execute(interaction) {
    const ephermeral = interaction.options.getBoolean('ephermeral') ?? false;
    await interaction.deferReply(ephermeral ? {flags: 64} : {}); // ephermeral

    if (!interaction.inGuild())
        return interaction.editReply({ content: "❌ This command can only be used in servers." });

    // data
    const targetUser = interaction.options.getUser('target_user');
    const targetMember = interaction.options.getMember('target_user');

    const commandUser = interaction.user;
    const commandMember = interaction.member;

    const botUser = interaction.client.user;
    const botMember = interaction.guild.members.me;

    const reason = interaction.options.getString('reason') || "[NONE]";
    const confirmation = interaction.options.getBoolean('confirmation') ?? true;

    // permissions
    if (!commandMember.permissions.has(PermissionFlagsBits.ModerateMembers))
        return interaction.editReply({ content: "⚠️ You need the `Moderate Members` permission."});
    if (!botMember.permissions.has(PermissionFlagsBits.ModerateMembers))
        return interaction.editReply({ content: "⚠️ I don't have the `Moderate Members` permission."});

    // check if in guild
    if (!targetMember)
        return interaction.editReply({ content: "❌ User is not in this guild."});

    // role hierarchy
    if (commandMember.roles.highest.position <= targetMember.roles.highest.position)
        return interaction.editReply({ content: "❌ User has higher or equal role than you."});
    if (botMember.roles.highest.position <= targetMember.roles.highest.position)
        return interaction.editReply({ content: "❌ User has higher or equal role than me."});

    // self checks
    if (targetUser.id === botUser.id)
        return interaction.editReply({ content: "⚠️ Cannot remove timeout from myself."});
    if (commandUser.id === targetUser.id)
        return interaction.editReply({ content: "⚠️ Cannot remove timeout from yourself."});
    
    // removes timeout from the user
    try {
        // send DM
        await targetUser.send(`⏱️ Your timeout has been removed from **${interaction.guild.name}**\nReason: ${reason}`)
            .catch(() => console.log(`[ERROR] [UNTIMEOUT] Could not DM ${targetUser.tag}`));

        // remove timeout
        await targetMember.disableCommunicationUntil(null, reason);

        // success reply
        return interaction.editReply({ content: `✅ Successfully removed timeout from **${targetUser.tag}**`});
    } catch (error) {
        console.error(`[ERROR] [UNTIMEOUT] - ${error}`);
        return interaction.editReply({ content: "✕ Unable to remove timeout."});
    }
}

// exports
module.exports = { data, execute };
