import { getLogChannel, getWelcomeChannel} from "./save-log-channels.js";
import { EmbedBuilder } from "discord.js";

export function sendToChannel(getFn, guild, content) {
    try {
        const id = getFn(guild.id);
        if (!id) return;
        const channel = guild.channels.cache.get(id);
        if (!channel) return;
        const payload = content instanceof EmbedBuilder ? { embeds: [content] } : content;
        channel.send(payload).catch(() => {});
    } catch (err) {
        console.error("sendToChannel error:", err);
    }
}

export function logMessage(guild, content) { sendToChannel(getLogChannel, guild, content); }
export function welcomeMessage(guild, content) { sendToChannel(getWelcomeChannel, guild, content); }
export function formatMember(member) { return member ? `<@${member.id}>` : "Unknown"; }