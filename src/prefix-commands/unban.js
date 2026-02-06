// unban.js -> Unbans a user
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
        return message.reply("❌ Please specify a user to unban.");
    
    // parse user ID and reason
    const userId = args[0].replace(/[<@!>]/g, '');
    const reason = args.slice(1).join(' ') || '[NONE]';
    
    // fetch target user
    let targetUser;
    
    try {
        targetUser = await client.users.fetch(userId);
    } catch (error) {
        console.error(`[ERROR] [UNBAN] - ${error}`);
        return message.reply("❌ User not found.");
    }
    
    // check if user is banned
    if (!await message.guild.bans.fetch(targetUser.id).catch(() => null))
        return message.reply("❌ User is not banned.");
    
    // self checks
    if (targetUser.id === client.user.id)
        return message.reply("❌ Cannot unban myself.");
    if (targetUser.id === message.author.id)
        return message.reply("❌ Cannot unban yourself.");
    
    // unban the user
    try {
        // send DM
        await targetUser.send(`🔨 You have been unbanned from **${message.guild.name}**\nReason: ${reason}`)
            .catch(() => console.log(`[ERROR] [UNBAN] Could not DM ${targetUser.tag}`));
        
        // unban user
        await message.guild.members.unban(targetUser.id, reason);
        
        // success reply
        return message.reply(`✅ Successfully unbanned **${targetUser.tag}**`);
    } catch (error) {
        console.error(`[ERROR] [UNBAN] - ${error}`);
        return message.reply("❌ Unable to unban user.");
    }
}
// exports
module.exports = { execute, name: 'unban', structure: 'unban [user] [reason]', cooldown: 0 };