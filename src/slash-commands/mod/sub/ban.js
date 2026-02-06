// ban.js -> Bans a user (slash)
// Landon Lego
// Last updated 2/6/2026

// imports
const { PermissionFlagsBits } = require('discord.js');

// subcommand data
function data(subcommand) {
    subcommand
        .setName('ban')
        .setDescription('Bans a user')
        .addUserOption(o =>
            o.setName('target_user')
                .setDescription('The user to ban')
                .setRequired(true))
        .addStringOption(o =>
            o.setName('reason')
                .setDescription('The reason the user is banned')
                .setRequired(false))
        .addBooleanOption(o =>
            o.setName('ephemeral')
                .setDescription('Hide the confirmation message')
                .setRequired(false));
}

// execute data
async function execute(interaction) {
    const ephemeral = interaction.options.getBoolean('ephemeral') ?? false;
    await interaction.deferReply(ephemeral ? { flags: 64 } : {});

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

    // permissions
    if (!commandMember.permissions.has(PermissionFlagsBits.BanMembers))
        return interaction.editReply({ content: "❌ You need the `Ban Members` permission."});
    if (!botMember.permissions.has(PermissionFlagsBits.BanMembers))
        return interaction.editReply({ content: "❌ I don't have the `Ban Members` permission."});

    // already banned
    if (await interaction.guild.bans.fetch(targetUser.id).catch(() => null))
        return interaction.editReply({ content: "❌ User is already banned."});

    // role hierarchy
    if (targetMember) {
        if (commandMember.roles.highest.position <= targetMember.roles.highest.position)
            return interaction.editReply({ content: "❌ User has higher or equal role than you."});
        if (botMember.roles.highest.position <= targetMember.roles.highest.position)
            return interaction.editReply({ content: "❌ User has higher or equal role than me."});
    }

    // self checks
    if (targetUser.id === botUser.id)
        return interaction.editReply({ content: "❌ Cannot ban myself."});
    if (commandUser.id === targetUser.id)
        return interaction.editReply({ content: "❌ Cannot ban yourself."});
    
    // ban the user
    try {
        // send DM
        await targetUser.send(`📨 You have been banned from **${interaction.guild.name}**\nReason: ${reason}`)
            .catch(() => console.log(`[ERROR] [BAN] Could not DM ${targetUser.tag}`));

        // execute ban
        await interaction.guild.members.ban(targetUser.id, { reason });

        // success reply
        return interaction.editReply({ content: `✅ Successfully banned **${targetUser.tag}**`});
    } catch (error) {
        console.error(`[ERROR] [BAN] - ${error}`);
        return interaction.editReply({ content: "✕ Unable to ban user."});
    }
}

// exports
module.exports = { data, execute };
