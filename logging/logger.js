import { EmbedBuilder } from "discord.js";
import { getLogChannel, getWelcomeChannel} from "./save-log-channels.js";

const BAD_COLOR = "#ff0000"
const MEDIUM_COLOR = "#ffff00"
const GOOD_COLOR = "#00ff00"

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
                        { name: "User", value: `${newMember}`},
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
                            { name: "User", value: `<@${newMember}>`, inline: false },
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

        // user avatar update
        client.on("userUpdate", async (oldUser, newUser) => {
            // ignore
            if (oldUser.avatar === newUser.avatar) return;

            // mutual guilds
            for (const [guildId, guild] of client.guilds.cache) {
                const member = guild.members.cache.get(newUser.id);
                if (!member) continue; // not in this guild

                const embed = new EmbedBuilder()
                    .setTitle("🖼️ Avatar Updated")
                    .setColor(MEDIUM_COLOR)
                    .setDescription(`${newUser.tag} has updated their avatar`)
                    .setThumbnail(newUser.displayAvatarURL({ dynamic: true, size: 256}))
                    .addFields({name: "\u200B", value: `${newUser}`, inline: true})
                    .setFooter({ text: newUser.id })
                    .setTimestamp();

                // log
                logMessage(guild, embed);
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

            logMessage(member.guild, embed);
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

        // user join
        client.on("guildMemberAdd", member => {
            // log
            const log = new EmbedBuilder()
                .setTitle("✅ User Joined")
                .setColor(GOOD_COLOR)
                .setThumbnail(member.user.displayAvatarURL({ dynamic: true, size: 128 }))
                .addFields(
                    { name: "User", value: `${member}`},
                    { name: "Account Created", value: `<t:${Math.floor(member.user.createdTimestamp / 1000)}:F>`},
                    { name: "Joined Server", value: `<t:${Math.floor(member.joinedTimestamp / 1000)}:F>`},
                )
                .setFooter({ text: member.user.id })
                .setTimestamp();

            logMessage(member.guild, log);

            // welcome
            const welcome = new EmbedBuilder()
                .setTitle("✅ User Joined")
                .setColor(GOOD_COLOR)
                .setThumbnail(member.user.displayAvatarURL({ dynamic: true, size: 128 }))
                .addFields(
                    { name: "User", value: `${member}`},
                    { name: "Joined Server", value: `<t:${Math.floor(member.joinedTimestamp / 1000)}:F>`},
                )
                .setTimestamp();

            welcomeMessage(member.guild, welcome);
        });

        // user leave
        client.on("guildMemberRemove", member => {
            // log
            const log = new EmbedBuilder()
                .setTitle("❌ User Left")
                .setColor(BAD_COLOR)
                .setThumbnail(member.user.displayAvatarURL({ dynamic: true, size: 128 }))
                .addFields(
                    { name: "User", value: `${member}`},
                    { name: "Account Created", value: `<t:${Math.floor(member.user.createdTimestamp / 1000)}:F>`},
                    { name: "Joined Server", value: member.joinedTimestamp 
                        ? `<t:${Math.floor(member.joinedTimestamp / 1000)}:F>` 
                        : "Unknown"},
                )
                .setFooter({ text: member.user.id })
                .setTimestamp();

            logMessage(member.guild, log);

            // welcome
            const welcome = new EmbedBuilder()
                .setTitle("❌ User Left")
                .setColor(BAD_COLOR)
                .setThumbnail(member.user.displayAvatarURL({ dynamic: true, size: 128 }))
                .addFields(
                    { name: "User", value: `${member}`},
                    { name: "Joined Server", value: member.joinedTimestamp 
                        ? `<t:${Math.floor(member.joinedTimestamp / 1000)}:F>` 
                        : "Unknown"},
                )
                .setTimestamp();

            welcomeMessage(member.guild, welcome);
        });
    }catch(err){
        console.error(err);
    }
}