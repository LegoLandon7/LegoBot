// untimeout.js -> Removes timeout from user
// Landon Lego
// Last updated 2/6/2026

// imports
const { PermissionFlagsBits } = require('discord.js');
// execute command
async function execute(client, message, args) {
    const commandMember = message.member;
    const botMember = message.guild.members.me;
    
    // permissions
    if (!commandMember.permissions.has(PermissionFlagsBits.ModerateMembers))
        return message.reply("❌ You need the `Moderate Members` permission.");
    if (!botMember.permissions.has(PermissionFlagsBits.ModerateMembers))
        return message.reply("❌ I don't have the `Moderate Members` permission.");
    
    // validate user argument
    if (!args[0])
        return message.reply("❌ Please specify a user to remove timeout from.");
    
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
        console.error(`[ERROR] [UNTIMEOUT] - ${error}`);
        return message.reply("❌ User not found.");
    }
    
    // check if in guild
    if (!targetMember)
        return message.reply("❌ User is not in this guild.");
    
    // role hierarchy check
    if (commandMember.roles.highest.position <= targetMember.roles.highest.position)
        return message.reply("❌ User has higher or equal role than you.");
    if (botMember.roles.highest.position <= targetMember.roles.highest.position)
        return message.reply("❌ I don't have a high enough role.");
    
    // self checks
    if (targetUser.id === client.user.id)
        return message.reply("❌ Cannot remove timeout from myself.");
    if (targetUser.id === message.author.id)
        return message.reply("❌ Cannot remove timeout from yourself.");
    
    // remove timeout from the user
    try {
        // send DM
        await targetUser.send(`⏳ Your timeout has been removed from **${message.guild.name}**\nReason: ${reason}`)
            .catch(() => console.log(`[ERROR] [UNTIMEOUT] Could not DM ${targetUser.tag}`));
        
        // remove timeout
        await targetMember.disableCommunicationUntil(null, reason);
        
        // success reply
        return message.reply(`✅ Successfully removed timeout from **${targetUser.tag}**`);
    } catch (error) {
        console.error(`[ERROR] [UNTIMEOUT] - ${error}`);
        return message.reply("❌ Unable to remove timeout.");
    }
}
// exports
module.exports = { execute, name: 'untimeout', structure: 'untimeout [user] [reason]', cooldown: 0 };