// role.js -> Changes role of a user
// Landon Lego
// Last updated 2/6/2026

// imports
const { PermissionFlagsBits } = require('discord.js');

/**
 * Find closest role match by name
 * @param {string} input - Role name or ID
 * @param {Collection} roles - Guild roles collection
 * @returns {Role|null} Matching role or null
 */
function findRoleMatch(input, roles) {
    // try exact ID match first
    let role = roles.get(input);
    if (role) return role;
    
    // try exact name match
    role = roles.find(r => r.name.toLowerCase() === input.toLowerCase());
    if (role) return role;
    
    // try partial name match (starts with)
    role = roles.find(r => r.name.toLowerCase().startsWith(input.toLowerCase()));
    if (role) return role;
    
    // find closest match using Levenshtein distance
    let closest = null;
    let closestDistance = Infinity;
    const inputLower = input.toLowerCase();
    
    roles.forEach(r => {
        const roleName = r.name.toLowerCase();
        let distance = 0;
        const maxLen = Math.max(inputLower.length, roleName.length);
        
        // simple distance calculation
        for (let i = 0; i < maxLen; i++) {
            if ((inputLower[i] || '').charCodeAt(0) !== (roleName[i] || '').charCodeAt(0)) {
                distance++;
            }
        }
        
        if (distance < closestDistance) {
            closestDistance = distance;
            closest = r;
        }
    });
    
    return closestDistance <= 3 ? closest : null;
}

// execute command
async function execute(client, message, args) {
    const commandMember = message.member;
    const botMember = message.guild.members.me;
    
    // permissions
    if (!commandMember.permissions.has(PermissionFlagsBits.ManageRoles))
        return message.reply("⚠️ You need the `Manage Roles` permission.");
    if (!botMember.permissions.has(PermissionFlagsBits.ManageRoles))
        return message.reply("⚠️ I don't have the `Manage Roles` permission.");
    
    // validate user argument
    if (!args[0])
        return message.reply("⚠️ Please specify a user.");
    
    // validate role argument
    if (!args[1])
        return message.reply("⚠️ Please specify a role.");
    
    // parse user ID, role, action, and reason
    const userId = args[0].replace(/[<@!>]/g, '');
    const roleInput = args[1];
    
    // determine action (add/remove/toggle)
    let action = 'toggle';
    let reasonStart = 2;
    if (args[2] && ['add', 'remove', 'toggle'].includes(args[2].toLowerCase())) {
        action = args[2].toLowerCase();
        reasonStart = 3;
    }
    
    const reason = args.slice(reasonStart).join(' ') || '[NONE]';
    
    // fetch target user
    let targetUser;
    let targetMember;
    
    try {
        targetUser = await client.users.fetch(userId);
        targetMember = await message.guild.members.fetch(userId).catch(() => null);
    } catch (error) {
        console.error(`[ERROR] [ROLE] - ${error}`);
        return message.reply("❌ User not found.");
    }
    
    // fetch role
    let newRole;
    try {
        newRole = findRoleMatch(roleInput, message.guild.roles.cache);
        if (!newRole)
            return message.reply(`❌ Role not found. Try a different name or role ID.`);
    } catch (error) {
        console.error(`[ERROR] [ROLE] - ${error}`);
        return message.reply("❌ Role not found.");
    }
    
    // check if in guild
    if (!targetMember)
        return message.reply("⚠️ User is not in this guild.");
    
    // role hierarchy check
    if (commandMember.roles.highest.position <= targetMember.roles.highest.position && message.author.id !== targetUser.id)
        return message.reply("⚠️ User has higher or equal role than you.");
    if (botMember.roles.highest.position <= targetMember.roles.highest.position)
        return message.reply("⚠️ I don't have a high enough role.");
    if (botMember.roles.highest.position <= newRole.position)
        return message.reply("⚠️ I cannot manage that role.");
    
    // self checks
    if (targetUser.id === client.user.id)
        return message.reply("⚠️ Cannot change my own roles.");
    
    // change the role of the user
    try {
        // manage role
        let newAction = '';
        
        if (action === 'toggle') {
            if (targetMember.roles.cache.has(newRole.id)) {
                await targetMember.roles.remove(newRole, reason);
                newAction = 'remove';
            } else {
                await targetMember.roles.add(newRole, reason);
                newAction = 'add';
            }
        }
        
        if (action === 'add') {
            if (targetMember.roles.cache.has(newRole.id))
                return message.reply("⚠️ User already has this role.");
            await targetMember.roles.add(newRole, reason);
            newAction = 'add';
        }
        
        if (action === 'remove') {
            if (!targetMember.roles.cache.has(newRole.id))
                return message.reply("⚠️ User does not have this role.");
            await targetMember.roles.remove(newRole, reason);
            newAction = 'remove';
        }
        
        const actionVerb = newAction === 'add' ? 'added' : 'removed';
        
        // send DM
        await targetUser.send(`🎭 Your role **${newRole.name}** has been **${actionVerb}** in **${message.guild.name}**\nReason: ${reason}`)
            .catch(() => console.log(`[ERROR] [ROLE] Could not DM ${targetUser.tag}`));
        
        // success reply
        return message.reply(`✅ Successfully **${actionVerb}** role **${newRole.name}** ${newAction === 'add' ? 'to' : 'from'} **${targetUser.tag}**`);
    } catch (error) {
        console.error(`[ERROR] [ROLE] - ${error}`);
        return message.reply("❌ Unable to change role.");
    }
}
// exports
module.exports = { execute, name: 'role', structure: 'role [user] [role] [add/remove/toggle] [reason]', cooldown: 0 };