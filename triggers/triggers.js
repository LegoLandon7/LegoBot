import { getTriggers, addTrigger } from "./save-trigger.js";
import { PREFIX } from "../commands/main-commands.js";
import { PermissionsBitField } from "discord.js";

// triggers
export function doTriggers(client) {
    try {
        client.on("messageCreate", async (message) => {
            // arguments
            const args = message.content.split(" ");
            const command = args.shift()?.toLowerCase();

            //-----------------add-trigger----------------
            if (command === `${PREFIX}add-trigger`) {
                try {
                    // permissions
                    if (!message.member.permissions.has(PermissionsBitField.Flags.ManageGuild))
                        return message.reply("❌ You don't have permissions to manage guild").catch(() => {});

                    // join args into one string
                    const input = args.join(" ");
                    if (!input.includes("|"))
                        return message.reply("❌ Invalid format make sure you use the '|' delimeter").catch(() => {});

                    // split into trigger + response
                    const [trigger, response] = input.split("|").map(s => s.trim());

                    if (!trigger || !response)
                        return message.reply("❌ You must include both a trigger and a response.").catch(() => {});

                    // save trigger
                    addTrigger(message.guild.id, trigger, response);

                    message.reply(`✅ Trigger added!\n**Trigger:** ${trigger}\n**Response:** ${response}`).catch(() => {});
                } catch (err) {
                    console.error("Add-trigger command error:", err);
                    message.reply("❌ Something went wrong while adding a trigger").catch(() => {});
                }
            }

            //-----------------remove-trigger----------------
            if (command === `${PREFIX}remove-trigger`) {
                try {
                    // permissions
                    if (!message.member.permissions.has(PermissionsBitField.Flags.ManageGuild))
                        return message.reply("❌ You don't have permissions to manage guild").catch(() => {});

                    // get trigger
                    const trigger = args.join(" ").trim();
                    if (!trigger) return message.reply("❌ Please specify which trigger to remove. Example: `$remove-trigger hello there`").catch(() => {});

                    const success = removeTrigger(message.guild.id, trigger);

                    if (success)
                        message.reply(`✅ Removed trigger: **${trigger}**`).catch(() => {});
                    else
                        message.reply(`❌ No trigger found with the name: **${trigger}**`).catch(() => {});
                } catch (err) {
                    console.error("Remove-trigger command error:", err);
                    message.reply("❌ Something went wrong while removing the trigger").catch(() => {});
                }
            }
            
            //-----------------list-triggers----------------
            if (command === `${PREFIX}list-triggers`) {
                try {
                    // permissions
                    if (!message.member.permissions.has(PermissionsBitField.Flags.ManageGuild))
                        return message.reply("❌ You don't have permissions to manage guild").catch(() => {});

                    const triggers = getTriggers(message.guild.id);
                    const entries = Object.entries(triggers);

                    if (!entries.length) return message.reply("ℹ️ There are no triggers set for this server").catch(() => {});

                    // create list
                    const triggerList = entries
                        .map(([trigger, response]) => `**${trigger}** -> ${response}`)
                        .join("\n");

                    // message
                    message.reply({
                        content: `📘 **Current Triggers:**\n${triggerList}`,
                    }).catch(() => {});
                } catch (err) {
                    console.error("Get-trigger command error:", err);
                    message.reply("❌ Something went wrong while getting the triggers").catch(() => {});
                }
            }

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