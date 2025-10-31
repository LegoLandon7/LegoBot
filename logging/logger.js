import { EmbedBuilder, AuditLogEvent } from "discord.js";
import { getLogChannel, getWelcomeChannel } from "./save-log-channels.js";

const BAD_COLOR = "#ff0000";
const MEDIUM_COLOR = "#ffff00";
const GOOD_COLOR = "#00ff00";

function sendToChannel(getFn, guild, content) {
    try {
        const id = getFn(guild.id);
        if (!id) return;
        const channel = guild.channels.cache.get(id);
        if (!channel) return;
        const payload = content instanceof EmbedBuilder ? { embeds: [content] } : content;
        channel.send(payload).catch(() => {});
    } catch (err) {
        console.error("sendToChannel error:", err);
    }
}

function logMessage(guild, content) { sendToChannel(getLogChannel, guild, content); }
function welcomeMessage(guild, content) { sendToChannel(getWelcomeChannel, guild, content); }
function formatMember(member) { return member ? `<@${member.id}>` : "Unknown"; }

export function doLogging(client) {
    try {
        // ----------------- Message Delete -----------------
        client.on("messageDelete", async (message) => {
            try {
                if (!message.guild || message.author?.bot) return;
                let msg = message;
                if (message.partial) { try { msg = await message.fetch(); } catch { return; } }

                const embed = new EmbedBuilder()
                    .setTitle("🗑️ Message Deleted")
                    .setColor(BAD_COLOR)
                    .setThumbnail(msg.author.displayAvatarURL({ dynamic: true, size: 128 }))
                    .addFields(
                        { name: "Member", value: `${msg.author}` },
                        { name: "Channel", value: `${msg.channel}` },
                        { name: "Content", value: msg.content || "[No Text]" }
                    )
                    .setFooter({ text: `${msg.author.tag} | ${msg.author.id}` })
                    .setTimestamp();

                logMessage(msg.guild, embed);
            } catch (err) {
                console.error("messageDelete logging error:", err);
            }
        });

        // ----------------- Message Update -----------------
        client.on("messageUpdate", async (oldMsg, newMsg) => {
            try {
                if (!newMsg.guild || newMsg.author?.bot) return;
                if (newMsg.partial) { try { newMsg = await newMsg.fetch(); } catch { return; } }

                const embed = new EmbedBuilder()
                    .setTitle("✏️ Message Edited")
                    .setColor(MEDIUM_COLOR)
                    .setThumbnail(newMsg.author.displayAvatarURL({ dynamic: true, size: 128 }))
                    .addFields(
                        { name: "Member", value: `${newMsg.author}` },
                        { name: "Channel", value: `${newMsg.channel}` },
                        { name: "Before", value: oldMsg.content || "[No Text]" },
                        { name: "After", value: newMsg.content || "[No Text]" }
                    )
                    .setFooter({ text: `${newMsg.author.tag} | ${newMsg.author.id}` })
                    .setTimestamp();
                logMessage(newMsg.guild, embed);
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
                    logMessage(newMember.guild, embed);
                }

                // Role change
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
                        logMessage(newMember.guild, embed);
                    }
                }

                // Timeout
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
                    logMessage(newMember.guild, embed);
                } else if (oldTimeout && oldTimeout > Date.now() && (!newTimeout || newTimeout <= Date.now())) {
                    const embed = new EmbedBuilder()
                        .setTitle("✅ Timeout Removed")
                        .setColor(GOOD_COLOR)
                        .setThumbnail(newMember.user.displayAvatarURL({ dynamic: true, size: 128 }))
                        .addFields({ name: "Member", value: formatMember(newMember) })
                        .setFooter({ text: `${newMember.user.tag} | ${newMember.user.id}` })
                        .setTimestamp();
                    logMessage(newMember.guild, embed);
                }
            } catch (err) {
                console.error("guildMemberUpdate logging error:", err);
            }
        });

        // ----------------- User Update (avatar) -----------------
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

                    logMessage(guild, embed);
                }
            } catch (err) {
                console.error("userUpdate logging error:", err);
            }
        });

        // ----------------- Bans -----------------
        client.on("guildBanAdd", async (ban) => {
            try {
                const { user, guild, reason } = ban;
                const embed = new EmbedBuilder()
                    .setTitle("🔨 Member Banned")
                    .setColor(BAD_COLOR)
                    .setThumbnail(user.displayAvatarURL({ dynamic: true, size: 128 }))
                    .addFields(
                        { name: "Member", value: `${user}` },
                        { name: "Reason", value: reason || "[No Reason Provided]" }
                    )
                    .setFooter({ text: `${user.tag} | ${user.id}` })
                    .setTimestamp();

                logMessage(guild, embed);
            } catch (err) {
                console.error("guildBanAdd logging error:", err);
            }
        });

        client.on("guildBanRemove", async (ban) => {
            try {
                const { user, guild } = ban;
                const embed = new EmbedBuilder()
                    .setTitle("✅ Member Unbanned")
                    .setColor(GOOD_COLOR)
                    .setThumbnail(user.displayAvatarURL({ dynamic: true, size: 128 }))
                    .addFields({ name: "Member", value: `${user}` })
                    .setFooter({ text: `${user.tag} | ${user.id}` })
                    .setTimestamp();

                logMessage(guild, embed);
            } catch (err) {
                console.error("guildBanRemove logging error:", err);
            }
        });

        // ----------------- Kicks / Leaves -----------------
        client.on("guildMemberRemove", async (member) => {
            try {
                const logs = await member.guild.fetchAuditLogs({ limit: 5, type: AuditLogEvent.MemberKick });
                const kickEntry = logs.entries.find(e => e.target.id === member.id);

                if (kickEntry) {
                    const { executor, reason } = kickEntry;
                    const embed = new EmbedBuilder()
                        .setTitle("👢 Member Kicked")
                        .setColor(BAD_COLOR)
                        .setThumbnail(member.user.displayAvatarURL({ dynamic: true, size: 128 }))
                        .addFields(
                            { name: "Member", value: formatMember(member) },
                            { name: "Executor", value: executor ? executor.tag : "[Unknown]" },
                            { name: "Reason", value: reason || "[No Reason Provided]" }
                        )
                        .setFooter({ text: `${member.user.tag} | ${member.user.id}` })
                        .setTimestamp();
                    logMessage(member.guild, embed);
                } else {
                    const embed = new EmbedBuilder()
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
                    logMessage(member.guild, embed);
                }
            } catch (err) {
                console.error("guildMemberRemove logging error:", err);
            }
        });

        // ----------------- Member Join -----------------
        client.on("guildMemberAdd", (member) => {
            try {
                const log = new EmbedBuilder()
                    .setTitle("✅ Member Joined")
                    .setColor(GOOD_COLOR)
                    .setThumbnail(member.user.displayAvatarURL({ dynamic: true, size: 128 }))
                    .addFields(
                        { name: "Member", value: formatMember(member) },
                        { name: "Account Created", value: `<t:${Math.floor(member.user.createdTimestamp / 1000)}:F>` },
                        { name: "Joined Server", value: `<t:${Math.floor(member.joinedTimestamp / 1000)}:F>` }
                    )
                    .setFooter({ text: `${member.user.tag} | ${member.user.id}` })
                    .setTimestamp();
                logMessage(member.guild, log);

                const welcome = new EmbedBuilder()
                    .setTitle("✅ Member Joined")
                    .setColor(GOOD_COLOR)
                    .setThumbnail(member.user.displayAvatarURL({ dynamic: true, size: 128 }))
                    .addFields(
                        { name: "Member", value: formatMember(member) },
                        { name: "Joined Server", value: `<t:${Math.floor(member.joinedTimestamp / 1000)}:F>` }
                    )
                    .setFooter({ text: member.user.tag })
                    .setTimestamp();
                welcomeMessage(member.guild, welcome);
            } catch (err) {
                console.error("guildMemberAdd logging error:", err);
            }
        });
    } catch (err) {
        console.error("doLogging initialization error:", err);
    }
}