import { getTriggers } from "../functions/save-trigger.js";
import { PREFIX } from "../commands/commands.js";

// triggers
export function doTriggers(client, args = null) {
    try {
        client.on("messageCreate", async (message) => {
            // ignore bot messages and commands
            if (!message.guild || message.author.bot) return;
            if (message.content.startsWith(PREFIX)) return;

            // get all triggers for this guild
            const triggers = getTriggers(message.guild.id);
            if (!triggers || Object.keys(triggers).length === 0) return;

            const content = message.content.toLowerCase();

            // loop through triggers
            for (const [trigger, response] of Object.entries(triggers)) {
                const lowerTrigger = trigger.toLowerCase();

                // match anywhere in the message (case-insensitive)
                if (content.includes(lowerTrigger)) {
                    await message.channel.send(response).catch(() => {});
                    break; // stop after first match
                }
            }
        });
    } catch (err) {
        console.error("Trigger handler error:", err);
    }
}