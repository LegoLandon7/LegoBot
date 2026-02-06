// view-history.js -> Views AI history (slash)
// Landon Lego
// Last updated 1/31/2026

// imports
const { getAIResponse } = require('../../../models/ai-model.js');
const { userHistory } = require('../../../handlers/ai-model-handler.js');

// subcommand data
function data(subcommand) {
    subcommand
        .setName('view-history')
        .setDescription('View the history you have with the AI chatbot');
}

// execute data
async function execute(interaction) {
    // data
    const userId = interaction.user.id;

    // history check
    if (!userHistory[userId] || !userHistory[userId].length)
        return interaction.reply({content: "❌ There is no history to view.", flags: 64});

    // map context
    const context = userHistory[userId].map(entry => `${entry.role}: ${entry.content}`).join('\n');

    interaction.reply({content: context || "none"});
}

// exports
module.exports = { data, execute };