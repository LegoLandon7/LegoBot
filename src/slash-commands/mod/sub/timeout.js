// timeout.js ->  Times out a user
// Landon Lego
// Last updated 2/4/2026

// imports
const { PermissionFlagsBits } = require('discord.js');
const { durationToMs } = require('../../../utils/time.js');

// subcommand data
function data(subcommand) {
    subcommand
        .setName('timeout')
        .setDescription('Times out a user from this guild')
        .addUserOption(o =>
            o.setName('target_user')
                .setDescription('The user to timesout')
                .setRequired(true))
        .addStringOption(o =>
            o.setName('time')
                .setDescription('How long the user is timed out for')
                .setRequired(true))
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

    const reason = interaction.options.getString('reason') || "[NONE]";

    const time = interaction.options.getString('time');
    const timeMs = durationToMs(time);

    // time validation
    if (!timeMs)
        return interaction.editReply({ content: "❌ Time in the wrong format (5d, 6h, 4d8h)."});
    if (timeMs > 1000 * 60 * 60 * 24 * 7 * 4)
        return interaction.editReply({ content: "❌ time cant be longer than 4 weeks (4w)"});

    // permissions
    if (!commandMember.permissions.has(PermissionFlagsBits.ModerateMembers))
        return interaction.editReply({ content: "❌ You need the `Moderate Members` permission."});
    if (!botMember.permissions.has(PermissionFlagsBits.ModerateMembers))
        return interaction.editReply({ content: "❌ I don’t have the `Moderate Members` permission."});

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
        return interaction.editReply({ content: "❌ Cannot kick myself."});
    if (commandUser.id === targetUser.id)
        return interaction.editReply({ content: "❌ Cannot kick yourself."});
    
    // timeout the user
    try {
        // dm
        await targetUser.send(`⏳ You have been timed out from **${interaction.guild.name}**\ntime: \`${time}\`\nreason: ${reason}`)
            .catch(() => console.log(`⚠️ Could not DM ${targetUser.tag}`));

        // timeout
        const endTime = Date.now() + timeMs;
        await targetMember.disableCommunicationUntil(endTime, reason);

        // confirmation
        return interaction.editReply({ content: `✅ Successfully timed out **${targetUser.tag}** for \`${time}\``});
    } catch (error) {
        // unable to timeout
        console.error(error);
        throw error;
    }
}

// exports
module.exports = { data, execute };