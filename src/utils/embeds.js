// embeds.js -> Embed builder utility
// Landon Lego
// Last updated 2/6/2026

// imports
const { EmbedBuilder } = require('discord.js');

// data
const COLORS = {
    SUCCESS: '#43b581',
    ERROR: '#f04747',
    WARNING: '#ffdd00',
    INFO: '#616df0'
};

// main embed builder
function buildEmbed(title = null, description = null, color = COLORS.INFO, user = null) {
    const embed = new EmbedBuilder().setColor(color).setTimestamp();
    if (title) embed.setTitle(title);
    if (description) embed.setDescription(description);
    if (user) embed.setFooter({ text: user.username, iconURL: user.displayAvatarURL() });
    return embed;
}

// exports
module.exports = { buildEmbed, COLORS };