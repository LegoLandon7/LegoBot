import { Client, GatewayIntentBits, EmbedBuilder } from "discord.js";
import dotenv from "dotenv";

// load .env
dotenv.config();

// Create a new bot client
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds, 
    GatewayIntentBits.GuildMessages, 
    GatewayIntentBits.MessageContent
  ],
});

const PREFIX = "$";

// When the bot logs in successfully
client.once("clientReady", () => {
  console.log(`✅ Logged in as ${client.user.tag}`);
});

// Listen for messages
client.on("messageCreate", async (msg) => {
  // Ignore messages from bots
  if (msg.author.bot) return;

  // ping command
  if (msg.content === `${PREFIX}ping`) {
    const latency = Date.now() - msg.createdTimestamp;
    msg.reply(`Ping: **${latency}ms**`);
  }

  // help command
  if (msg.content === `${PREFIX}help`) {
    const embed = new EmbedBuilder()
      .setTitle("Help Menu")
      .setDescription("List of bot commands")
      .setColor(0x00ff00) // green
      .addFields(
        { name: "prefix: ", value: PREFIX },
        { name: "help: ", value: "shows a menu of commands" },
        { name: "info: ", value: "shows info about the bot" },
        { name: "ping: ", value: "gets the ping of the bot" },
        { name: "echo [channel] [value]: ", value: "sends a message in a channel"}
      )
      .setFooter({ text: "This is the best bot ever made!" });

    msg.reply({ embeds: [embed] });
  }

  // info command
  if (msg.content === `${PREFIX}info`) {
    const embed = new EmbedBuilder()
      .setTitle("LegoBot info!")
      .setDescription("This is a bot made as a side-project using nodejs")
      .setColor(0x00ff00) // green
      .addFields(
        { name: "creator: ", value: "cc_landonlego"},
        { name: "github: ", value: "[github](https://github.com/LegoLandon7/LegoBot)"}
      )
      .setFooter({ text: "This is the best bot ever made!" });

    msg.reply({ embeds: [embed] });
  }

  // echo command
  if (msg.content.startsWith(`${PREFIX}echo`)) {
    let targetChannel = msg.mentions.channels.first();
    if (!targetChannel) targetChannel = msg.channel;

    const text = msg.content
      .replace(`${PREFIX}echo`, "")     // Remove command
      .replace(`<#${targetChannel.id}>`, "") // Remove channel mention
      .trim(); // trims
    
    if(!text) return msg.reply("Please provide a message to send");

    try {
      await targetChannel.send(text); // Send message to the mentioned channel
      await msg.delete(); // Delete the original command
    } catch (err) {
      console.error(err);
      msg.reply("I couldn't send the message");
    }
  }
});

// Login
client.login(process.env.TOKEN);