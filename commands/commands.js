import { Client, GatewayIntentBits, EmbedBuilder, PermissionsBitField, ActionRowBuilder, ButtonBuilder } from "discord.js";
import { parseDuration,  fetchMember} from "../functions/utilities.js";
import { getLogChannel, setLogChannel, getWelcomeChannel, setWelcomeChannel } from "../logging/save-log-channels.js";
import { addTrigger, removeTrigger, getTriggers } from "../triggers/save-trigger.js";
import { doLogging } from "../logging/logger.js";

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
                .setTitle("Help Menu (1/6)")
                .setDescription("Main Commands")
                .setColor(EMBED_COLOR)
                .addFields(
                    { name: "prefix: ", value: PREFIX },
                    { name: "help [page]", value: "Shows this menu of commands" },
                    { name: "info", value: "Shows info about the bot" },
                    { name: "ping", value: "Gets the ping of the bot" }
                )
                .setFooter({ text: EMBED_DESC })
                .setTimestamp();

            // page2
            const page2 = new EmbedBuilder()
                .setTitle("Help Menu (2/6)")
                .setDescription("Info Commands")
                .setColor(EMBED_COLOR)
                .addFields(
                    { name: "avatar [user]", value: "Shows user avatar" },
                    { name: "user-info [user]", value: "Shows user info" },
                    { name: "server-info", value: "Shows server info" }
                )
                .setFooter({ text: EMBED_DESC });

            // page3
            const page3 = new EmbedBuilder()
                .setTitle("Help Menu (3/6)")
                .setDescription("Moderation Commands")
                .setColor(EMBED_COLOR)
                .addFields(
                    { name: "ban [user] [reason]", value: "Bans a user" },
                    { name: "kick [user] [reason]", value: "Kicks a user" },
                    { name: "timeout [user] [duration] [reason]", value: "Timeouts a user" },
                    { name: "un-timeout [user]", value: "Removes timeout from a user" }
                )
                .setFooter({ text: EMBED_DESC });

            // page4
            const page4 = new EmbedBuilder()
                .setTitle("Help Menu (4/6)")
                .setDescription("Moderation Commands (extended)")
                .setColor(EMBED_COLOR)
                .addFields(
                    { name: "set-nick [user] [nickname]", value: "Changes nickname" },
                    { name: "role [user] [role]", value: "Changes role of a user" },
                    { name: "purge [amount]", value: "Purges messages" },
                    { name: "echo [channel] [text]", value: "Echos a message in channel" }
                )
                .setFooter({ text: EMBED_DESC });

            // page5
            const page5 = new EmbedBuilder()
                .setTitle("Help Menu (5/6)")
                .setDescription("Logging Commands")
                .setColor(EMBED_COLOR)
                .addFields(
                    { name: "set-log [channel]", value: "sets, removes, or changes log channel" },
                    { name: "log-channel", value: "gets current log channel" },
                    { name: "set-welcome [channel]", value: "sets, removes, or changes welcome channel" },
                    { name: "welcome-channel", value: "gets current welcome channel" }
                )
                .setFooter({ text: EMBED_DESC });

            // page6
            const page6 = new EmbedBuilder()
                .setTitle("Help Menu (6/6)")
                .setDescription("Trigger Commands")
                .setColor(EMBED_COLOR)
                .addFields(
                    { name: "add-trigger [trigger] | [message]", value: "adds a trigger" },
                    { name: "remove-trigger [trigger]", value: "removes a trigger" },
                    { name: "list-triggers", value: "list all triggers" }
                )
                .setFooter({ text: EMBED_DESC });

                
            const pages = [page1, page2, page3, page4, page5, page6];

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
                message.edit({ components: [] }); // remove buttons after timeout
            });
            }

            //-----------------add-trigger----------------
            if (command === `${PREFIX}add-trigger`) {
                try {
                    // permissions
                    if (!msg.member.permissions.has(PermissionsBitField.Flags.ManageGuild))
                        return msg.reply("❌ You don't have permissions to manage guild").catch(() => {});

                    // join args into one string
                    const input = args.join(" ");
                    if (!input.includes("|"))
                        return msg.reply("❌ Invalid format. Use: '$add-trigger trigger | response', make sure you use the '|' delimeter").catch(() => {});

                    // split into trigger + response
                    const [trigger, response] = input.split("|").map(s => s.trim());

                    if (!trigger || !response)
                        return msg.reply("❌ You must include both a trigger and a response.").catch(() => {});

                    // save trigger
                    addTrigger(msg.guild.id, trigger, response);

                    msg.reply(`✅ Trigger added!\n**Trigger:** ${trigger}\n**Response:** ${response}`).catch(() => {});
                } catch (err) {
                    console.error("Add-trigger command error:", err);
                    msg.reply("❌ Something went wrong while adding a trigger.").catch(() => {});
                }
            }

            //-----------------remove-trigger----------------
            if (command === `${PREFIX}remove-trigger`) {
                try {
                    // permissions
                    if (!msg.member.permissions.has(PermissionsBitField.Flags.ManageGuild))
                        return msg.reply("❌ You don't have permissions to manage guild").catch(() => {});

                    // get trigger
                    const trigger = args.join(" ").trim();
                    if (!trigger) return msg.reply("❌ Please specify which trigger to remove. Example: `$remove-trigger hello there`").catch(() => {});

                    const success = removeTrigger(msg.guild.id, trigger);

                    if (success)
                        msg.reply(`✅ Removed trigger: **${trigger}**`).catch(() => {});
                    else
                        msg.reply(`❌ No trigger found with the name: **${trigger}**`).catch(() => {});
                } catch (err) {
                    console.error("Remove-trigger command error:", err);
                    msg.reply("❌ Something went wrong while removing the trigger.").catch(() => {});
                }
            }
            
            //-----------------list-triggers----------------
            if (command === `${PREFIX}list-triggers`) {
                try {
                    // permissions
                    if (!msg.member.permissions.has(PermissionsBitField.Flags.ManageGuild))
                        return msg.reply("❌ You don't have permissions to manage guild").catch(() => {});

                    const triggers = getTriggers(msg.guild.id);
                    const entries = Object.entries(triggers);

                    if (!entries.length) return msg.reply("ℹ️ There are no triggers set for this server.").catch(() => {});

                    // create list
                    const triggerList = entries
                        .map(([trigger, response]) => `**${trigger}** -> ${response}`)
                        .join("\n");

                    // message
                    msg.reply({
                        content: `📘 **Current Triggers:**\n${triggerList}`,
                    }).catch(() => {});
                } catch (err) {
                    console.error("Get-trigger command error:", err);
                    msg.reply("❌ Something went wrong while getting the triggers.").catch(() => {});
                }
            }

            //-----------------set-log----------------
            if (command === `${PREFIX}set-log`) {
                // permissions
                if (!msg.member.permissions.has(PermissionsBitField.Flags.ManageGuild))
                    return msg.reply("❌ You don't have permissions to manage guild");

                let targetChannel;
                if (args.length === 0) {
                    // default to current channel
                    targetChannel = msg.channel;
                } else {
                    // get channel
                    targetChannel = msg.mentions.channels.first() || msg.guild.channels.cache.get(args[0]);

                    // invalid
                    if (!targetChannel) return msg.reply("❌ Invalid channel. Please mention a channel or provide a valid channel ID.");
                }

                // get old channel
                const oldChannelId = getLogChannel(msg.guild.id);
                const oldChannel = oldChannelId ? msg.guild.channels.cache.get(oldChannelId) : null;

                // logic
                if (oldChannelId === targetChannel.id) {
                    // same channel = remove it
                    setLogChannel(msg.guild.id, null);

                    const embed = new EmbedBuilder()
                        .setTitle("🗑️ Log Channel Removed")
                        .setDescription(`Removed ${targetChannel} as the log channel.`)
                        .setColor(0xff0000)
                        .setFooter({ text: "Use $setlog again to set a new channel." });

                    return msg.reply({ embeds: [embed] });
                }

                // set new log channel
                setLogChannel(msg.guild.id, targetChannel.id);

                // message
                const embed = new EmbedBuilder()
                    .setTitle("✅ Log Channel Set")
                    .setDescription(
                        oldChannel
                            ? `Replaced ${oldChannel} with ${targetChannel} as the new log channel.`
                            : `Logs will now be sent to ${targetChannel}`
                    )
                    .setColor(0x00ff00)
                    .setFooter({ text: "Use $setlog again to change or remove it." });

                msg.reply({ embeds: [embed] });
            }

            //-----------------log-channel----------------
            if (command === `${PREFIX}log-channel`) {
                // permissions
                if (!msg.member.permissions.has(PermissionsBitField.Flags.ManageGuild)) return msg.reply("❌ You don't have permissions to manage guild");

                // get the saved channel ID
                const channelId = getLogChannel(msg.guild.id);
                if (!channelId) return msg.reply("❌ No log channel set. Use `$setlog [channel]` to set one.");

                // try cache first
                let channel = msg.guild.channels.cache.get(channelId);

                // fetch from Discord if not in cache
                if (!channel) {
                    try {
                        channel = await msg.guild.channels.fetch(channelId);
                    } catch {
                        return msg.reply("❌ The saved log channel does not exist anymore.");
                    }
                }

                // message
                msg.reply(`✅ The current log channel for this server is ${channel}`);
            }

            //-----------------set-welcome----------------
            if (command === `${PREFIX}set-welcome`) {
                // permissions
                if (!msg.member.permissions.has(PermissionsBitField.Flags.ManageGuild))
                    return msg.reply("❌ You don't have permissions to manage guild");

                let targetChannel;
                if (args.length === 0) {
                    // default to current channel
                    targetChannel = msg.channel;
                } else {
                    // get channel
                    targetChannel = msg.mentions.channels.first() || msg.guild.channels.cache.get(args[0]);

                    // invalid
                    if (!targetChannel) return msg.reply("❌ Invalid channel. Please mention a channel or provide a valid channel ID.");
                }

                // get old channel
                const oldChannelId = getWelcomeChannel(msg.guild.id);
                const oldChannel = oldChannelId ? msg.guild.channels.cache.get(oldChannelId) : null;

                // logic
                if (oldChannelId === targetChannel.id) {
                    // same channel = remove it
                    setWelcomeChannel(msg.guild.id, null);

                    const embed = new EmbedBuilder()
                        .setTitle("🗑️ Welcome Channel Removed")
                        .setDescription(`Removed ${targetChannel} as the welcome channel.`)
                        .setColor(0xff0000)
                        .setFooter({ text: "Use $setwelcome again to set a new channel." });

                    return msg.reply({ embeds: [embed] });
                }

                // set new log channel
                setWelcomeChannel(msg.guild.id, targetChannel.id);

                // message
                const embed = new EmbedBuilder()
                    .setTitle("✅ Welcome Channel Set")
                    .setDescription(
                        oldChannel
                            ? `Replaced ${oldChannel} with ${targetChannel} as the new welcome channel.`
                            : `Welcome messages will now be sent to ${targetChannel}`
                    )
                    .setColor(0x00ff00)
                    .setFooter({ text: "Use $setwelcome again to change or remove it." });

                msg.reply({ embeds: [embed] });
            }

            //-----------------welcome-channel----------------
            if (command === `${PREFIX}welcomechannel`) {
                // permissions
                if (!msg.member.permissions.has(PermissionsBitField.Flags.ManageGuild)) return msg.reply("❌ You don't have permissions to manage guild");

                // get the saved channel ID
                const channelId = getWelcomeChannel(msg.guild.id);
                if (!channelId) return msg.reply("❌ No welcome channel set. Use `$setwelcome [channel]` to set one.");

                // try cache first
                let channel = msg.guild.channels.cache.get(channelId);

                // fetch from Discord if not in cache
                if (!channel) {
                    try {
                        channel = await msg.guild.channels.fetch(channelId);
                    } catch {
                        return msg.reply("❌ The saved welcome channel does not exist anymore.");
                    }
                }

                // message
                msg.reply(`✅ The current welcome channel for this server is ${channel}`);
            }

            //-----------------echo----------------
            if (command === `${PREFIX}echo`) {
            // Case 1: first arg is a channel mention → send there
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

            //-----------------info----------------
            if (command === `${PREFIX}info`) {
                const embed = new EmbedBuilder()
                    .setTitle("LegoBot Info")
                    .setDescription("This is a bot made as a side-project using Node.js")
                    .setColor(EMBED_COLOR)
                    .addFields(
                        { name: "Creator", value: "cc_landonlego", inline: false },
                        { name: "GitHub", value: "[github](https://github.com/LegoLandon7/LegoBot)", inline: true },
                        { name: "Invite Link", value: "[invite bot](https://discord.com/oauth2/authorize?client_id=1432705622771765439&permissions=8&integration_type=0&scope=bot+applications.commands)", inline: true }
                    )
                    .setFooter({ text: EMBED_DESC })
                    .setTimestamp();

                await msg.reply({ embeds: [embed] });
            }

            //-----------------ban----------------
            if (command === `${PREFIX}ban`) {
                // get member info
                const member = await fetchMember(msg, args[0]?.trim() || null);
                if (!member) return msg.reply("❌ Could not find that user");

                // check if they are bannable
                if (member.user.bot) return msg.reply("❌ Cant ban out a bot");
                if (member.id === msg.author.id) return msg.reply(`❌ You cannot ban yourself`);
                if (member.roles.highest.position >= msg.member.roles.highest.position) return msg.reply(`❌ You cannot ban this member due to role hierarchy`);

                // check for permissions
                if (!msg.member.permissions.has(PermissionsBitField.Flags.BanMembers)) return msg.reply("❌ You don't have permission to ban members");
                if (!msg.guild.members.me.permissions.has(PermissionsBitField.Flags.BanMembers)) return msg.reply("❌ I don't have permission to ban members");

                // send dm then ban
                let reason = args.slice(1).join(" ") || "No reason provided";
                await member.send(`You have been banned from **${msg.guild.name}** because:\n${reason}`).catch(() => {});
                await msg.guild.bans.create(member.id, { reason });
                msg.reply(`✅ Banned ${member.user.tag} | Reason: ${reason}`);
            }

            //-----------------kick----------------
            if (command === `${PREFIX}kick`) {
                // get member info
                const member = await fetchMember(msg, args[0]?.trim() || null);
                if (!member) return msg.reply("❌ Could not find that user");

                // check if they are kickable
                if (member.user.bot) return msg.reply("❌ Cant kick out a bot");
                if (member.id === msg.author.id) return msg.reply(`❌ You cannot kick yourself`);
                if (member.roles.highest.position >= msg.member.roles.highest.position) return msg.reply(`❌ You cannot kick this member due to role hierarchy`);

                // check for permissions
                if (!msg.member.permissions.has(PermissionsBitField.Flags.KickMembers)) return msg.reply("❌ You don't have permission to kick members");
                if (!msg.guild.members.me.permissions.has(PermissionsBitField.Flags.KickMembers)) return msg.reply("❌ I don't have permission to kick members");

                // send dm then kick
                let reason = args.slice(1).join(" ") || "No reason provided";
                await member.send(`You have been kicked from **${msg.guild.name}** because:\n${reason}`).catch(() => {});
                await member.kick(reason);
                msg.reply(`✅ Kicked ${member.user.tag} | Reason: ${reason}`);
            }

            //-----------------timeout----------------
            if (command === `${PREFIX}timeout`) {
                // get member info
                const member = await fetchMember(msg, args[0]?.trim() || null);
                if (!member) return msg.reply("❌ Could not find that user");

                // check if they are able to be timed out
                if (member.communicationDisabledUntilTimestamp && member.communicationDisabledUntilTimestamp > Date.now()) {
                    return msg.reply("❌ This user is already timed out");}
                if (member.user.bot) return msg.reply("❌ Cant time out a bot");
                if (member.id === msg.author.id) return msg.reply(`❌ You cannot timeout yourself`);
                if (member.roles.highest.position >= msg.member.roles.highest.position) return msg.reply(`❌ You cannot timeout this member due to role hierarchy`);

                // check for permissions
                if (!msg.member.permissions.has(PermissionsBitField.Flags.ModerateMembers)) return msg.reply("❌ You don't have permission to timeout members");
                if (!msg.guild.members.me.permissions.has(PermissionsBitField.Flags.ModerateMembers)) return msg.reply("❌ I don't have permission to timeout members");

                // send dm then timeout
                let duration = parseDuration(args[1]); if (!duration) return msg.reply("❌ Invalid duration. Use formats like 10m, 2h, 1d");
                let reason = args.slice(2).join(" ") || "No reason provided";

                await member.send(`You have been timed out from **${msg.guild.name}** \nbecause:**${reason}**\n time: **${Math.floor(duration / 1000)}s**`).catch(() => {});
                await member.timeout(duration, reason);
                msg.reply(`✅ Timed out ${member} | Reason: ${reason}`);
            }

            //-----------------un-timeout----------------
            if (command === `${PREFIX}un-timeout`) {
                // get member info
                const member = await fetchMember(msg, args[0]?.trim() || null);
                if (!member) return msg.reply("❌ Could not find that user");

                // check if they are able to be untimed out
                if (!member.communicationDisabledUntilTimestamp || member.communicationDisabledUntilTimestamp <= Date.now()) {
                    return msg.reply("❌ This user is not currently timed out");}
                if (member.user.bot) return msg.reply("❌ Cant untime out a bot");
                if (member.id === msg.author.id) return msg.reply(`❌ You cannot untimeout yourself`);
                if (member.roles.highest.position >= msg.member.roles.highest.position) return msg.reply(`❌ You cannot untimeout this member due to role hierarchy`);

                // check for permissions
                if (!msg.member.permissions.has(PermissionsBitField.Flags.ManageMembers)) return msg.reply("❌ You don't have permission to untimeout members");
                if (!msg.guild.members.me.permissions.has(PermissionsBitField.Flags.ManageMembers)) return msg.reply("❌ I don't have permission to untimeout members");

                // untimeout
                await member.send(`You have been untimed out from **${msg.guild.name}**`).catch(() => {});
                await member.timeout(null, "Timeout removed by moderator");
                msg.reply(`✅ Untimed out ${member}`);
            }

            //-----------------set-nick----------------
            if (command === `${PREFIX}set-nick`) {
                let member;
                let nick;

                // Case 1: first arg is a mention or ID → target member
                if (args[0]?.match(/^<@!?(\d+)>$/) || /^\d+$/.test(args[0])) {
                        member = await fetchMember(msg, args[0]);
                        nick = args.slice(1).join(" "); // rest is nickname (or empty to reset)
                } else {
                        // Case 2: no mention → default to author, all args = nickname
                        member = msg.member;
                        nick = args.join(" "); // full args are the nickname
                }

                if (!member) return msg.reply("❌ Could not find that user");

                // check if nickname can be changed
                if (member.roles.highest.position >= msg.member.roles.highest.position && member.id !== msg.author.id) 
                        return msg.reply(`❌ You cannot change the nickname of this member due to role hierarchy`);

                if (!msg.member.permissions.has(PermissionsBitField.Flags.ManageNicknames)) 
                        return msg.reply("❌ You don't have permission to change the nickname of members");
                if (!msg.guild.members.me.permissions.has(PermissionsBitField.Flags.ManageNicknames)) 
                        return msg.reply("❌ I don't have permission to change the nickname of members");

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
                    msg.reply(`❌ I couldn't change the nickname. Make sure my role is above the member's role and I have Manage Nicknames permission`);
                }
            }

            //-----------------role----------------
            if (command === `${PREFIX}role`) {
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

                    if (!member) return msg.reply("❌ Could not find that user");
                    if (!roleInput) return msg.reply("❌ You need to specify a role");

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

                    // check permissions
                    if (!msg.member.permissions.has(PermissionsBitField.Flags.ManageRoles))
                            return msg.reply("❌ You don't have permission to manage roles");
                    if (!msg.guild.members.me.permissions.has(PermissionsBitField.Flags.ManageRoles))
                            return msg.reply("❌ I don't have permission to manage roles");

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
                    // check permissions
                    if (!msg.member.permissions.has(PermissionsBitField.Flags.ManageMessages))
                        return msg.reply("❌ You don't have permission to delete messages");
                    if (!msg.guild.members.me.permissions.has(PermissionsBitField.Flags.ManageMessages))
                        return msg.reply("❌ I don't have permission to delete messages");

                    // get amount
                    const amount = parseInt(args[0]);
                    if (isNaN(amount) || amount < 1 || amount > 100)
                        return msg.reply("❌ Please provide a number between **1** and **100**");

                    // delete messages
                    await msg.channel.bulkDelete(amount, true).then(deleted => {
                        msg.channel.send(`✅ Purged **${deleted.size}** messages.`)
                        .then(m => setTimeout(() => m.delete().catch(() => {}), 5000)); // auto-delete reply after 5s
                    }).catch(err => {
                        console.error("Failed to purge:", err);
                        msg.reply("❌ I couldn't delete messages. Make sure they aren't too old (14 days max)");
                    });
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