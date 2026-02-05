// view-history.js -> view history for user
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

    // check if history exists
    if (!userHistory[userId] || !userHistory[userId].length)
        return interaction.reply({content: "⚠️ There is no history to view.", flags: 64}); // ephermeral

    // map context
    const context = userHistory[userId].map(entry => `${entry.role}: ${entry.content}`).join('\n');

    interaction.reply({content: context || "none"});
}

// exports
module.exports = { data, execute };