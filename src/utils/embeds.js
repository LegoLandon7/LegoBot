// embeds.js -> makes embeds easier
// Landon Lego
// Last updated 2/5/2026

// imports
const { EmbedBuilder } = require('discord.js');

// data
const COLORS = {
    GOOD: "#43b581",
    BAD: "#f04747",
    NORMAL: "#ffdd00",
    NEUTRAL: "#747f8d",
    INFO: "#616df0",
};

// main embed builder
function buildEmbed(title, description, color = COLORS.NEUTRAL, user = null) {
    // embed
    const embed = new EmbedBuilder()
        .setTitle(title)
        .setDescription(description)
        .setColor(color)
        .setTimestamp()

        if (user) embed.setFooter({text: user.username, iconURL: user.displayAvatarURL()})

    return embed;
}

// exports
module.exports = { buildEmbed, COLORS };