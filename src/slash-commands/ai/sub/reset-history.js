// reset-history.js -> Resets AI history 
// Landon Lego
// Last updated 1/31/2026

// imports
const { getAIResponse } = require('../../../models/ai-model.js');
const { resetUserHistory, userHistory } = require('../../../handlers/ai-model-handler.js');

// subcommand data
function data(subcommand) {
    subcommand
        .setName('reset-history')
        .setDescription('Reset your history with the AI')
}

// execute data
async function execute(interaction) {
    // data
    const userId = interaction.user.id;

    // history check
    if (!userHistory[userId] || !userHistory[userId].length)
        return interaction.reply({content: "❌ There is no history to remove.", flags: 64});

    try {
        // reset history
        resetUserHistory(userId);
        await interaction.reply({content: "✅ Successfully removed history."});
    } catch (error) {
        console.error(`[ERROR] [AI] - ${error}`);
        return interaction.reply({content: "❌ Unable to reset history."});
    }
}

// exports
module.exports = { data, execute };