// ai-model-handler.js -> handles AI commands
// Landon Lego
// Last updated 1/31/2026

// intialize
let userHistory = {};

const MAX_LENGTH = 250;
const HISTORY_LIMIT = 10;

// add history
function addUserHistory(userId, history) {
    // initialize user history
    if (!userHistory[userId]) userHistory[userId] = [];

    // push history
    // format: 
    //      role: (username) | (bot)
    //      content: (string)
    userHistory[userId].push(history);

    // history limit
    if (userHistory[userId].length === HISTORY_LIMIT) {
        userHistory[userId].shift();
    }
}

// reset history
function resetUserHistory(userId) {
    if (userHistory[userId]) delete userHistory[userId];
}

// exports
module.exports = { addUserHistory, resetUserHistory, userHistory, MAX_LENGTH };