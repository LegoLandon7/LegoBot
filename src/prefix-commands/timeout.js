// timeout.js -> Times out a user
// Landon Lego
// Last updated 2/6/2026

// imports
const { PermissionFlagsBits } = require('discord.js');
const { durationToMs } = require('../utils/time.js');

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
        return message.reply("❌ Please specify a user to timeout.");
    
    // validate time argument
    if (!args[1])
        return message.reply("❌ Please specify a duration (5d, 6h, 4d8h).");
    
    // parse user ID, time, and reason
    const userId = args[0].replace(/[<@!>]/g, '');
    const time = args[1];
    const timeMs = durationToMs(time);
    const reason = args.slice(2).join(' ') || '[NONE]';
    
    // validate time duration
    if (!timeMs)
        return message.reply("❌ Invalid time format. Use (5d, 6h, 4d8h).");
    if (timeMs > 1000 * 60 * 60 * 24 * 7 * 4)
        return message.reply("❌ Duration cannot exceed 4 weeks.");
    
    // fetch target user
    let targetUser;
    let targetMember;
    
    try {
        targetUser = await client.users.fetch(userId);
        targetMember = await message.guild.members.fetch(userId).catch(() => null);
    } catch (error) {
        console.error(`[ERROR] [TIMEOUT] - ${error}`);
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
        return message.reply("❌ Cannot timeout myself.");
    if (targetUser.id === message.author.id)
        return message.reply("❌ Cannot timeout yourself.");
    
    // timeout the user
    try {
        // send DM
        await targetUser.send(`⏳ You have been timed out from **${message.guild.name}**\nDuration: \`${time}\`\nReason: ${reason}`)
            .catch(() => console.log(`[ERROR] [TIMEOUT] Could not DM ${targetUser.tag}`));
        
        // apply timeout
        const endTime = Date.now() + timeMs;
        await targetMember.disableCommunicationUntil(endTime, reason);
        
        // success reply
        return message.reply(`✅ Successfully timed out **${targetUser.tag}** for \`${time}\``);
    } catch (error) {
        console.error(`[ERROR] [TIMEOUT] - ${error}`);
        return message.reply("❌ Unable to timeout user.");
    }
}
// exports
module.exports = { execute, name: 'timeout', structure: 'timeout [user] [time] [reason]', cooldown: 0 };