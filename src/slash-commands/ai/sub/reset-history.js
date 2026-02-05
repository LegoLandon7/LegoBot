// reset.js -> reset user history for the ai model
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

    // check if history exists
    if (!userHistory[userId] || !userHistory[userId].length)
        return interaction.reply({content: "⚠️ There is no history to remove.", flags: 64}); // ephermeral

    try {
        // reset history
        resetUserHistory(userId);
        await interaction.reply({content: "✅ Succesfully removed history."});
    } catch (error) {
        // error
        console.error(error);
        throw error;
    }
}

// exports
module.exports = { data, execute };