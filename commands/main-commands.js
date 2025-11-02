import { Client, GatewayIntentBits, EmbedBuilder, PermissionsBitField, ActionRowBuilder, ButtonBuilder } from "discord.js";
import { parseDuration,  fetchMember, fetchUser, getFolderSize} from "../functions/utilities.js";
import { getLogChannel, setLogChannel, getWelcomeChannel, setWelcomeChannel } from "../logging/functions/save-log-channels.js";
import { addTrigger, removeTrigger, getTriggers } from "../triggers/save-trigger.js";
import { doLogging, purgeLog } from "../logging/logger.js";
import { logMessage } from "../logging/functions/logging.js";
import { zipGuildLogs } from "../logging/functions/log-files.js";
import { goAfk, isAfk } from "../afk/afker.js";

export const PREFIX = "$";
const EMBED_COLOR = "#676767";
const EMBED_DESC = "This is the best bot ever made!";

// commands
export function doCommands(client) {
    client.on("messageCreate", async (msg) => {
        if (msg.author.bot) return;

        const args = msg.content.trim().split(/ +/);
        const command = args.shift().toLowerCase();

        try { // global

            //-----------------ping----------------
            if (command === `${PREFIX}ping`) {
                try {
                    const embed = new EmbedBuilder()
                        .setTitle("🏓 Ping Results 🏓")
                        .setDescription("Calculating ping…")
                        .setColor(EMBED_COLOR)
                        .setFooter({ text: EMBED_DESC })
                        .setTimestamp();

                    const sent = await msg.reply({ embeds: [embed] });
                    const roundTrip = sent.createdTimestamp - msg.createdTimestamp;
                    const wsPing = client.ws.ping > 0 ? Math.round(client.ws.ping) : "N/A";

                    embed.setDescription(null).setFields(
                        { name: "Round-trip", value: `${roundTrip}ms`, inline: true },
                        { name: "WebSocket", value: `${wsPing}ms`, inline: true }
                    );

                    await sent.edit({ embeds: [embed] });
                } catch (err) {
                    console.error("Ping error:", err);
                    msg.reply("❌ Something went wrong while calculating ping.");
                }
            }

            //-----------------help----------------
            if (command === `${PREFIX}help`) {
                // page1
                const page1 = new EmbedBuilder()
                    .setTitle("Help Menu (1/7)")
                    .setDescription("Main Commands")
                    .setColor(EMBED_COLOR)
                    .addFields(
                        { name: "prefix: ", value: PREFIX },
                        { name: "help [page]", value: "Shows this menu of commands" },
                        { name: "bot-info", value: "Shows info about the bot" },
                        { name: "ping", value: "Gets the ping of the bot" },
                        { name: "afk [reason] ", value: "Go afk" }
                    )
                    .setFooter({ text: EMBED_DESC })
                    .setTimestamp();

                // page2
                const page2 = new EmbedBuilder()
                    .setTitle("Help Menu (2/7)")
                    .setDescription("Info Commands")
                    .setColor(EMBED_COLOR)
                    .addFields(
                        { name: "avatar [user]", value: "Shows a users avatar" },
                        { name: "user-info [user]", value: "Shows a users info" },
                        { name: "server-info", value: "Shows a servers info" }
                    )
                    .setFooter({ text: EMBED_DESC });

                // page3
                const page3 = new EmbedBuilder()
                    .setTitle("Help Menu (3/7)")
                    .setDescription("Moderation Commands")
                    .setColor(EMBED_COLOR)
                    .addFields(
                        { name: "ban [user] [reason]", value: "Bans a user" },
                        { name: "unban [user]", value: "Unbans a user" },
                        { name: "kick [user] [reason]", value: "Kicks a user" },
                        { name: "timeout [user] [duration] [reason]", value: "Times out a user" },
                        { name: "untimeout [user]", value: "Removes timeout from a user" }
                    )
                    .setFooter({ text: EMBED_DESC });

                // page4
                const page4 = new EmbedBuilder()
                    .setTitle("Help Menu (4/7)")
                    .setDescription("Moderation Commands (extended)")
                    .setColor(EMBED_COLOR)
                    .addFields(
                        { name: "set-nick [user] [nickname]", value: "Changes nickname of a user" },
                        { name: "role [user] [role]", value: "Changes role of a user" },
                        { name: "purge [amount]", value: "Purges messages" },
                        { name: "echo [channel] [text]", value: "Echos a message in a channel" }
                    )
                    .setFooter({ text: EMBED_DESC });

                // page5
                const page5 = new EmbedBuilder()
                    .setTitle("Help Menu (5/7)")
                    .setDescription("Logging Commands")
                    .setColor(EMBED_COLOR)
                    .addFields(
                        { name: "set-log [channel]", value: "sets, removes, or changes log channel" },
                        { name: "log-channel", value: "gets current log channel" },
                        { name: "set-welcome [channel]", value: "sets, removes, or changes welcome channel" },
                        { name: "welcome-channel", value: "gets current welcome channel" },
                        { name: "download-logs", value: "downloads logs as a zip file" }
                    )
                    .setFooter({ text: EMBED_DESC });

                // page6
                const page6 = new EmbedBuilder()
                    .setTitle("Help Menu (6/7)")
                    .setDescription("Trigger Commands")
                    .setColor(EMBED_COLOR)
                    .addFields(
                        { name: "add-trigger [trigger] | [message]", value: "adds a trigger" },
                        { name: "remove-trigger [trigger]", value: "removes a trigger" },
                        { name: "list-triggers", value: "list all triggers" }
                    )
                    .setFooter({ text: EMBED_DESC });

                // page7
                const page7 = new EmbedBuilder()
                    .setTitle("Help Menu (7/7)")
                    .setDescription("N/A")
                    .setColor(EMBED_COLOR)
                    .addFields(
                        { name: "N/A", value: "No commands on this page" }
                    )
                    .setFooter({ text: EMBED_DESC });

                    
                const pages = [page1, page2, page3, page4, page5, page6, page7];

                // input
                let currentPage;
                args[0] ? (currentPage = parseInt(args[0]) - 1) : (currentPage = 0);

                // range check
                if (isNaN(currentPage) || currentPage < 0 || currentPage >= pages.length)
                    return msg.reply(`❌ That page doesn't exist, please give a page between 1 and ${pages.length}`);

                // build row
                const row = new ActionRowBuilder().addComponents(
                    new ButtonBuilder().setCustomId("prev").setLabel("◀️").setStyle(1),
                    new ButtonBuilder().setCustomId("next").setLabel("▶️").setStyle(1)
                );

                const message = await msg.reply({ embeds: [pages[currentPage]], components: [row] });

                const collector = message.createMessageComponentCollector({
                    time: 120000, // 120 seconds
                    filter: (i) => i.user.id === msg.author.id,
                });

                collector.on("collect", async (interaction) => {
                    if (interaction.customId === "prev") { // prev
                        currentPage = (currentPage - 1 + pages.length) % pages.length;
                    } else if (interaction.customId === "next") { // next
                        currentPage = (currentPage + 1) % pages.length;
                    }

                    await interaction.update({ embeds: [pages[currentPage]], components: [row] });
                });

                collector.on("end", () => {
                    try {
                        message.edit({ components: [] }); // remove buttons after timeout
                    } catch(err) {
                        console.error(err);
                    }
                });
            }

            //-----------------echo----------------
            if (command === `${PREFIX}echo`) {
                // first arg is a channel mention
                let targetChannel;
                let text;
                
                const channelMention = msg.mentions.channels.first();
                if (channelMention) {
                    targetChannel = channelMention;
                    text = args.slice(1).join(" "); // rest is the text
                } else {
                    // default to current channel, all args = text
                    targetChannel = msg.channel;
                    text = args.join(" ");
                }

                if (!text) return msg.reply("❌ You need to provide something to echo.");

                try {
                    // send message
                    await msg.delete().catch(() => {});
                    await targetChannel.send(text);
                } catch (err) {
                    console.error("Failed to echo message:", err);
                    msg.reply("❌ Could not send message. Make sure I have permission to send messages in that channel.");
                }
            }

            //-----------------user-info----------------
            if (command === `${PREFIX}user-info`) {
                try {
                    // get member info
                    const member = await fetchMember(msg, args[0]?.trim() || null);
                    if (!member) return msg.reply("❌ Could not find that user");

                    // create embed
                    const embed = new EmbedBuilder()
                        .setTitle(`${member.user.username}#${member.user.discriminator}`)
                        .setThumbnail(member.user.displayAvatarURL({ dynamic: true, size: 1024 }))
                        .setColor(EMBED_COLOR)
                        .addFields(
                            // line 1
                            { name: "ID", value: member.id, inline: false },

                            // line 2
                            { name: "Bot?", value: member.user.bot ? "Yes" : "No", inline: false },

                            // line 3
                            { name: "Account Created", value: `<t:${Math.floor(member.user.createdTimestamp / 1000)}:F>`, inline: false },

                            // line 4
                            { name: "Joined Server", value: `<t:${Math.floor(member.joinedTimestamp / 1000)}:F>`, inline: false },

                            // line 5
                            { name: "Nickname", value: member.nickname || "None", inline: false },

                            // line 6
                            { name: "Roles", value: member.roles.cache.filter(r => r.name !== "@everyone").map(r => `<@&${r.id}>`).join(" ") || "None", inline: false }
                        )
                    .setFooter({ text: EMBED_DESC })
                        .setTimestamp();

                    // send embed
                    msg.reply({ embeds: [embed] });
                } catch (err) {
                    console.error("Userinfo error:", err);
                    msg.reply("❌ Something went wrong while fetching user info");
                }
            }

            //-----------------server-info----------------
            if (command === `${PREFIX}server-info`) {
                try {
                    // get basic guild info
                    const { guild } = msg;

                    const embed = new EmbedBuilder()
                        .setTitle(`${guild.name} Server Info`)
                        .setThumbnail(guild.iconURL({ dynamic: true, size: 1024 }))
                        .setColor(EMBED_COLOR)
                        .addFields(
                            // line 1
                            { name: "Server ID", value: guild.id, inline: false },

                            // line 2
                            { name: "Owner", value: `<@${guild.ownerId}>`, inline: true },
                            { name: "Region", value: guild.preferredLocale, inline: true },
                            { name: "Boosts", value: `${guild.premiumSubscriptionCount} (Level ${guild.premiumTier})`, inline: true },

                            // line 3
                            { name: "Members", value: `${guild.memberCount}`, inline: true },
                            { name: "Roles", value: `${guild.roles.cache.size}`, inline: true },
                            { name: "Channels", value: `${guild.channels.cache.size}`, inline: true },

                            // line 4
                            { name: "Created On", value: `<t:${Math.floor(guild.createdTimestamp / 1000)}:F>`, inline: false }
                        )
                        .setFooter({ text: EMBED_DESC })
                        .setTimestamp();

                    await msg.reply({ embeds: [embed] });
                } catch(err) {
                    console.error("Serverinfo error:", err);
                    msg.reply("❌ Something went wrong while fetching server info");
                }
            }

            //-----------------avatar----------------
            if (command === `${PREFIX}avatar`) {
                try {
                    const member = await fetchMember(msg, args[0]?.trim() || null);
                    if (!member) return msg.reply("❌ Could not find that user");

                    const user = member.user;
                    const embed = new EmbedBuilder()
                        .setTitle(`${user.username}'s Avatar`)
                        .setImage(user.displayAvatarURL({ dynamic: true, size: 1024 }))
                        .setColor(EMBED_COLOR)
                        .setDescription(
                            `[PNG](${user.displayAvatarURL({ format: "png", size: 1024 })}) | [JPG](${user.displayAvatarURL({ format: "jpg", size: 1024 })}) | [WEBP](${user.displayAvatarURL({ format: "webp", size: 1024 })})`
                        )
                        .setFooter({ text: EMBED_DESC })

                    msg.reply({ embeds: [embed] });
                } catch(err) {
                    console.error("Avatar error:", err);
                    msg.reply("❌ Something went wrong while fetching avatar");
                }
            }

            //-----------------bot-info----------------
            if (command === `${PREFIX}bot-info`) {
                const embed = new EmbedBuilder()
                    .setTitle("LegoBot Info")
                    .setDescription("This is a bot made as a side-project using Node.js")
                    .setColor(EMBED_COLOR)
                    .addFields(
                        { name: "Creator", value: "cc_landonlego", inline: false },
                        { name: "GitHub", value: "[github](https://github.com/LegoLandon7/LegoBot)", inline: true },
                        { name: "Invite Link", value: "[invite bot](https://discord.com/oauth2/authorize?client_id=1432705622771765439&permissions=8&integration_type=0&scope=bot+applications.commands)", inline: true },
                        { name: "Bot Size", value: `${getFolderSize("../")}`, inline: false }
                    )
                    .setFooter({ text: EMBED_DESC })
                    .setTimestamp();

                await msg.reply({ embeds: [embed] });
            }

            //-----------------ban----------------
            if (command === `${PREFIX}ban`) {
                try {
                    // permissions
                    if (!msg.member.permissions.has(PermissionsBitField.Flags.BanMembers)) 
                        return msg.reply("❌ You don't have permission to ban members");
                    if (!msg.guild.members.me.permissions.has(PermissionsBitField.Flags.BanMembers)) 
                        return msg.reply("❌ I don't have permission to ban members");
                    const user = await fetchUser(msg, args[0]?.trim() || null);
                    if (!user) return msg.reply("❌ Could not find that user");

                    // get member in guild if available
                    const member = msg.guild.members.cache.get(user.id) || null;

                    // check if can ban
                    if (user.bot) return msg.reply("❌ Can't ban a bot");
                    if (user.id === msg.author.id) return msg.reply("❌ You cannot ban yourself");
                    if (member && member.roles.highest.position >= msg.member.roles.highest.position)
                        return msg.reply("❌ You cannot ban this member due to role hierarchy");

                    // ban
                    let reason = args.slice(1).join(" ") || "No reason provided";
                    if (user) await user.send(`You have been banned from **${msg.guild.name}** because:\n${reason}`).catch(() => {});
                    await msg.guild.bans.create(user.id, { reason });
                    msg.reply(`✅ Banned ${user.tag} | Reason: ${reason}`);
                } catch (err) {
                    console.error(err);
                    msg.reply("❌ An error occurred while trying to ban this user");
                }
            }

            //-----------------unban----------------
            if (command === `${PREFIX}unban`) {
                try {
                    // permissions
                    if (!msg.member.permissions.has(PermissionsBitField.Flags.BanMembers)) 
                        return msg.reply("❌ You don't have permission to unban members");
                    if (!msg.guild.members.me.permissions.has(PermissionsBitField.Flags.BanMembers)) 
                        return msg.reply("❌ I don't have permission to unban members");

                    // get user
                    const user = await fetchUser(msg, args[0]?.trim() || null);
                    if (!user) return msg.reply("❌ Could not find that user");

                    // check if can unban
                    if (user.bot) return msg.reply("❌ Can't unban a bot");

                    const bans = await msg.guild.bans.fetch();
                    const ban = bans.get(user.id);
                    if (!ban) return msg.reply("❌ That user is not banned");

                    // unban
                    let reason = args.slice(1).join(" ") || "No reason provided";
                    await msg.guild.bans.remove(user.id, reason);
                    if (user) await user.send(`You have been unbanned from **${msg.guild.name}**`).catch(() => {});
                    msg.reply(`✅ Unbanned ${user.tag} | Reason: ${reason}`);
                } catch (err) {
                    console.error(err);
                    msg.reply("❌ An error occurred while trying to unban this user");
                }
            }

            //-----------------kick----------------
            if (command === `${PREFIX}kick`) {
                try {
                    // permissions
                    if (!msg.member.permissions.has(PermissionsBitField.Flags.KickMembers)) 
                        return msg.reply("❌ You don't have permission to kick members");
                    if (!msg.guild.members.me.permissions.has(PermissionsBitField.Flags.KickMembers)) 
                        return msg.reply("❌ I don't have permission to kick members");

                    // get user
                    const user = await fetchUser(msg, args[0]?.trim() || null);
                    if (!user) return msg.reply("❌ Could not find that user");

                    // check if can kick
                    const member = msg.guild.members.cache.get(user.id);
                    if (!member) return msg.reply("❌ User is not in this server");

                    if (user.bot) return msg.reply("❌ Can't kick a bot");
                    if (user.id === msg.author.id) return msg.reply("❌ You cannot kick yourself");
                    if (member.roles.highest.position >= msg.member.roles.highest.position)
                        return msg.reply("❌ You cannot kick this member due to role hierarchy");

                    // kick
                    let reason = args.slice(1).join(" ") || "No reason provided";
                    await member.send(`You have been kicked from **${msg.guild.name}** because:\n${reason}`).catch(() => {});
                    await member.kick(reason);
                    msg.reply(`✅ Kicked ${user.tag} | Reason: ${reason}`);
                } catch (err) {
                    console.error(err);
                    msg.reply("❌ An error occurred while trying to kick this user");
                }
            }

            //-----------------timeout----------------
            if (command === `${PREFIX}timeout`) {
                try {
                    // permissions
                    if (!msg.member.permissions.has(PermissionsBitField.Flags.ModerateMembers)) 
                        return msg.reply("❌ You don't have permission to timeout members");
                    if (!msg.guild.members.me.permissions.has(PermissionsBitField.Flags.ModerateMembers)) 
                        return msg.reply("❌ I don't have permission to timeout members");

                    // get user
                    const user = await fetchUser(msg, args[0]?.trim() || null);
                    if (!user) return msg.reply("❌ Could not find that user");

                    // check if can timeout
                    const member = msg.guild.members.cache.get(user.id);
                    if (!member) return msg.reply("❌ User is not in this server");

                    if (user.bot) return msg.reply("❌ Can't time out a bot");
                    if (user.id === msg.author.id) return msg.reply("❌ You cannot timeout yourself");

                    if (member.roles.highest.position >= msg.member.roles.highest.position)
                        return msg.reply("❌ You cannot timeout this member due to role hierarchy");
                    if (member.communicationDisabledUntilTimestamp && member.communicationDisabledUntilTimestamp > Date.now())
                        return msg.reply("❌ This user is already timed out");

                    // timeout
                    let duration = parseDuration(args[1]);
                    if (!duration) return msg.reply("❌ Invalid duration. Use formats like 10m, 2h, 1d");
                    let reason = args.slice(2).join(" ") || "No reason provided";

                    await member.send(`You have been timed out from **${msg.guild.name}** because: **${reason}**\nTime: **${Math.floor(duration / 1000)}s**`).catch(() => {});
                    await member.timeout(duration, reason);
                    msg.reply(`✅ Timed out ${user.tag} | Reason: ${reason}`);
                } catch (err) {
                    console.error(err);
                    msg.reply("❌ An error occurred while trying to timeout this user");
                }
            }

            //-----------------untimeout----------------
            if (command === `${PREFIX}untimeout`) {
                try {
                    // permissions
                    if (!msg.member.permissions.has(PermissionsBitField.Flags.ManageMembers)) 
                        return msg.reply("❌ You don't have permission to untimeout members");
                    if (!msg.guild.members.me.permissions.has(PermissionsBitField.Flags.ManageMembers)) 
                        return msg.reply("❌ I don't have permission to untimeout members");

                    // get user
                    const user = await fetchUser(msg, args[0]?.trim() || null);
                    if (!user) return msg.reply("❌ Could not find that user");

                    const member = msg.guild.members.cache.get(user.id);
                    if (!member) return msg.reply("❌ User is not in this server");

                    // check if can untimeout
                    if (user.bot) return msg.reply("❌ Can't untime out a bot");
                    if (user.id === msg.author.id) return msg.reply("❌ You cannot untimeout yourself");
                    if (member.roles.highest.position >= msg.member.roles.highest.position)
                        return msg.reply("❌ You cannot untimeout this member due to role hierarchy");
                    if (!member.communicationDisabledUntilTimestamp || member.communicationDisabledUntilTimestamp <= Date.now())
                        return msg.reply("❌ This user is not currently timed out");

                    // untime out
                    await member.send(`You have been untimed out from **${msg.guild.name}**`).catch(() => {});
                    await member.timeout(null, "Timeout removed by moderator");
                    msg.reply(`✅ Untimed out ${user.tag}`);
                } catch (err) {
                    console.error(err);
                    msg.reply("❌ An error occurred while trying to untimeout this user");
                }
            }

            //-----------------set-nick----------------
            if (command === `${PREFIX}set-nick`) {
                // permissions
                if (!msg.member.permissions.has(PermissionsBitField.Flags.ManageNicknames)) 
                        return msg.reply("❌ You don't have permission to change the nickname of members");
                if (!msg.guild.members.me.permissions.has(PermissionsBitField.Flags.ManageNicknames)) 
                        return msg.reply("❌ I don't have permission to change the nickname of members");

                let member;
                let nick;

                // first arg is a mention or ID → target member
                if (args[0]?.match(/^<@!?(\d+)>$/) || /^\d+$/.test(args[0])) {
                        member = await fetchMember(msg, args[0]);
                        nick = args.slice(1).join(" "); // rest is nickname (or empty to reset)
                } else {
                        // no mention → default to author, all args = nickname
                        nick = args.join(" "); // full args are the nickname
                }

                if (!member) return msg.reply("❌ Could not find that user");

                // check if nickname can be changed
                if (member.roles.highest.position >= msg.member.roles.highest.position && member.id !== msg.author.id) 
                        return msg.reply(`❌ You cannot change the nickname of this member due to role hierarchy`);

                // apply nickname
                try {
                    if (!nick) {
                            await member.setNickname(null);
                            msg.reply(`✅ Reset nickname for ${member.user.username} to default`);
                    } else {
                            await member.setNickname(nick);
                            msg.reply(`✅ Changed nickname for ${member.user.username} to **${nick}**`);
                    }
                } catch (err) {
                    console.error("Failed to change nickname:", err);
                    msg.reply("❌ I couldn't change the nickname" + member);
                }
            }

            //-----------------role----------------
            if (command === `${PREFIX}role`) {
                // check permissions
                if (!msg.member.permissions.has(PermissionsBitField.Flags.ManageRoles))
                        return msg.reply("❌ You don't have permission to manage roles");
                if (!msg.guild.members.me.permissions.has(PermissionsBitField.Flags.ManageRoles))
                        return msg.reply("❌ I don't have permission to manage roles");

                let member;
                let roleInput;

                // if first arg is a mention or ID, treat as member
                if (args[0]?.match(/^<@!?(\d+)>$/) || /^\d+$/.test(args[0])) {
                        member = await fetchMember(msg, args[0]);
                        roleInput = args.slice(1).join(" ");
                } else {
                        // default to author, all args are role name
                        member = msg.member;
                        roleInput = args.join(" ");
                }

                if (!roleInput) return msg.reply("❌ You need to specify a role");
                if (!member) return msg.reply("❌ Could not find that user");

                // fetch role
                let role;
                const roleMention = msg.mentions.roles.first();
                if (roleMention) {role = roleMention;} else {role = msg.guild.roles.cache.find(r => r.name.toLowerCase() === roleInput.toLowerCase());}
                if (!role) return msg.reply("❌ Could not find that role");

                // check role hierarchy
                if (member.roles.highest.position >= msg.member.roles.highest.position && member.id !== msg.author.id)
                        return msg.reply("❌ You cannot change the roles of this member due to role hierarchy");
                if (role.position >= msg.guild.members.me.roles.highest.position)
                        return msg.reply("❌ I cannot manage a role higher than or equal to my highest role");
                // add or remove role
                if (member.roles.cache.has(role.id)) {
                        try {
                                await member.roles.remove(role); // remove role
                                msg.reply(`✅ Removed role **${role.name}** from ${member.user.tag}`);
                        } catch (err) {
                                console.error("Failed to remove role:", err);
                                msg.reply("❌ Failed to remove the role. Check my permissions and role hierarchy.");
                        }
                } else {
                        try {
                                await member.roles.add(role); // add role
                                msg.reply(`✅ Added role **${role.name}** to ${member.user.tag}`);
                        } catch (err) {
                                console.error("Failed to add role:", err);
                                msg.reply("❌ Failed to add the role. Check my permissions and role hierarchy.");
                        }
                }
            }

            //-----------------purge----------------
            if (command === `${PREFIX}purge`) {
                try {
                    // permissions
                    if (!msg.member.permissions.has(PermissionsBitField.Flags.ManageMessages))
                        return msg.reply("❌ You don't have permission to delete messages");
                    if (!msg.guild.members.me.permissions.has(PermissionsBitField.Flags.ManageMessages))
                        return msg.reply("❌ I don't have permission to delete messages");

                    // get amount
                    const amount = parseInt(args[0]);
                    if (isNaN(amount) || amount < 1 || amount > 100)
                        return msg.reply("❌ Please provide a number between **1** and **100**");

                    try {
                        // delete messages
                        const fetched = await msg.channel.messages.fetch({ limit: amount });
                        const deleted = await msg.channel.bulkDelete(fetched, true);

                        const confirm = await msg.channel.send(`✅ Purged **${deleted.size}** messages.`);
                        setTimeout(() => confirm.delete().catch(() => {}), 5000);

                        // log
                        await purgeLog(deleted.size, msg.channel, fetched);

                    } catch (err) {
                        console.error("Failed to purge:", err);
                        msg.reply("❌ I couldn't delete messages. Make sure they aren't too old (14 days max)");
                    }

                } catch (err) {
                    console.error("Error in purge command:", err);
                    msg.reply("❌ Something went wrong while trying to delete messages");
                }
            }

        }catch(err){ // global error (error used for things that shouldn't have errors but they might)
            console.error(err);
            msg.reply("❌ Something went wrong while processing your command").catch(() => {});
        }
    });
}