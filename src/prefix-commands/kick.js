// kick.js -> Kicks a user
// Landon Lego
// Last updated 2/6/2026

// imports
const { PermissionFlagsBits } = require('discord.js');

// execute command
async function execute(client, message, args) {
    const commandMember = message.member;
    const botMember = message.guild.members.me;
    
    // permissions
    if (!commandMember.permissions.has(PermissionFlagsBits.KickMembers))
        return message.reply("⚠️ You need the `Kick Members` permission.");
    if (!botMember.permissions.has(PermissionFlagsBits.KickMembers))
        return message.reply("⚠️ I don't have the `Kick Members` permission.");
    
    // validate user argument
    if (!args[0])
        return message.reply("⚠️ Please specify a user to kick.");
    
    // parse user ID and reason
    const userId = args[0].replace(/[<@!>]/g, '');
    const reason = args.slice(1).join(' ') || '[NONE]';
    
    // fetch target user
    let targetUser;
    let targetMember;
    
    try {
        targetUser = await client.users.fetch(userId);
        targetMember = await message.guild.members.fetch(userId).catch(() => null);
    } catch (error) {
        console.error(`[ERROR] [KICK] - ${error}`);
        return message.reply("❌ User not found.");
    }
    
    // role hierarchy check
    if (targetMember) {
        if (commandMember.roles.highest.position <= targetMember.roles.highest.position)
            return message.reply("⚠️ User has higher or equal role than you.");
        if (botMember.roles.highest.position <= targetMember.roles.highest.position)
            return message.reply("⚠️ I don't have a high enough role.");
    }
    
    // self checks
    if (targetUser.id === client.user.id)
        return message.reply("⚠️ Cannot kick myself.");
    if (targetUser.id === message.author.id)
        return message.reply("⚠️ Cannot kick yourself.");
    
    // kick the user
    try {
        // send DM
        await targetUser.send(`👢 You have been kicked from **${message.guild.name}**\nReason: ${reason}`)
            .catch(() => console.log(`[ERROR] [KICK] Could not DM ${targetUser.tag}`));

        // kick user
        await targetMember.kick(reason);

        // success reply
        return message.reply(`✅ Successfully kicked **${targetUser.tag}**`);
    } catch (error) {
        console.error(`[ERROR] [KICK] - ${error}`);
        return message.reply("❌ Unable to kick user.");
    }
}
// exports
module.exports = { execute, name: 'kick', structure: 'kick [user] [reason]', cooldown: 0 };