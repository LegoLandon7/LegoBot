import { getLogChannel, getWelcomeChannel } from "./save-log-channels.js";
import { EmbedBuilder } from "discord.js";

// send content to a channel
export async function sendToChannel(getFn, guild, content) {
    try {
        const id = getFn(guild.id);
        if (!id) return;
        const channel = guild.channels.cache.get(id);
        if (!channel) return;

        // prepare payload
        let payload;
        if (content instanceof EmbedBuilder) {payload = { embeds: [content] };
        } else if (typeof content === "string") {payload = { content };
        } else {payload = content;}

        // send message
        await channel.send(payload).catch(() => {});
    } catch (err) {
        console.error("sendToChannel error:", err);
    }
}

// log message
export function logMessage(guild, content) { 
    sendToChannel(getLogChannel, guild, content); 
}

// send welcome message
export function welcomeMessage(guild, content) { 
    sendToChannel(getWelcomeChannel, guild, content); 
}

// format a member mention
export function formatMember(member) { 
    return member ? `<@${member.id}>` : "Unknown"; 
}