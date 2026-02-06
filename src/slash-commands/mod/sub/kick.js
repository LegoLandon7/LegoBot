// kick.js -> Kicks a user 
// Landon Lego
// Last updated 2/4/2026

// imports
const { PermissionFlagsBits } = require('discord.js');

// subcommand data
function data(subcommand) {
    subcommand
        .setName('kick')
        .setDescription('Kicks a user from this guild')
        .addUserOption(o =>
            o.setName('target_user')
                .setDescription('The user to kick')
                .setRequired(true))
        .addStringOption(o =>
            o.setName('reason')
                .setDescription('The reason the user is kicked')
                .setRequired(false))
        .addBooleanOption(o =>
            o.setName('ephermeral')
                .setDescription('hide the confirmation message')
                .setRequired(false));
}

// execute data
async function execute(interaction) {
    const ephemeral = interaction.options.getBoolean('ephemeral') ?? false;
    await interaction.deferReply(ephemeral ? {flags: 64} : {});

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
    if (!commandMember.permissions.has(PermissionFlagsBits.KickMembers))
        return interaction.editReply({ content: "❌ You need the `Kick Members` permission."});
    if (!botMember.permissions.has(PermissionFlagsBits.KickMembers))
        return interaction.editReply({ content: "❌ I don't have the `Kick Members` permission."});

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
    
    // kick the user
    try {
        // send DM
        await targetUser.send(`👢 You have been kicked from **${interaction.guild.name}**\nReason: ${reason}`)
            .catch(() => console.log(`[ERROR] [KICK] Could not DM ${targetUser.tag}`));

        // execute kick
        await targetMember.kick(reason);

        // success reply
        return interaction.editReply({ content: `✅ Successfully kicked **${targetUser.tag}**`});
    } catch (error) {
        console.error(`[ERROR] [KICK] - ${error}`);
        return interaction.editReply({ content: "✕ Unable to kick user."});
    }
}

// exports
module.exports = { data, execute };
