// setnick.js -> Changes nickname of a user
// Landon Lego
// Last updated 2/6/2026

// imports
const { PermissionFlagsBits } = require('discord.js');
// execute command
async function execute(client, message, args) {
    const commandMember = message.member;
    const botMember = message.guild.members.me;
    
    // permissions
    if (!commandMember.permissions.has(PermissionFlagsBits.ManageNicknames))
        return message.reply("❌ You need the `Manage Nicknames` permission.");
    if (!botMember.permissions.has(PermissionFlagsBits.ManageNicknames))
        return message.reply("❌ I don't have the `Manage Nicknames` permission.");
    
    // validate user argument
    if (!args[0])
        return message.reply("❌ Please specify a user to change nickname.");
    
    // parse user ID
    const userId = args[0].replace(/[<@!>]/g, '');
    
    // get nickname
    let newNick = null;
    let reason = '[NONE]';
    
    // if args provided, use as nickname; else reset
    if (args.length > 1) {
        newNick = args.slice(1).join(' ');
    }
    // if no args[1], newNick stays null (resets nickname)
    
    // fetch target user
    let targetUser;
    let targetMember;
    
    try {
        targetUser = await client.users.fetch(userId);
        targetMember = await message.guild.members.fetch(userId).catch(() => null);
    } catch (error) {
        console.error(`[ERROR] [SETNICK] - ${error}`);
        return message.reply("❌ User not found.");
    }
    
    // check if in guild
    if (!targetMember)
        return message.reply("❌ User is not in this guild.");
    
    // role hierarchy check
    if (commandMember.roles.highest.position <= targetMember.roles.highest.position && message.author.id !== targetUser.id)
        return message.reply("❌ User has higher or equal role than you.");
    if (botMember.roles.highest.position <= targetMember.roles.highest.position)
        return message.reply("❌ I don't have a high enough role.");
    
    // self checks
    if (targetUser.id === client.user.id)
        return message.reply("❌ Cannot change my own nickname.");
    
    // change the nickname
    try {
        // send DM
        await targetUser.send(`🔤 Your nickname has been changed in **${message.guild.name}**\nNew Nickname: **${newNick ? newNick : targetUser.tag}**\nReason: ${reason}`)
            .catch(() => console.log(`[ERROR] [SETNICK] Could not DM ${targetUser.tag}`));
        
        // set nickname
        await targetMember.setNickname(newNick, reason);
        
        // success reply
        return message.reply(`✅ Successfully changed **${targetUser.tag}**'s nickname to **${newNick ? newNick : targetUser.tag}**`);
    } catch (error) {
        console.error(`[ERROR] [SETNICK] - ${error}`);
        return message.reply("❌ Unable to change nickname.");
    }
}
// exports
module.exports = { execute, name: 'setnick', structure: 'setnick [user] [new_nick/reset]', cooldown: 0 };