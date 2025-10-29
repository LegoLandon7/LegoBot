import { Client, GatewayIntentBits, EmbedBuilder, PermissionsBitField } from "discord.js";
import dotenv from "dotenv";

dotenv.config();
const previousOverwrites = {};
//-----------------client----------------
const client = new Client({
	intents: [
		GatewayIntentBits.Guilds,
		GatewayIntentBits.GuildMessages,
		GatewayIntentBits.MessageContent,
		GatewayIntentBits.GuildMembers,
	],
});

client.on('error', (err) => {
    console.error('Client error event:', err);
});

const PREFIX = "$";

//-----------------utilities----------------

// convert duration strings
function parseDuration(duration) {
	const match = duration.match(/^(\d+)(s|m|h|d)$/);
	if (!match) return null;
	const amount = parseInt(match[1]);
	switch (match[2]) {
		case "s": return amount * 1000;
		case "m": return amount * 60 * 1000;
		case "h": return amount * 60 * 60 * 1000;
		case "d": return amount * 24 * 60 * 60 * 1000;
		default: return null;
	}
}

// fetch member
async function fetchMember(msg, input) {
    // default to author if no input
    if (!input) return msg.member;

    // 1. check mention
    const mention = msg.mentions.members.first();
    if (mention) return mention;

    // 2. check ID
    if (/^\d+$/.test(input)) {
        const memberById = await msg.guild.members.fetch(input).catch(() => null);
        if (memberById) return memberById;
    }

    // 3. search members by username or nickname
    const fetched = await msg.guild.members.fetch({ query: input, limit: 50 }).catch(() => null);
    if (!fetched || fetched.size === 0) return null;

    // 3a. exact username match
    const exactUsername = fetched.find(m => m.user.username.toLowerCase() === input.toLowerCase());
    if (exactUsername) return exactUsername;

    // 3b. exact nickname match
    const exactNickname = fetched.find(m => m.nickname?.toLowerCase() === input.toLowerCase());
    if (exactNickname) return exactNickname;

    // 3c. partial match 
    const partial = fetched.find(m => 
        m.user.username.toLowerCase().includes(input.toLowerCase()) || 
        m.nickname?.toLowerCase().includes(input.toLowerCase())
    );
    if (partial) return partial;

    // nothing found
    return null;
}

//-----------------ready----------------
client.once("clientReady", () => {
	console.log(`✅ Logged in as ${client.user.tag}`);
	client.user.setPresence({
		status: "online",
		activities: [{ name: "$help for commands", type: 0 }]
	});
});

//-----------------message handler----------------
client.on("messageCreate", async (msg) => {
	if (msg.author.bot) return;

	const args = msg.content.trim().split(/ +/);
	const command = args.shift().toLowerCase();

	//-----------------ping----------------
	if (command === `${PREFIX}ping`) {
		try {
			const embed = new EmbedBuilder()
				.setTitle("🏓 Ping Results 🏓")
				.setDescription("Calculating ping…")
				.setColor(0x00ff00)
				.setFooter({ text: "This is the best bot ever made!" })
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
		const embed = new EmbedBuilder()
			.setTitle("Help Menu")
			.setDescription("List of bot commands")
			.setColor(0x00ff00)
			.addFields(
				{ name: "prefix: ", value: PREFIX },
				{ name: "help", value: "Shows this menu of commands" },
				{ name: "info", value: "Shows info about the bot" },
				{ name: "ping", value: "Gets the ping of the bot" },
				{ name: "avatar [user]", value: "Shows user avatar" },
				{ name: "userinfo [user]", value: "Shows user info" },
				{ name: "serverinfo", value: "Shows server info" },
				{ name: "echo [channel] [text]", value: "Echos a message in channel" },
				{ name: "ban [user] [reason]", value: "Bans a user" },
				{ name: "kick [user] [reason]", value: "Kicks a user" },
				{ name: "timeout [user] [duration] [reason]", value: "Timeouts a user" },
				{ name: "untimeout [user]", value: "Removes timeout from a user" },
				{ name: "setnick [user] [nickname]", value: "Changes nickname" },
				{ name: "role [user] [role]", value: "Changes role of a user" },
				{ name: "purge [amount]", value: "purges messages" },
				{ name: "{WIP} lock", value: "locks or unlocks channel" },
				{ name: "{WIP} lockserver", value: "locks or unlocks server" }
			)
			.setFooter({ text: "This is the best bot ever made!" });

		msg.reply({ embeds: [embed] });
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

	//-----------------userinfo----------------
	if (command === `${PREFIX}userinfo`) {
		try {
			// get member info
			const member = await fetchMember(msg, args[0]?.trim() || null);
			if (!member) return msg.reply("❌ Could not find that user");

			// create embed
			const embed = new EmbedBuilder()
				.setTitle(`${member.user.username}#${member.user.discriminator}`)
				.setThumbnail(member.user.displayAvatarURL({ dynamic: true, size: 1024 }))
				.setColor(0x00ff00)
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
			.setFooter({ text: "This is the best bot ever made!" })
				.setTimestamp();

			// send embed
			msg.reply({ embeds: [embed] });
		} catch (err) {
			console.error("Userinfo error:", err);
			msg.reply("❌ Something went wrong while fetching user info.");
		}
	}

		//-----------------serverinfo----------------
	if (command === `${PREFIX}serverinfo`) {
		// get basic guild info
		const { guild } = msg;

		const embed = new EmbedBuilder()
			.setTitle(`${guild.name} Server Info`)
			.setThumbnail(guild.iconURL({ dynamic: true, size: 1024 }))
			.setColor(0x00ff00)
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
			.setFooter({ text: "This is the best bot ever made!" })
			.setTimestamp();

		await msg.reply({ embeds: [embed] });
	}

	//-----------------avatar----------------
	if (command === `${PREFIX}avatar`) {
		const member = await fetchMember(msg, args[0]?.trim() || null);
		if (!member) return msg.reply("❌ Could not find that user");

		const user = member.user;
		const embed = new EmbedBuilder()
			.setTitle(`${user.username}'s Avatar`)
			.setImage(user.displayAvatarURL({ dynamic: true, size: 1024 }))
			.setColor(0x00ff00)
			.setDescription(
				`[PNG](${user.displayAvatarURL({ format: "png", size: 1024 })}) | [JPG](${user.displayAvatarURL({ format: "jpg", size: 1024 })}) | [WEBP](${user.displayAvatarURL({ format: "webp", size: 1024 })})`
			)
			.setFooter({ text: "This is the best bot ever made!" })

		msg.reply({ embeds: [embed] });
	}

	//-----------------info----------------
	if (command === `${PREFIX}info`) {
		const embed = new EmbedBuilder()
			.setTitle("LegoBot Info")
			.setDescription("This is a bot made as a side-project using Node.js")
			.setColor(0x00ff00)
			.addFields(
				{ name: "Creator", value: "cc_landonlego", inline: true },
				{ name: "GitHub", value: "[github](https://github.com/LegoLandon7/LegoBot)", inline: true }
			)
			.setFooter({ text: "This is the best bot ever made!" })
			.setTimestamp();

		await msg.reply({ embeds: [embed] });
	}

	//-----------------ban----------------
	if (command === `${PREFIX}ban`) {
		// get member info
		const member = await fetchMember(msg, args[0]?.trim() || null);
		if (!member) return msg.reply("❌ Could not find that user");

		// check if they are bannable
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
		if (member.id === msg.author.id) return msg.reply(`❌ You cannot timeout yourself`);
		if (member.roles.highest.position >= msg.member.roles.highest.position) return msg.reply(`❌ You cannot timeout this member due to role hierarchy`);

		// check for permissions
		if (!msg.member.permissions.has(PermissionsBitField.Flags.ModerateMembers)) return msg.reply("❌ You don't have permission to timeout members");
		if (!msg.guild.members.me.permissions.has(PermissionsBitField.Flags.ModerateMembers)) return msg.reply("❌ I don't have permission to timeout members");

		// send dm then timeout
		let duration = parseDuration(args[1]); if (!duration) return msg.reply("❌ Invalid duration. Use formats like 10m, 2h, 1d");
		let reason = args.slice(2).join(" ") || "No reason provided";

		await member.send(`You have been timed out from **${msg.guild.name}** because:\n${reason}`).catch(() => {});
		await member.timeout(duration, reason);
		msg.reply(`✅ Timed out ${member.user.tag} | Reason: ${reason}`);
	}

	//-----------------untimeout----------------
	if (command === `${PREFIX}untimeout`) {
		// get member info
		const member = await fetchMember(msg, args[0]?.trim() || null);
		if (!member) return msg.reply("❌ Could not find that user");

		// check if they are able to be untimed out
		if (member.id === msg.author.id) return msg.reply(`❌ You cannot untimeout yourself`);
		if (member.roles.highest.position >= msg.member.roles.highest.position) return msg.reply(`❌ You cannot untimeout this member due to role hierarchy`);

		// check for permissions
		if (!msg.member.permissions.has(PermissionsBitField.Flags.ManageMembers)) return msg.reply("❌ You don't have permission to untimeout members");
		if (!msg.guild.members.me.permissions.has(PermissionsBitField.Flags.ManageMembers)) return msg.reply("❌ I don't have permission to untimeout members");

		// untimeout
		await member.send(`You have been untimed out from **${msg.guild.name}**`).catch(() => {});
		await member.timeout(null, "Timeout removed by moderator");
		msg.reply(`✅ Untimed out ${member.user.tag}`);
	}

	//-----------------setnick----------------
	if (command === `${PREFIX}setnick`) {
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
				return msg.reply("❌ You don't have permission to delete messages.");
			if (!msg.guild.members.me.permissions.has(PermissionsBitField.Flags.ManageMessages))
				return msg.reply("❌ I don't have permission to delete messages.");

			// get amount
			const amount = parseInt(args[0]);
			if (isNaN(amount) || amount < 1 || amount > 100)
				return msg.reply("❌ Please provide a number between **1** and **100**.");

			// delete messages
			await msg.channel.bulkDelete(amount, true).then(deleted => {
				msg.channel.send(`✅ Purged **${deleted.size}** messages.`)
				.then(m => setTimeout(() => m.delete().catch(() => {}), 5000)); // auto-delete reply after 5s
			}).catch(err => {
				console.error("Failed to purge:", err);
				msg.reply("❌ I couldn't delete messages. Make sure they aren't too old (14 days max).");
			});
		} catch (err) {
			console.error("Error in purge command:", err);
			msg.reply("❌ Something went wrong while trying to delete messages.");
		}
	}

	//-----------------lock----------------
	/*
	if (command === `${PREFIX}lock`) {
		// role info
    let role = msg.guild.roles.everyone;
    const roleMention = msg.mentions.roles.first();
    if (roleMention) role = roleMention;

    try {
			// permissions
        if (!msg.member.permissions.has(PermissionsBitField.Flags.ManageChannels))
            return msg.reply("❌ You don't have permission to manage channels.");
        if (!msg.guild.members.me.permissions.has(PermissionsBitField.Flags.ManageChannels))
            return msg.reply("❌ I don't have permission to manage channels.");

        const overwrite = msg.channel.permissionOverwrites.cache.get(role.id);
        const currentlyLocked = overwrite?.deny.has(PermissionsBitField.Flags.SendMessages) ?? false;

        // store previous overwrite
        if (!currentlyLocked) {
            previousChannelOverwrites[msg.channel.id] = previousChannelOverwrites[msg.channel.id] || {};
            previousChannelOverwrites[msg.channel.id][role.id] = overwrite
                ? { allow: overwrite.allow.bitfield, deny: overwrite.deny.bitfield }
                : null;
        }

        if (currentlyLocked) {
            // unlock
            const prev = previousChannelOverwrites[msg.channel.id]?.[role.id];
            await msg.channel.permissionOverwrites.edit(role, prev ? {
                allow: BigInt(prev.allow),
                deny: BigInt(prev.deny)
            } : {
                SendMessages: null,
                CreatePublicThreads: null,
                CreatePrivateThreads: null
            });

            if (previousChannelOverwrites[msg.channel.id]) delete previousChannelOverwrites[msg.channel.id][role.id];
        } else {
            // lock
            await msg.channel.permissionOverwrites.edit(role, {
                SendMessages: false,
                CreatePublicThreads: false,
                CreatePrivateThreads: false,
            });
        }

        msg.reply(`${currentlyLocked ? "🔓 Channel unlocked" : "🔒 Channel locked"} for ${role.name}.`);
    } catch (err) {
        console.error("Failed to toggle lock:", err);
        msg.reply("❌ Could not change channel permissions. Make sure my role is above the role and I have Manage Channels permission.");
    }
	}*/

	//-----------------lockserver----------------
	/*
	if (command === `${PREFIX}lockserver`) {
    // role info
    let role = msg.guild.roles.everyone;
    const roleMention = msg.mentions.roles.first();
    if (roleMention) role = roleMention;

    try {
        // permission checks
        if (!msg.member.permissions.has(PermissionsBitField.Flags.ManageChannels))
            return msg.reply("❌ You don't have permission to manage channels.");
        if (!msg.guild.members.me.permissions.has(PermissionsBitField.Flags.ManageChannels))
            return msg.reply("❌ I don't have permission to manage channels.");

        let lockedCount = 0;
        let unlockedCount = 0;

        // loop through each channel
        for (const channel of msg.guild.channels.cache.values()) {
            if (!channel.isTextBased()) continue;

            const overwrite = channel.permissionOverwrites.cache.get(role.id);
            // role currently can send messages? if undefined, default to allowed for everyone
            const canSend = overwrite?.allow.has(PermissionsBitField.Flags.SendMessages) ?? channel.permissionsFor(role)?.has(PermissionsBitField.Flags.SendMessages);

            if (canSend) {
                // role can send messages = lock it
                await channel.permissionOverwrites.edit(role, {
                    SendMessages: false,
                    CreatePublicThreads: false,
                    CreatePrivateThreads: false,
                });
                lockedCount++;
            } else if (overwrite?.deny.has(PermissionsBitField.Flags.SendMessages)) {
                // role was locked by bot = unlock it
                await channel.permissionOverwrites.edit(role, {
                    SendMessages: null,
                    CreatePublicThreads: null,
                    CreatePrivateThreads: null,
                });
                unlockedCount++;
            }
        }

        msg.reply(`🔒 Locked ${lockedCount} channels, 🔓 unlocked ${unlockedCount} channels for ${role.name}.`);
    } catch (err) {
        console.error("Failed to toggle server lock:", err);
        msg.reply("❌ Could not change channel permissions. Make sure my role is above the role and I have Manage Channels permission.");
    }
	}*/
});

//-----------------login----------------
client.login(process.env.TOKEN);