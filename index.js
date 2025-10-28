import { Client, GatewayIntentBits, EmbedBuilder, PermissionsBitField } from "discord.js";
import dotenv from "dotenv";

// load .env
dotenv.config();

// Create a new bot client
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds, 
    GatewayIntentBits.GuildMessages, 
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
  ],
});

const PREFIX = "$";

// get duration from letter
function parseDuration(duration) {
  const match = duration.match(/^(\d+)(s|m|h|d)$/);
  if (!match) return null;

  const amount = parseInt(match[1]);
  const unit = match[2];

  switch (unit) {
    case "s": return amount * 1000;
    case "m": return amount * 60 * 1000;
    case "h": return amount * 60 * 60 * 1000;
    case "d": return amount * 24 * 60 * 60 * 1000;
    default: return null;
  }
}

// fetch user by mention, ID, or username (can be outside server)
async function getUser(msg, input) {
  if (!input) return msg.author;

  // Mention
  const mention = msg.mentions.users.first();
  if (mention) return mention;

  // ID
  if (/^\d+$/.test(input)) {
    const user = await msg.client.users.fetch(input).catch(() => null);
    if (user) return user;
  }

  // Search from guild members
  const members = await msg.guild.members.fetch({ query: input, limit: 50 }).catch(() => null);
  if (members && members.size > 0) {
    const match = members.find(
      (m) => m.user.username.toLowerCase() === input.toLowerCase() || m.nickname?.toLowerCase() === input.toLowerCase()
    );
    if (match) return match.user;
  }

  return msg.author;
}

// fetch member by mention, ID, or username (guild only)
async function getMember(msg, input) {
  if (!input) return null;

  // 1. Mention
  const mention = msg.mentions.members.first();
  if (mention) return mention;

  // 2. ID
  if (/^\d+$/.test(input)) {
    const memberById = await msg.guild.members.fetch(input).catch(() => null);
    if (memberById) return memberById;
  }

  // 3. Fetch by username or nickname
  const fetched = await msg.guild.members.fetch({ query: input, limit: 50 }).catch(() => null);
  if (fetched && fetched.size > 0) {
    const exact = fetched.find(m => m.user.username.toLowerCase() === input.toLowerCase());
    if (exact) return exact;

    const nickExact = fetched.find(m => m.nickname?.toLowerCase() === input.toLowerCase());
    if (nickExact) return nickExact;

    return fetched.first();
  }

  return null;
}

// When the bot logs in successfully
client.once("clientReady", () => {
  console.log(`✅ Logged in as ${client.user.tag}`);
});

// Listen for messages
client.on("messageCreate", async (msg) => {
  // Ignore messages from bots
  if (msg.author.bot) return;

  const args = msg.content.trim().split(/ +/);
  const command = args.shift().toLowerCase();

  // ping command
  if (command === `${PREFIX}ping`) {
    const latency = Date.now() - msg.createdTimestamp;
    msg.reply(`Ping: **${latency}ms**`);
  }

  // help command
  if (command === `${PREFIX}help`) {
    const embed = new EmbedBuilder()
      .setTitle("Help Menu")
      .setDescription("List of bot commands")
      .setColor(0x00ff00) // green
      .addFields(
        { name: "prefix: ", value: PREFIX },
        { name: "help", value: "Shows this menu of commands" },
        { name: "info", value: "Shows info about the bot" },
        { name: "ping", value: "Gets the ping of the bot" },
        { name: "echo [channel] [message]", value: "Sends a message in a channel" },
        { name: "avatar [user]", value: "Gets the avatar of a user" },
        { name: "ban [user] [reason]", value: "Bans a user from the server" },
        { name: "unban [userID] [reason]", value: "Unbans a user from the server" },
        { name: "kick [user] [reason]", value: "Kicks a user from the server" },
        { name: "timeout [user] [time] [reason]", value: "Times out a user from the server" },
        { name: "untimeout [user] [time]", value: "Untimes out a user from the server" }
      )
      .setFooter({ text: "This is the best bot ever made!" });

    msg.reply({ embeds: [embed] });
  }

  // info command
  if (command === `${PREFIX}info`) {
    const embed = new EmbedBuilder()
      .setTitle("LegoBot info!")
      .setDescription("This is a bot made as a side-project using nodejs")
      .setColor(0x00ff00) // green
      .addFields(
        { name: "creator: ", value: "cc_landonlego" },
        { name: "github: ", value: "[github](https://github.com/LegoLandon7/LegoBot)" }
      )
      .setFooter({ text: "This is the best bot ever made!" });

    msg.reply({ embeds: [embed] });
  }

  // echo command
  if (command === `${PREFIX}echo`) {
    let targetChannel = msg.mentions.channels.first() || msg.channel;

    // check permissions
    if (!msg.member.permissions.has(PermissionsBitField.Flags.ManageMessages)) {
      return msg.reply("You need Manage Messages permission to use this command");
    }

    // trim the text
    const text = args.filter(arg => arg !== `<#${targetChannel.id}>`).join(" ");
    if (!text) return msg.reply("Please provide a message to send");

    // check bot permissions for target channel
    if (!targetChannel.permissionsFor(msg.guild.members.me).has(PermissionsBitField.Flags.SendMessages)) {
      return msg.reply("I cannot send messages in that channel");
    }

    try {
      await targetChannel.send(text);
      await msg.delete();
    } catch (err) {
      console.error(err);
      msg.reply("I couldn't send the message");
    }
  }

  // avatar command
  if (command === `${PREFIX}avatar`) {
    const user = await getUser(msg, args[0]);

    // avatar embeded
    const avatarEmbed = new EmbedBuilder()
      .setTitle(`${user.username}'s Avatar`)
      .setImage(user.displayAvatarURL({ dynamic: true, size: 1024 }))
      .setColor(0x00ff00)
      .setDescription(
        `[PNG](${user.displayAvatarURL({ format: "png", size: 1024 })}) | 
         [JPG](${user.displayAvatarURL({ format: "jpg", size: 1024,
        })}) | [WEBP](${user.displayAvatarURL({ format: "webp", size: 1024 })})`
      );

    msg.reply({ embeds: [avatarEmbed] });
  }

  // ban command
  if (command === `${PREFIX}ban`) {
    if (!msg.member.permissions.has(PermissionsBitField.Flags.BanMembers))
      return msg.reply("You don't have permission to ban members");
    if (!msg.guild.members.me.permissions.has(PermissionsBitField.Flags.BanMembers))
      return msg.reply("I don't have permission to ban members");

    const targetUser = await getUser(msg, args[0]);
    if (!targetUser) return msg.reply("Could not find that user");
    if (targetUser.id === msg.author.id) return msg.reply("You cannot ban yourself");

    const member = await msg.guild.members.fetch(targetUser.id).catch(() => null);
    if (member && member.roles.highest.position >= msg.member.roles.highest.position)
      return msg.reply("You cannot ban this member due to role hierarchy");

    const reason = args.slice(1).join(" ") || "No reason provided";

    try {
      await targetUser.send(`Hello! You have been banned from **${msg.guild.name}** because:\n**${reason}**`).catch(() => {});
      await msg.guild.bans.create(targetUser.id, { reason });
      msg.reply(`Banned ${targetUser.tag} | Reason: ${reason}`);
    } catch (err) {
      console.error(err);
      msg.reply("I couldn't ban this user");
    }
  }

  // unban command
  if (command === `${PREFIX}unban`) {
    if (!msg.member.permissions.has(PermissionsBitField.Flags.BanMembers))
      return msg.reply("You don't have permission to unban members");
    if (!msg.guild.members.me.permissions.has(PermissionsBitField.Flags.BanMembers))
      return msg.reply("I don't have permission to unban members");

    const input = args[0];
    if (!input) return msg.reply("Please provide the ID or username of the user to unban");

    const reason = args.slice(1).join(" ") || "No reason provided";

    try {
      const bans = await msg.guild.bans.fetch();
      let banInfo = bans.get(input) || bans.find(b => b.user.username.toLowerCase() === input.toLowerCase());
      if (!banInfo) return msg.reply("Could not find a banned user with that ID or username");

      await msg.guild.bans.remove(banInfo.user.id, reason);
      banInfo.user.send(`Hello! You have been unbanned from **${msg.guild.name}** because:\n**${reason}**`).catch(() => {});
      msg.reply(`Successfully unbanned ${banInfo.user.tag} | Reason: ${reason}`);
    } catch (err) {
      console.error(err);
      msg.reply("I couldn't unban this user. Make sure the ID or username is correct.");
    }
  }

  // kick command
  if (command === `${PREFIX}kick`) {
    if (!msg.member.permissions.has(PermissionsBitField.Flags.KickMembers))
      return msg.reply("You don't have permission to kick members");
    if (!msg.guild.members.me.permissions.has(PermissionsBitField.Flags.KickMembers))
      return msg.reply("I don't have permission to kick members");

    const targetUser = await getMember(msg, args[0]);
    if (!targetUser) return msg.reply("Could not find that user in this server");
    if (targetUser.id === msg.author.id) return msg.reply("You cannot kick yourself");
    if (targetUser.roles.highest.position >= msg.member.roles.highest.position)
      return msg.reply("You cannot kick this member due to role hierarchy");

    const reason = args.slice(1).join(" ") || "No reason provided";

    try {
      await targetUser.send(`Hello! You have been kicked from **${msg.guild.name}** because:\n**${reason}**`).catch(() => {});
      await targetUser.kick({ reason });
      msg.reply(`Kicked ${targetUser.user.tag} | Reason: ${reason}`);
    } catch (err) {
      console.error(err);
      msg.reply("I couldn't kick this user");
    }
  }

  // timeout command
  if (command === `${PREFIX}timeout`) {
    if (!msg.member.permissions.has(PermissionsBitField.Flags.ModerateMembers))
      return msg.reply("You don't have permission to timeout members");
    if (!msg.guild.members.me.permissions.has(PermissionsBitField.Flags.ModerateMembers))
      return msg.reply("I don't have permission to timeout members");

    const targetUser = await getMember(msg, args[0]);
    if (!targetUser) return msg.reply("Could not find that user in this server");
    if (targetUser.id === msg.author.id) return msg.reply("You cannot timeout yourself");
    if (targetUser.roles.highest.position >= msg.member.roles.highest.position)
      return msg.reply("You cannot timeout this member due to role hierarchy");

    const durationArg = args[1];
    if (!durationArg) return msg.reply("Please provide a duration (e.g., 10m, 2h, 1d)");

    const reason = args.slice(2).join(" ") || "No reason provided";
    const ms = parseDuration(durationArg);
    if (!ms) return msg.reply("Invalid duration. Use formats like 10m, 2h, 1d");

    try {
      await targetUser.timeout(ms, reason);
      await targetUser.send(`You have been timed out in **${msg.guild.name}** for ${durationArg} because:\n**${reason}**`).catch(() => {});
      msg.reply(`Timed out ${targetUser.user.tag} for ${durationArg} | Reason: ${reason}`);
    } catch (err) {
      console.error(err);
      msg.reply("I couldn't timeout this user");
    }
  }

  // untimeout command
  if (command === `${PREFIX}untimeout`) {
    if (!msg.member.permissions.has(PermissionsBitField.Flags.ModerateMembers))
      return msg.reply("You don't have permission to remove timeouts");
    if (!msg.guild.members.me.permissions.has(PermissionsBitField.Flags.ModerateMembers))
      return msg.reply("I don't have permission to remove timeouts");

    const targetUser = await getMember(msg, args[0]);
    if (!targetUser) return msg.reply("Could not find that user in this server");
    if (targetUser.roles.highest.position >= msg.member.roles.highest.position)
      return msg.reply("You cannot remove timeout for this member due to role hierarchy");

    try {
      await targetUser.timeout(null, "Timeout removed by moderator");
      await targetUser.send(`Your timeout has been removed in **${msg.guild.name}**`).catch(() => {});
      msg.reply(`Removed timeout for ${targetUser.user.tag}`);
    } catch (err) {
      console.error(err);
      msg.reply("I couldn't remove timeout for this user");
    }
  }
});

// Login
client.login(process.env.TOKEN);