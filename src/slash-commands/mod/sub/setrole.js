// setrole.js ->  Changes the role of a user
// Landon Lego
// Last updated 2/4/2026

// imports
const { PermissionFlagsBits } = require('discord.js');

// subcommand data
function data(subcommand) {
    subcommand
        .setName('setrole')
        .setDescription('Sets the role of a user')
        .addUserOption(o =>
            o.setName('target_user')
                .setDescription('The user to set role')
                .setRequired(true))
        .addRoleOption(o =>
            o.setName('role')
                .setDescription('The role to add or remove')
                .setRequired(true))
        .addStringOption(o =>
            o.setName('action')
                .setDescription('Whether to add or remove the role')
                .setRequired(false)
                .addChoices(
                    { name: 'Toggle (default)', value: 'toggle' },
                    { name: 'Add', value: 'add' },
                    { name: 'Remove', value: 'remove' }
                ))
        .addStringOption(o =>
            o.setName('reason')
                .setDescription('The reason the user\'s role is changed')
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

    const newRole = interaction.options.getRole('role');
    const action = interaction.options.getString('action') || 'toggle';
    const reason = interaction.options.getString('reason') || "[NONE]";

    // permissions
    if (!commandMember.permissions.has(PermissionFlagsBits.ManageRoles))
        return interaction.editReply({ content: "❌ You need the `Manage Roles` permission."});
    if (!botMember.permissions.has(PermissionFlagsBits.ManageRoles))
        return interaction.editReply({ content: "❌ I don’t have the `Manage Roles` permission."});

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
        return interaction.editReply({ content: "❌ Cannot change the role of myself."});
    
    // change the role of the user
    try {
        // change role
        let newAction = '';

        if (action == 'toggle') {
            if (targetMember.roles.cache.has(newRole.id)) {
                await targetMember.roles.remove(newRole, reason);
                newAction = 'remove'
            } else {
                await targetMember.roles.add(newRole, reason);
                newAction = 'add';
            }
        }

        if (action == 'add') {
            if (targetMember.roles.cache.has(newRole.id))
                return interaction.editReply({ content: "⚠️ User already has this role."});
            await targetMember.roles.add(newRole, reason);
            newAction = 'add';
        }

        if (action == 'remove') {
            if (!targetMember.roles.cache.has(newRole.id))
                return interaction.editReply({ content: "⚠️ User does not have this role."});
            await targetMember.roles.remove(newRole, reason);
            newAction = 'remove';
        }

        const actionVerb = newAction === 'add' ? 'added' : 'removed';

        // dm
        await targetUser.send({content: `🎭 Your role **${newRole.name}** has been **${actionVerb}** in **${interaction.guild.name}**\nreason: ${reason}`})
            .catch(() => console.log(`⚠️ Could not DM ${targetUser.tag}`));

        // confirmation
        return interaction.editReply({ content: `✅ Successfully **${actionVerb}** role **${newRole.name}** ${newAction === 'add' ? 'to' : 'from'} **${targetUser.tag}**`});
    } catch (error) {
        // unable to change role
        console.error(`[ERROR] [MODERATION] ${error}`);
        throw error;
    }
}

// exports
module.exports = { data, execute };