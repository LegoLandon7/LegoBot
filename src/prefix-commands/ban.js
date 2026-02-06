// ban.js -> Bans a user
// Landon Lego
// Last updated 2/6/2026

// imports
const { PermissionFlagsBits } = require('discord.js');

// execute command
async function execute(client, message, args) {
    const commandMember = message.member;
    const botMember = message.guild.members.me;
    
    // permissions
    if (!commandMember.permissions.has(PermissionFlagsBits.BanMembers))
        return message.reply("❌ You need the `Ban Members` permission.");
    if (!botMember.permissions.has(PermissionFlagsBits.BanMembers))
        return message.reply("❌ I don't have the `Ban Members` permission.");
    
    // validate user argument
    if (!args[0])
        return message.reply("❌ Please specify a user to ban.");
    
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
        console.error(`[ERROR] [BAN] - ${error}`);
        return message.reply("❌ User not found.");
    }
    
    // check if already banned
    if (await message.guild.bans.fetch(targetUser.id).catch(() => null))
        return message.reply("❌ User is already banned.");
    
    // role hierarchy check
    if (targetMember) {
        if (commandMember.roles.highest.position <= targetMember.roles.highest.position)
            return message.reply("❌ User has higher or equal role than you.");
        if (botMember.roles.highest.position <= targetMember.roles.highest.position)
            return message.reply("❌ I don't have a high enough role.");
    }
    
    // self checks
    if (targetUser.id === client.user.id)
        return message.reply("❌ Cannot ban myself.");
    if (targetUser.id === message.author.id)
        return message.reply("❌ Cannot ban yourself.");
    
    // ban the user
    try {
        // send DM
        await targetUser.send(`🔨 You have been banned from **${message.guild.name}**\nReason: ${reason}`)
            .catch(() => console.log(`[ERROR] [BAN] Could not DM ${targetUser.tag}`));

        // ban user
        await message.guild.members.ban(targetUser.id, { reason });

        // success reply
        return message.reply(`✅ Successfully banned **${targetUser.tag}**`);
    } catch (error) {
        console.error(`[ERROR] [BAN] - ${error}`);
        return message.reply("❌ Unable to ban user.");
    }
}
// exports
module.exports = { execute, name: 'ban', structure: 'ban [user] [reason]', cooldown: 0 };