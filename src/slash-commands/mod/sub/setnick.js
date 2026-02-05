// setnick.js ->  Changes the nickname of a user
// Landon Lego
// Last updated 2/4/2026

// imports
const { PermissionFlagsBits } = require('discord.js');

// subcommand data
function data(subcommand) {
    subcommand
        .setName('setnick')
        .setDescription('Sets the nickname of a user')
        .addUserOption(o =>
            o.setName('target_user')
                .setDescription('The user to set nickname')
                .setRequired(true))
        .addStringOption(o =>
            o.setName('new_nick')
                .setDescription('The new nickname (empty to reset)')
                .setRequired(false))
        .addStringOption(o =>
            o.setName('reason')
                .setDescription('The reason the user is timed out')
                .setRequired(false))
        .addBooleanOption(o =>
            o.setName('ephermeral')
                .setDescription('Hide the confiirmation message')
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

    const newNick = interaction.options.getString('new_nick') || null;

    const reason = interaction.options.getString('reason') || "[NONE]";

    // permissions
    if (!commandMember.permissions.has(PermissionFlagsBits.ManageNicknames))
        return interaction.editReply({ content: "❌ You need the `Manage Nicknames` permission."});
    if (!botMember.permissions.has(PermissionFlagsBits.ManageNicknames))
        return interaction.editReply({ content: "❌ I don’t have the `Manage Nicknames` permission."});

    // check if in guild
    if (!targetMember)
        return interaction.editReply({ content: "❌ User is not in this guild."});

    // role hierarchy
    if (commandMember.roles.highest.position <= targetMember.roles.highest.position && commandUser.id !== targetUser.id)
        return interaction.editReply({ content: "❌ User has higher or equal role than you."});
    if (botMember.roles.highest.position <= targetMember.roles.highest.position)
        return interaction.editReply({ content: "❌ User has higher or equal role than me."});

    // self checks
    if (targetUser.id === botUser.id)
        return interaction.editReply({ content: "❌ Cannot change the nickname of myself."});
    
    // change the nickname of the user
    try {
        // dm
        await targetUser.send(`🔤 Your nickname has been changed in **${interaction.guild.name}**\nnew nickname: **${newNick ? newNick : targetUser.tag}**\nreason: ${reason}`)
            .catch(() => console.log(`⚠️ Could not DM ${targetUser.tag}`));

        // change nickname
        await targetMember.setNickname(newNick, reason);

        // confirmation
        return interaction.editReply({ content: `✅ Successfully changed the nickname of **${targetUser.tag}** to **${newNick ? newNick : targetUser.tag}**`});
    } catch (error) {
        // unable to change nickname
        console.error(error);
        throw error;
    }
}

// exports
module.exports = { data, execute };