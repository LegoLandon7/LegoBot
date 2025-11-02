import { EmbedBuilder} from "discord.js";
import { logMessage, welcomeMessage, formatMember } from "./functions/logging.js";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import { ensureServerFolder, appendLog, readLog, getAllLogs} from "./functions/log-files.js";
import { PREFIX } from "../commands/main-commands.js";
import { PermissionsBitField } from "discord.js";
import { zipGuildLogs } from "./functions/log-files.js";
import { getLogChannel,setLogChannel, getWelcomeChannel, setWelcomeChannel} from "./functions/save-log-channels.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BAD_COLOR = "#ff0000";
const MEDIUM_COLOR = "#ffff00";
const GOOD_COLOR = "#00ff00";

// main logging
export function doLogging(client) {
    try {
        // ----------------- Commands -----------------
        client.on("messageCreate", async (message) => {
            const args = message.content.split(" ");
            const command = args.shift()?.toLowerCase();

            //-----------------download-logs----------------
            if (command === `${PREFIX}download-logs`) {
                try {
                    // permissions
                    if (!message.member.permissions.has(PermissionsBitField.Flags.ManageGuild))
                        return message.reply("❌ You don't have permissions to manage guild").catch(() => {});

                    // zip
                    const zipPath = await zipGuildLogs(message.guild.id);
                    await message.channel.send({
                        content: `🗂️ Here are all logs for **${message.guild.name}**`,
                        files: [zipPath],
                    });
                } catch (err) {
                    console.error("Download logs error:", err);
                    message.reply("❌ Something went wrong while downloading logs").catch(() => {});
                }
            }

            //-----------------set-log----------------
            if (command === `${PREFIX}set-log`) {
                // permissions
                if (!message.member.permissions.has(PermissionsBitField.Flags.ManageGuild))
                    return message.reply("❌ You don't have permissions to manage guild");

                let targetChannel;
                if (args.length === 0) {
                    // default to current channel
                    targetChannel = message.channel;
                } else {
                    // get channel
                    targetChannel = message.mentions.channels.first() || message.guild.channels.cache.get(args[0]);

                    // invalid
                    if (!targetChannel) return message.reply("❌ Invalid channel. Please mention a channel or provide a valid channel ID.");
                }

                // get old channel
                const oldChannelId = getLogChannel(message.guild.id);
                const oldChannel = oldChannelId ? message.guild.channels.cache.get(oldChannelId) : null;

                // logic
                if (oldChannelId === targetChannel.id) {
                    // same channel = remove it
                    setLogChannel(message.guild.id, null);

                    const embed = new EmbedBuilder()
                        .setTitle("🗑️ Log Channel Removed")
                        .setDescription(`Removed ${targetChannel} as the log channel.`)
                        .setColor(0xff0000)
                        .setFooter({ text: "Use $setlog again to set a new channel." });

                    return message.reply({ embeds: [embed] });
                }

                // set new log channel
                setLogChannel(message.guild.id, targetChannel.id);

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

                message.reply({ embeds: [embed] });
            }

            //-----------------log-channel----------------
            if (command === `${PREFIX}log-channel`) {
                // permissions
                if (!message.member.permissions.has(PermissionsBitField.Flags.ManageGuild)) return message.reply("❌ You don't have permissions to manage guild");

                // get the saved channel ID
                const channelId = getLogChannel(message.guild.id);
                if (!channelId) return message.reply("❌ No log channel set. Use `$setlog [channel]` to set one.");

                // try cache first
                let channel = message.guild.channels.cache.get(channelId);

                // fetch from Discord if not in cache
                if (!channel) {
                    try {
                        channel = await message.guild.channels.fetch(channelId);
                    } catch {
                        return message.reply("❌ The saved log channel does not exist anymore.");
                    }
                }

                // message
                message.reply(`✅ The current log channel for this server is ${channel}`);
            }

            //-----------------set-welcome----------------
            if (command === `${PREFIX}set-welcome`) {
                // permissions
                if (!message.member.permissions.has(PermissionsBitField.Flags.ManageGuild))
                    return message.reply("❌ You don't have permissions to manage guild");

                let targetChannel;
                if (args.length === 0) {
                    // default to current channel
                    targetChannel = message.channel;
                } else {
                    // get channel
                    targetChannel = message.mentions.channels.first() || message.guild.channels.cache.get(args[0]);

                    // invalid
                    if (!targetChannel) return message.reply("❌ Invalid channel. Please mention a channel or provide a valid channel ID.");
                }

                // get old channel
                const oldChannelId = getWelcomeChannel(message.guild.id);
                const oldChannel = oldChannelId ? message.guild.channels.cache.get(oldChannelId) : null;

                // logic
                if (oldChannelId === targetChannel.id) {
                    // same channel = remove it
                    setWelcomeChannel(message.guild.id, null);

                    const embed = new EmbedBuilder()
                        .setTitle("🗑️ Welcome Channel Removed")
                        .setDescription(`Removed ${targetChannel} as the welcome channel.`)
                        .setColor(0xff0000)
                        .setFooter({ text: "Use $set-welcome again to set a new channel." });

                    return message.reply({ embeds: [embed] });
                }

                // set new log channel
                setWelcomeChannel(message.guild.id, targetChannel.id);

                // message
                const embed = new EmbedBuilder()
                    .setTitle("✅ Welcome Channel Set")
                    .setDescription(
                        oldChannel
                            ? `Replaced ${oldChannel} with ${targetChannel} as the new welcome channel.`
                            : `Welcome messages will now be sent to ${targetChannel}`
                    )
                    .setColor(0x00ff00)
                    .setFooter({ text: "Use $set-welcome again to change or remove it." });

                message.reply({ embeds: [embed] });
            }

            //-----------------welcome-channel----------------
            if (command === `${PREFIX}welcome-channel`) {
                // permissions
                if (!message.member.permissions.has(PermissionsBitField.Flags.ManageGuild)) return message.reply("❌ You don't have permissions to manage guild");

                // get the saved channel ID
                const channelId = getWelcomeChannel(message.guild.id);
                if (!channelId) return message.reply("❌ No welcome channel set. Use `$set-welcome [channel]` to set one.");

                // try cache first
                let channel = message.guild.channels.cache.get(channelId);

                // fetch from Discord if not in cache
                if (!channel) {
                    try {
                        channel = await message.guild.channels.fetch(channelId);
                    } catch {
                        return message.reply("❌ The saved welcome channel does not exist anymore.");
                    }
                }

                // message
                message.reply(`✅ The current welcome channel for this server is ${channel}`);
            }
        });

        // ----------------- Message Delete -----------------
        client.on("messageDelete", async (message) => {
            try {
                if (!message.guild || message.author?.bot) return;
                let message = message;
                if (message.partial) {
                    try { message = await message.fetch(); } catch { return; }
                }

                const attachments = message.attachments.map(a => a.name).join(", ");

                const embed = new EmbedBuilder()
                    .setTitle("🗑️ Message Deleted")
                    .setColor(BAD_COLOR)
                    .setThumbnail(message.author.displayAvatarURL({ dynamic: true, size: 128 }))
                    .addFields(
                        { name: "Member", value: `${message.author}` },
                        { name: "Channel", value: `${message.channel}` },
                        { name: "Content", value: message.content || "[No Text]" }
                    )
                    .setFooter({ text: `${message.author.tag} | ${message.author.id}` })
                    .setTimestamp();
                    if (attachments) embed.addFields({name: "Attachments", value: attachments});

                // log
                logMessage(message.guild, embed);
                appendLog(message.guild.id, "messages-deleted.txt", `${message.author.tag} | ${message.author.id} | Channel: ${message.channel.name} | Message: ${message.content || "[No Text]"}`);
            } catch (err) {
                console.error("messageDelete logging error:", err);
            }
        });

        // ----------------- Message Update -----------------
        client.on("messageUpdate", async (oldmessage, newmessage) => {
            try {
                if (!newmessage.guild || newmessage.author?.bot) return;
                if (newmessage.partial) {
                    try { newmessage = await newmessage.fetch(); } catch { return; }
                }

                const oldAttachments = oldmessage.attachments.map(a => a.name).join(", ");
                const newAttachments = newmessage.attachments.map(a => a.name).join(", ");

                const embed = new EmbedBuilder()
                    .setTitle("✏️ Message Edited")
                    .setColor(MEDIUM_COLOR)
                    .setThumbnail(newmessage.author.displayAvatarURL({ dynamic: true, size: 128 }))
                    .addFields(
                        { name: "Member", value: `${newmessage.author}` },
                        { name: "Channel", value: `${newmessage.channel}` },
                        { name: "Before", value: oldmessage.content || "[No Text]" },
                        { name: "After", value: newmessage.content || "[No Text]" }
                    )
                    .setFooter({ text: `${newmessage.author.tag} | ${newmessage.author.id}` })
                    .setTimestamp();

                    if (oldAttachments) embed.addFields({name: "Old Attachments", value: oldAttachments});
                    if (newAttachments) embed.addFields({name: "New Attachments", value: newAttachments});

                logMessage(newmessage.guild, embed);
                appendLog(newmessage.guild.id, "messages-updated.txt", `${newmessage.author.tag} | ${newmessage.author.id} | Channel: ${newmessage.channel.name} | New Message: ${newmessage.content || "[No Text]"} | Old Message: ${oldmessage.content || "[No Text]"}`);
            } catch (err) {
                console.error("messageUpdate logging error:", err);
            }
        });

        // ----------------- Guild Member Update -----------------
        client.on("guildMemberUpdate", (oldMember, newMember) => {
            try {
                // Nickname change
                if (oldMember.nickname !== newMember.nickname) {
                    const embed = new EmbedBuilder()
                        .setTitle("✏️ Nickname Changed")
                        .setColor(MEDIUM_COLOR)
                        .setThumbnail(newMember.user.displayAvatarURL({ dynamic: true, size: 128 }))
                        .addFields(
                            { name: "Member", value: formatMember(newMember) },
                            { name: "Old Nickname", value: oldMember.nickname || "[None]" },
                            { name: "New Nickname", value: newMember.nickname || "[None]" }
                        )
                        .setFooter({ text: `${newMember.user.tag} | ${newMember.user.id}` })
                        .setTimestamp();

                    // log
                    logMessage(newMember.guild, embed);
                    appendLog(newMember.guild.id, "nickname-updates.txt", `${newMember.user.tag} | ${newMember.user.id} | New Nickname: ${newMember.nickname} | Old Nickname: ${oldMember.nickname}`);
                }

                // Role changes
                if (oldMember.roles.cache.size !== newMember.roles.cache.size) {
                    const added = newMember.roles.cache.filter(r => !oldMember.roles.cache.has(r.id));
                    const removed = oldMember.roles.cache.filter(r => !newMember.roles.cache.has(r.id));

                    if (added.size || removed.size) {
                        const embed = new EmbedBuilder()
                            .setTitle("⚙️ Roles Updated")
                            .setColor(MEDIUM_COLOR)
                            .setThumbnail(newMember.user.displayAvatarURL({ dynamic: true, size: 128 }))
                            .addFields(
                                { name: "Member", value: formatMember(newMember) },
                                { name: "Added Roles", value: added.size ? added.map(r => `<@&${r.id}>`).join(" ") : "[None]" },
                                { name: "Removed Roles", value: removed.size ? removed.map(r => `<@&${r.id}>`).join(" ") : "[None]" }
                            )
                            .setFooter({ text: `${newMember.user.tag} | ${newMember.user.id}` })
                            .setTimestamp();

                        // log
                        logMessage(newMember.guild, embed);
                        appendLog(newMember.guild.id, "role-updates.txt", `${newMember.user.tag} | ${newMember.user.id} | Added Roles: ${added.size ? added.map(r => r.name).join(", ") : "[None]"} | Removed Roles: ${removed.size ? removed.map(r => r.name).join(", ") : "[None]"}`);
                    }
                }

                // Timeout / Untimeout
                const oldTimeout = oldMember.communicationDisabledUntilTimestamp;
                const newTimeout = newMember.communicationDisabledUntilTimestamp;

                if ((!oldTimeout || oldTimeout <= Date.now()) && newTimeout && newTimeout > Date.now()) {
                    const embed = new EmbedBuilder()
                        .setTitle("⏳ Member Timed Out")
                        .setColor(BAD_COLOR)
                        .setThumbnail(newMember.user.displayAvatarURL({ dynamic: true, size: 128 }))
                        .addFields(
                            { name: "Member", value: formatMember(newMember) },
                            { name: "Until", value: `<t:${Math.floor(newTimeout / 1000)}:F>` }
                        )
                        .setFooter({ text: `${newMember.user.tag} | ${newMember.user.id}` })
                        .setTimestamp();

                    // log
                    logMessage(newMember.guild, embed);
                    appendLog(newMember.guild.id, "timeouts.txt", `Added Timeout: ${newMember.user.tag} | ${newMember.user.id} | Time: ${Math.floor((newTimeout - Date.now()) / 1000)}s`);
                
                } else if (oldTimeout && oldTimeout > Date.now() && (!newTimeout || newTimeout <= Date.now())) {
                    const embed = new EmbedBuilder()
                        .setTitle("✅ Timeout Removed")
                        .setColor(GOOD_COLOR)
                        .setThumbnail(newMember.user.displayAvatarURL({ dynamic: true, size: 128 }))
                        .addFields({ name: "Member", value: formatMember(newMember) })
                        .setFooter({ text: `${newMember.user.tag} | ${newMember.user.id}` })
                        .setTimestamp();

                    // log
                    logMessage(newMember.guild, embed);
                    appendLog(newMember.guild.id, "timeouts.txt", `Removed Timeout: ${newMember.user.tag} | ${newMember.user.id}`);
                }
            } catch (err) {
                console.error("guildMemberUpdate logging error:", err);
            }
        });

        // ----------------- User Avatar Update -----------------
        client.on("userUpdate", async (oldUser, newUser) => {
            try {
                if (oldUser.avatar === newUser.avatar) return;

                for (const guild of client.guilds.cache.values()) {
                    const member = guild.members.cache.get(newUser.id);
                    if (!member) continue;

                    const embed = new EmbedBuilder()
                        .setTitle("🖼️ Avatar Updated")
                        .setColor(MEDIUM_COLOR)
                        .setDescription(`${formatMember(member)} has updated their avatar`)
                        .setImage(newUser.displayAvatarURL({ dynamic: true, size: 512 }))
                        .setFooter({ text: `${member.user.tag} | ${member.user.id}` })
                        .setTimestamp();

                    // log
                    logMessage(guild, embed);
                    const avatar = member.user.displayAvatarURL({ format: "png", dynamic: true });
                    appendLog(member.guild.id, "avatar-updates.txt", `${member.user.tag} | ${member.user.id} | ${avatar}`);
                }
            } catch (err) {
                console.error("userUpdate logging error:", err);
            }
        });

        // ----------------- Guild Member Remove -----------------
        client.on("guildMemberRemove", async (member) => {
            try {
                // logging
                const embed1 = new EmbedBuilder()
                    .setTitle("❌ Member Left")
                    .setColor(BAD_COLOR)
                    .setThumbnail(member.user.displayAvatarURL({ dynamic: true, size: 128 }))
                    .addFields(
                        { name: "Member", value: formatMember(member) },
                        { name: "Account Created", value: `<t:${Math.floor(member.user.createdTimestamp / 1000)}:F>` },
                        { name: "Joined Server", value: member.joinedTimestamp ? `<t:${Math.floor(member.joinedTimestamp / 1000)}:F>` : "Unknown" }
                    )
                    .setFooter({ text: `${member.user.tag} | ${member.user.id}` })
                    .setTimestamp();

                // log
                logMessage(member.guild, embed1);
                appendLog(member.guild.id, "joins-leaves.txt", `Left: ${member.user.tag} | ${member.user.id}`);

                // welcome
                const embed2 = new EmbedBuilder()
                    .setTitle("❌ Member Left")
                    .setColor(BAD_COLOR)
                    .setThumbnail(member.user.displayAvatarURL({ dynamic: true, size: 128 }))
                    .addFields(
                        { name: "Member", value: formatMember(member) },
                        { name: "Joined Server", value: member.joinedTimestamp ? `<t:${Math.floor(member.joinedTimestamp / 1000)}:F>` : "Unknown" }
                    )
                    .setFooter({ text: `${member.user.tag}` })
                    .setTimestamp();

                welcomeMessage(member.guild, embed2);
            } catch (err) {
                console.error("guildMemberRemove logging error:", err);
            }
        });

        // ----------------- Guild Member Add -----------------
        client.on("guildMemberAdd", (member) => {
            try {
                // logging
                const embed1 = new EmbedBuilder()
                    .setTitle("✅ Member Joined")
                    .setColor(GOOD_COLOR)
                    .setThumbnail(member.user.displayAvatarURL({ dynamic: true, size: 128 }))
                    .addFields(
                        { name: "Member", value: formatMember(member) },
                        { name: "Account Created", value: `<t:${Math.floor(member.user.createdTimestamp / 1000)}:F>` },
                        { name: "Joined Server", value: member.joinedTimestamp ? `<t:${Math.floor(member.joinedTimestamp / 1000)}:F>` : "Unknown" }
                    )
                    .setFooter({ text: `${member.user.tag} | ${member.user.id}` })
                    .setTimestamp();

                // log
                logMessage(member.guild, embed1);
                appendLog(member.guild.id, "joins-leaves.txt", `Joined: ${member.user.tag} | ${member.user.id}`);

                // welcome
                const embed2 = new EmbedBuilder()
                    .setTitle("✅ Member Joined")
                    .setColor(GOOD_COLOR)
                    .setThumbnail(member.user.displayAvatarURL({ dynamic: true, size: 128 }))
                    .addFields(
                        { name: "Member", value: formatMember(member) },
                        { name: "Joined Server", value: member.joinedTimestamp ? `<t:${Math.floor(member.joinedTimestamp / 1000)}:F>` : "Unknown" }
                    )
                    .setFooter({ text: `${member.user.tag}` })
                    .setTimestamp();

                welcomeMessage(member.guild, embed2);
            } catch (err) {
                console.error("guildMemberAdd logging error:", err);
            }
        });

    } catch (err) { // global error
        console.error("doLogging initialization error:", err);
    }
}

// message purge logger
export async function purgeLog(amount, channel, messages = null) {
    try {
        // create the embed
        const embed = new EmbedBuilder()
            .setTitle("🗑️ Messages Purged")
            .setColor("#ff0000") // BAD_COLOR
            .addFields(
                { name: "Amount", value: `**${amount}** messages deleted`, inline: true },
                { name: "Channel", value: `${channel}`, inline: true },
            )
            .setTimestamp();

        // if messages exist, create a log file
        let filePath = null;
        if (messages && messages.size > 0) {
            const lines = [];
            lines.push(`Purged Messages Log`);
            lines.push(`Channel: #${channel.name} (${channel.id})`);
            lines.push(`Deleted at: ${new Date().toLocaleString()}`);
            lines.push(`Total Deleted: ${messages.size}`);
            lines.push(`----------------------------------------`);

            for (const m of [...messages.values()].reverse()) {
                const time = new Date(m.createdTimestamp).toLocaleString();
                const user = m.author ? `${m.author.tag} (${m.author.id})` : "Unknown User";
                const content = m.content?.trim() || "[No text content]";
                lines.push(`[${time}] ${user}: ${content}`);
            }

            // ensure purge-logs folder exists
            const logFolder = path.join(__dirname, `logs/${channel.guild.id}/purge-logs`);
            fs.mkdirSync(logFolder, { recursive: true });

            // file naming
            let baseName = `purge-log-${Date.now()}`;
            let fileName = `${baseName}.txt`;
            let counter = 1;
            while (fs.existsSync(path.join(logFolder, fileName))) {
                fileName = `${baseName}(${counter}).txt`;
                counter++;
            }

            filePath = path.join(logFolder, fileName);
            fs.writeFileSync(filePath, lines.join("\n"), "utf8");
        }

        // send the embed, attach the file if it exists
        if (filePath) {
            await logMessage(channel.guild, {
                embeds: [embed],
                files: [filePath],
            });
        } else {
            await logMessage(channel.guild, embed);
        }
    } catch (err) {
        console.error("purgeLog error:", err);
    }
}