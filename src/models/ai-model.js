// ai-model.js -> the main ai model
// Landon Lego
// Last updated 1/31/2026

// imports
require('dotenv').config();
const Groq = require('groq-sdk');

// client
const client = new Groq({
    apiKey: process.env.GROQ_API_KEY
});

async function getAIResponse(prompt, context = "none", model = "llama-3.3-70b-versatile") {
    // get ai response
    const aiResponse = await client.chat.completions.create({
        model: model,
        messages: [
            {
                role: "system",
                content: "You are a helpful discord bot. You like to chat and talk to users happily. You remember history with users. Keep response short and consise, do not go over 200 words." +
                "Context: " + context
            },
            {
                role: "user",
                content: prompt
            }
        ],
        temperature: 0.7
    });

    // return response
    const response = aiResponse.choices[0].message.content;
    return response;
}

// exports
module.exports = { getAIResponse };