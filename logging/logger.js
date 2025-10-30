import { EmbedBuilder } from "discord.js";
import { getLogChannel, getWelcomeChannel } from "./save-log-channels.js";

const BAD_COLOR = "#ff0000";
const MEDIUM_COLOR = "#ffff00";
const GOOD_COLOR = "#00ff00";

// logging
function sendToChannel(getFn, guild, content) {
    const id = getFn(guild.id);
    if (!id) return;
    const channel = guild.channels.cache.get(id);
    if (!channel) return;
    const payload = content instanceof EmbedBuilder ? { embeds: [content] } : content;
    channel.send(payload).catch(() => {});
}

function logMessage(guild, content) {
    sendToChannel(getLogChannel, guild, content);
}

function welcomeMessage(guild, content) {
    sendToChannel(getWelcomeChannel, guild, content);
}

// main
export function doLogging(client, args = null) {
    try {
        // delete message
        client.on("messageDelete", async (message) => {
            if (!message.guild || message.author?.bot) return;

            let msg = message;
            if (message.partial) {
                try {
                    msg = await message.fetch();
                } catch {
                    return;
                }
            }

            // embed builder
            const embed = new EmbedBuilder()
                .setTitle("🗑️ Message Deleted")
                .setColor(BAD_COLOR)
                .setThumbnail(msg.author.displayAvatarURL({ dynamic: true, size: 128 }))
                .addFields(
                    { name: "Member", value: `${msg.author}`},
                    { name: "Channel", value: `${msg.channel}`},
                    { name: "Content", value: msg.content || "[No Text]" }
                )
                .setFooter({ text: `${msg.author.tag} | ${msg.author.id}` })
                .setTimestamp();

            // log
            logMessage(msg.guild, embed);
        });

        // update message
        client.on("messageUpdate", async (oldMsg, newMsg) => {
            if (!newMsg.guild || newMsg.author?.bot) return;

            if (newMsg.partial) {
                try {
                    newMsg = await newMsg.fetch();
                } catch {
                    return;
                }
            }

            // embed builder
            const embed = new EmbedBuilder()
                .setTitle("✏️ Message Edited")
                .setColor(MEDIUM_COLOR)
                .setThumbnail(newMsg.author.displayAvatarURL({ dynamic: true, size: 128 }))
                .addFields(
                    { name: "Member", value: `${newMsg.author}` },
                    { name: "Channel", value: `${newMsg.channel}`},
                    { name: "Before", value: oldMsg.content || "[No Text]" },
                    { name: "After", value: newMsg.content || "[No Text]" }
                )
                .setFooter({ text: `${newMsg.author.tag} | ${newMsg.author.id}` })
                .setTimestamp();

            // log
            logMessage(newMsg.guild, embed);
        });

        // user changes
        client.on("guildMemberUpdate", (oldMember, member) => {
            // nickname change
            if (oldMember.nickname !== member.nickname) {
                const embed = new EmbedBuilder()
                    .setTitle("✏️ Nickname Changed")
                    .setColor(MEDIUM_COLOR)
                    .setThumbnail(member.user.displayAvatarURL({ dynamic: true, size: 128 }))
                    .addFields(
                        { name: "Member", value: `${member}` },
                        { name: "Old Nickname", value: `${oldMember.nickname || "[None]"}` },
                        { name: "New Nickname", value: `${member.nickname || "[None]"}` }
                    )
                    .setFooter({ text: `${member.user.tag} | ${member.user.id}` })
                    .setTimestamp();

                logMessage(member.guild, embed);
            }

            // role change
            if (oldMember.roles.cache.size !== member.roles.cache.size) {
                const added = member.roles.cache.filter(r => !oldMember.roles.cache.has(r.id));
                const removed = oldMember.roles.cache.filter(r => !member.roles.cache.has(r.id));

                if (added.size || removed.size) {
                    const embed = new EmbedBuilder()
                        .setTitle("⚙️ Roles Updated")
                        .setColor(MEDIUM_COLOR)
                        .setThumbnail(member.user.displayAvatarURL({ dynamic: true, size: 128 }))
                        .addFields(
                            { name: "Member", value: `${member}` },
                            { name: "Added Roles", value: added.size ? added.map(r => `<@&${r.id}>`).join(" ") : "[None]" },
                            { name: "Removed Roles", value: removed.size ? removed.map(r => `<@&${r.id}>`).join(" ") : "[None]" }
                        )
                        .setFooter({ text: `${member.user.tag} | ${member.user.id}` })
                        .setTimestamp();

                    logMessage(member.guild, embed);
                }
            }

            // user timeout
            const oldTimeout = oldMember.communicationDisabledUntilTimestamp;
            const newTimeout = member.communicationDisabledUntilTimestamp;

            if ((!oldTimeout || oldTimeout <= Date.now()) && newTimeout && newTimeout > Date.now()) {
                const embed = new EmbedBuilder()
                    .setTitle("⏳ Member Timed Out")
                    .setColor(BAD_COLOR)
                    .setThumbnail(member.user.displayAvatarURL({ dynamic: true, size: 128 }))
                    .addFields(
                        { name: "Member", value: `${member}` },
                        { name: "Until", value: `<t:${Math.floor(newTimeout / 1000)}:F>` }
                    )
                    .setFooter({ text: `${member.user.tag} | ${member.user.id}` })
                    .setTimestamp();

                logMessage(member.guild, embed);
            } else if (oldTimeout && oldTimeout > Date.now() && (!newTimeout || newTimeout <= Date.now())) {
                const embed = new EmbedBuilder()
                    .setTitle("✅ Timeout Removed")
                    .setColor(GOOD_COLOR)
                    .setThumbnail(member.user.displayAvatarURL({ dynamic: true, size: 128 }))
                    .addFields({ name: "Member", value: `${member}` })
                    .setFooter({ text: `${member.user.tag} | ${member.user.id}` })
                    .setTimestamp();

                logMessage(member.guild, embed);
            }
        });

        // user avatar update
        client.on("userUpdate", async (oldUser, newUser) => {
            if (oldUser.avatar === newUser.avatar) return;

            for (const [guildId, guild] of client.guilds.cache) {
                const member = guild.members.cache.get(newUser.id);
                if (!member) continue;

                const embed = new EmbedBuilder()
                    .setTitle("🖼️ Avatar Updated")
                    .setColor(MEDIUM_COLOR)
                    .setDescription(`${member} has updated their avatar`)
                    .setImage(member.displayAvatarURL({ dynamic: true, size: 512 }))
                    .setFooter({ text: `${member.user.tag} | ${member.user.id}` })
                    .setTimestamp();

                logMessage(guild, embed);
            }
        });

        // user ban
        client.on("guildBanAdd", async (ban) => {
            const { user, guild } = ban;

            const embed = new EmbedBuilder()
                .setTitle("🔨 Member Banned")
                .setColor(BAD_COLOR)
                .setThumbnail(user.displayAvatarURL({ dynamic: true, size: 128 }))
                .addFields(
                    { name: "Member", value: `${user}` },
                    { name: "Reason", value: ban.reason || "[No Reason Provided]" }
                )
                .setFooter({ text: `${user.tag} | ${user.id}` })
                .setTimestamp();

            logMessage(guild, embed);
        });

        // user unban
        client.on("guildBanRemove", async (ban) => {
            const { user, guild } = ban;

            const embed = new EmbedBuilder()
                .setTitle("✅ Member Unbanned")
                .setColor(GOOD_COLOR)
                .setThumbnail(user.displayAvatarURL({ dynamic: true, size: 128 }))
                .addFields({ name: "Member", value: `${user}` })
                .setFooter({ text: `${user.tag} | ${user.id}` })
                .setTimestamp();

            logMessage(guild, embed);
        });

        // user kick
        client.on("guildMemberRemove", async (member) => {
            const fetchedLogs = await member.guild.fetchAuditLogs({ limit: 1, type: 20 });
            const kickLog = fetchedLogs.entries.first();
            if (!kickLog) return;

            const { executor, target, reason } = kickLog;
            if (target.id !== member.id) return;

            const embed = new EmbedBuilder()
                .setTitle("👢 Member Kicked")
                .setColor(BAD_COLOR)
                .setThumbnail(member.user.displayAvatarURL({ dynamic: true, size: 128 }))
                .addFields(
                    { name: "Member", value: `${member}` },
                    { name: "Executor", value: executor ? executor.tag : "[Unknown]" },
                    { name: "Reason", value: reason || "[No Reason Provided]" }
                )
                .setFooter({ text: `${member.user.tag} | ${member.user.id}` })
                .setTimestamp();

            logMessage(member.guild, embed);
        });

        // user join
        client.on("guildMemberAdd", member => {
            const log = new EmbedBuilder()
                .setTitle("✅ Member Joined")
                .setColor(GOOD_COLOR)
                .setThumbnail(member.user.displayAvatarURL({ dynamic: true, size: 128 }))
                .addFields(
                    { name: "Member", value: `${member}` },
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
                    { name: "Member", value: `${member}` },
                    { name: "Joined Server", value: `<t:${Math.floor(member.joinedTimestamp / 1000)}:F>` }
                )
                .setFooter({ text: member.user.tag })
                .setTimestamp();

            welcomeMessage(member.guild, welcome);
        });

        // user leave
        client.on("guildMemberRemove", member => {
            const log = new EmbedBuilder()
                .setTitle("❌ Member Left")
                .setColor(BAD_COLOR)
                .setThumbnail(member.user.displayAvatarURL({ dynamic: true, size: 128 }))
                .addFields(
                    { name: "Member", value: `${member}`},
                    { name: "Account Created", value: `<t:${Math.floor(member.user.createdTimestamp / 1000)}:F>` },
                    { name: "Joined Server", value: member.joinedTimestamp ? `<t:${Math.floor(member.joinedTimestamp / 1000)}:F>` : "Unknown" }
                )
                .setFooter({ text: `${member.user.tag} | ${member.user.id}` })
                .setTimestamp();

            logMessage(member.guild, log);

            const welcome = new EmbedBuilder()
                .setTitle("❌ Member Left")
                .setColor(BAD_COLOR)
                .setThumbnail(member.user.displayAvatarURL({ dynamic: true, size: 128 }))
                .addFields(
                    { name: "Member", value: `${member}`},
                    { name: "Joined Server", value: member.joinedTimestamp ? `<t:${Math.floor(member.joinedTimestamp / 1000)}:F>` : "Unknown" }
                )
                .setFooter({text: member.user.tag})
                .setTimestamp();

            welcomeMessage(member.guild, welcome);
        });
    } catch (err) {
        console.error(err);
    }
}