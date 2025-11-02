import fs from "fs";
import { getTimeAgo } from "../functions/utilities.js";
import { PREFIX } from "../commands/main-commands.js";

const filePath = "afk/afk-users.json";

// ensure file exists
if (!fs.existsSync(filePath)) fs.writeFileSync(filePath, "{}");

// do afk stuff
export function doAfk(client) {
    client.on("messageCreate", async (message) => {
        try {
            if (message.author.bot) return;

            // arguments
            const args = message.content.trim().split(/\s+/);
            const command = args.shift()?.toLowerCase();

            // check mentions
            const mention = message.mentions.members.first();
            if (mention && isAfk(mention.user) && message.author !== mention.user) {
                const afkData = getAfk(mention.user);
                const timeAgo = getTimeAgo(afkData.since);
                await message.reply(
                    `💤 **${mention.displayName}** is currently AFK — **${afkData.reason}** (since **${timeAgo}** ago)`
                );
            }

            // remove afk
            if (isAfk(message.author)) {
                removeAfk(message.author);
                await message.reply("✅ Welcome back! Your AFK status has been removed");
            }

            // afk command
            if (command === `${PREFIX}afk`) {
                if (isAfk(message.author)) return;
                const reason = args.join(" ") || "No reason provided.";
                goAfk(message.author, reason);
                return message.reply(`💤 You are now marked as AFK: **${reason}**`);
            }

        } catch (err) {
            console.error("AFK system error:", err);
        }
    });
}

// set afk
export function goAfk(user, reason) {
    const data = JSON.parse(fs.readFileSync(filePath, "utf8"));
    data[user.id] = {
        since: Date.now(),
        reason: reason,
    };
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}

// check if afk
export function isAfk(user) {
    const data = JSON.parse(fs.readFileSync(filePath, "utf8"));
    return user.id in data;
}

// afk data
function getAfk(user) {
    const data = JSON.parse(fs.readFileSync(filePath, "utf8"));
    return data[user.id] || null;
}

// remove afk
function removeAfk(user) {
    const data = JSON.parse(fs.readFileSync(filePath, "utf8"));
    delete data[user.id];
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}
