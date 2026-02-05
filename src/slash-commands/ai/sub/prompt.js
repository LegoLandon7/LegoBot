// prompt.js -> AI chat subcommand
// Landon Lego
// Last updated 1/31/2026

// imports
const { getAIResponse } = require('../../../models/ai-model.js');
const { addUserHistory, userHistory, MAX_LENGTH } = require('../../../handlers/ai-model-handler.js');

// subcommand data
function data(subcommand) {
    subcommand
        .setName('prompt')
        .setDescription('Send a prompt to AI')
        .addStringOption(o =>
            o.setName('message')
                .setDescription('The prompt to ask')
                .setRequired(true))
        .addBooleanOption(o =>
            o.setName('show_prompt')
                .setDescription('Show prompt in response')
                .setRequired(false));
}

// execute data
async function execute(interaction) {
    await interaction.deferReply();

    // data
    const prompt = interaction.options.getString('message').slice(0, MAX_LENGTH);
    const userId = interaction.user.id;

    const showPrompt = interaction.options.getBoolean('show_prompt') || true;

    let response;

    // map context
    const context = userHistory[userId] && userHistory[userId].length
        ? userHistory[userId].map(entry => `${entry.role}: ${entry.content}`).join('\n')
        : "none";

    try {
        // get ai response
        response = await getAIResponse(prompt, context);
        if (showPrompt) response = `**Prompt:** ${prompt}\n\n**Response:** ${response}`;
        await interaction.editReply({content: response});
    } catch (error) {
        // no ai response
        console.error(error);
        throw error;
    }

    // add history
    addUserHistory(userId, { // user
        role: interaction.user.username,
        content: prompt.slice(0, MAX_LENGTH)
    });
    addUserHistory(userId, { // bot
        role: "bot",
        content: response.slice(0, MAX_LENGTH)
    });
}

// exports
module.exports = { data, execute };