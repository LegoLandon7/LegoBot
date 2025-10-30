import { EmbedBuilder } from "discord.js";
import { getTriggers, addTrigger, removeTrigger } from "./save-trigger.js";
import { PREFIX } from "../commands/commands.js";

export function doTriggers(client, args = null) {
    try {
        client.on("messageCreate", async (message) => {
            // ignore
            if (!message.guild || message.author.bot) return;
            if (message.content.startsWith(PREFIX)) return;

            // get all triggers for this guild
            const triggers = getTriggers(message.guild.id);
            if (!triggers || Object.keys(triggers).length === 0) return;

            // loop through triggers and check for match
            for (const [trigger, response] of Object.entries(triggers)) {
                // match entire word or phrase (case-insensitive)
                const regex = new RegExp(`\\b${trigger}\\b`, "i");

                if (regex.test(message.content)) {
                    // send response
                    await message.channel.send(response).catch(() => {});
                    break; // stop after first match
                }
            }
        });
    } catch (err) {
        console.error("Trigger handler error:", err);
    }
}