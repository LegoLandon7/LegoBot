import { EmbedBuilder } from "discord.js";
import { getLogChannel } from "./save-log-channels.js";

const BAD_COLOR = "#ff0000"
const MEDIUM_COLOR = "#ffff00"
const GOOD_COLOR = "#00ff00"

function logMessage(guild, content) {
    const channelId = getLogChannel(guild.id);
    if (!channelId) return; // no log channel set

    const channel = guild.channels.cache.get(channelId);
    if (!channel) return; // channel not found

    // log
    if (content instanceof EmbedBuilder) { // embed
        channel.send({ embeds: [content] }).catch(() => {});
    } else { // plain text
        channel.send(content).catch(() => {});
    }
}

export function doLogging(client, args = null) {
    // delete message
    client.on("messageDelete", async (message) => {
        if (!message.guild || message.author?.bot) return;

        let msg = message;
        if (message.partial) {try {
            msg = await message.fetch();
        } catch { return; }
        }

        // embed builder
        const embed = new EmbedBuilder()
            .setTitle("🗑️ Message Deleted")
            .setColor(BAD_COLOR)
            .setThumbnail(msg.author.displayAvatarURL({ dynamic: true, size: 128 }))
            .addFields(
                { name: "User", value: `${msg.author}`, inline: true },
                { name: "Channel", value: `${msg.channel}`, inline: true },
                { name: "Content", value: msg.content || "[No Text]" }
            )
            .setFooter({ text: msg.author.id })
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
            } catch { return; }
        }

        // embed builder
        const embed = new EmbedBuilder()
            .setTitle("✏️ Message Edited")
            .setColor(MEDIUM_COLOR)
            .setThumbnail(newMsg.author.displayAvatarURL({ dynamic: true, size: 128 }))
            .addFields(
                { name: "User", value: `${newMsg.author}`, inline: true },
                { name: "Channel", value: `${newMsg.channel}`, inline: true },
                { name: "Before", value: oldMsg.content || "[No Text]" },
                { name: "After", value: newMsg.content || "[No Text]" }
            )
            .setFooter({ text: newMsg.author.id })
            .setTimestamp();

        // log
        logMessage(newMsg.guild, embed);
    });

    // user changes
    client.on("guildMemberUpdate", (oldMember, newMember) => {
        // nickname change
        if (oldMember.nickname !== newMember.nickname) {
            const embed = new EmbedBuilder()
                .setTitle("✏️ Nickname Changed")
                .setColor(MEDIUM_COLOR)
                .setThumbnail(newMember.user.displayAvatarURL({ dynamic: true, size: 128 }))
                .addFields(
                    { name: "User", value: newMember.user.tag},
                    { name: "Old Nickname", value: `${oldMember.nickname}` || "[None]"},
                    { name: "New Nickname", value: `${newMember.nickname}` || "[None]"} 
                )
                .setFooter({ text: newMember.user.id })
                .setTimestamp();

            logMessage(newMember.guild, embed);
        }

        // role change
        if (oldMember.roles.cache.size !== newMember.roles.cache.size) {
            // find roles
            const added = newMember.roles.cache.filter(r => !oldMember.roles.cache.has(r.id));
            const removed = oldMember.roles.cache.filter(r => !newMember.roles.cache.has(r.id));

            // embed
            if (added.size || removed.size) {
                const embed = new EmbedBuilder()
                    .setTitle("⚙️ Roles Updated")
                    .setColor(MEDIUM_COLOR)
                    .setThumbnail(newMember.user.displayAvatarURL({ dynamic: true, size: 128 }))
                    .addFields(
                        { name: "User", value: `<@${newMember.id}>`, inline: false }, // mention user
                        { name: "Added Roles", value: added.size ? added.map(r => `<@&${r.id}>`).join(" ") : "[None]", inline: false }, // mention roles
                        { name: "Removed Roles", value: removed.size ? removed.map(r => `<@&${r.id}>`).join(" ") : "[None]", inline: false } // mention roles
                    )
                    .setFooter({ text: newMember.user.id })
                    .setTimestamp();

                // log
                logMessage(newMember.guild, embed);
            }
        }
    });

    // user ban
    client.on("guildBanAdd", async (ban) => {
        const { user, guild } = ban;

        // embed
        const embed = new EmbedBuilder()
            .setTitle("🔨 User Banned")
            .setColor(BAD_COLOR)
            .setThumbnail(user.displayAvatarURL({ dynamic: true, size: 128 }))
            .addFields(
                { name: "User", value: `${user.tag} (${user.id})`, inline: false },
                { name: "Reason", value: ban.reason || "[No Reason Provided]" }
            )
            .setFooter({text: user.id})
            .setTimestamp();

        logMessage(guild, embed);
    });

    // user unban
    client.on("guildBanRemove", async (ban) => {
        const { user, guild } = ban;

        // embed
        const embed = new EmbedBuilder()
            .setTitle("✅ User Unbanned")
            .setColor(GOOD_COLOR)
            .setThumbnail(user.displayAvatarURL({ dynamic: true, size: 128 }))
            .addFields(
                { name: "User", value: `${user.tag} (${user.id})`, inline: false },
            )
            .setFooter({text: user.id})
            .setTimestamp();

        logMessage(guild, embed);
    });

    // user kick
    client.on("guildMemberRemove", async (member) => {
        // get kick event
        const fetchedLogs = await member.guild.fetchAuditLogs({ limit: 1, type: 20 }); // MEMBER_KICK
        const kickLog = fetchedLogs.entries.first();
        if (!kickLog) return;

        const { executor, target, reason } = kickLog;
        if (target.id !== member.id) return;

        // embed
        const embed = new EmbedBuilder()
            .setTitle("👢 User Kicked")
            .setColor(BAD_COLOR)
            .setThumbnail(member.user.displayAvatarURL({ dynamic: true, size: 128 }))
            .addFields(
                { name: "User", value: `${member.user.tag} (${member.id})`, inline: false },
                { name: "Executor", value: executor ? executor.tag : "[Unknown]", inline: false },
                { name: "Reason", value: reason || "[No Reason Provided]" }
            )
            .setFooter({text: member.user.id})
            .setTimestamp();

        logMessage(guild, embed);
    });

    // user timeout
    client.on("guildMemberUpdate", (oldMember, newMember) => {
        const oldTimeout = oldMember.communicationDisabledUntilTimestamp;
        const newTimeout = newMember.communicationDisabledUntilTimestamp;

        // timed out
        if ((!oldTimeout || oldTimeout <= Date.now()) && newTimeout && newTimeout > Date.now()) {
            const embed = new EmbedBuilder()
                .setTitle("⏳ User Timed Out")
                .setColor(BAD_COLOR)
                .setThumbnail(newMember.user.displayAvatarURL({ dynamic: true, size: 128 }))
                .addFields(
                    { name: "User", value: `${newMember}`, inline: false },
                    { name: "Until", value: `<t:${Math.floor(newTimeout / 1000)}:F>` },
                )
                .setFooter({text: newMember.user.id})
                .setTimestamp();

            logMessage(newMember.guild, embed);
        } 
        // timeout removed
        else if (oldTimeout && oldTimeout > Date.now() && (!newTimeout || newTimeout <= Date.now())) {
            const embed = new EmbedBuilder()
                .setTitle("✅ Timeout Removed")
                .setColor(GOOD_COLOR)
                .setThumbnail(newMember.user.displayAvatarURL({ dynamic: true, size: 128 }))
                .addFields(
                    { name: "User", value: `${newMember}`, inline: false }
                )
                .setFooter({text: newMember.user.id})
                .setTimestamp();

            logMessage(newMember.guild, embed);
        }
    });
}