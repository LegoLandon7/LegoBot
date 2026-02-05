# LegoBot

---

**LegoBot** is a powerful Discord bot designed for server management and fun interactions. It is part of the **LlegoNetwork** project.  

Join our **Discord server**: [https://discord.gg/ghHCxWxDMG](https://discord.gg/ghHCxWxDMG)  
Official website: [https://llegonetwork.dev/projects/lego-bot](https://llegonetwork.dev/projects/lego-bot)  

---

## Features

- Fully functional Discord bot powered by **discord.js v14**
- SQLite database support with **better-sqlite3**
- GROQ SDK integration for database queries
- Easy to deploy and run

---

## Prerequisites

Before you start, make sure you have:

- [Node.js](https://nodejs.org/) v18 or higher installed
- A Discord bot token and client ID
- A **GROQ_API_KEY** if you plan to use the GROQ features
- Git installed if you plan to clone the repository

---

## Installation / Cloning

### 1. Clone the repository

```bash
git clone https://github.com/llegonetwork/lego-bot.git
cd lego-bot
```

### 2. Install dependencies

`npm install discord.js better-sqlite3 dotenv groq-sdk`

### 3. Create a .env file

# Create a file named .env in the root directory with the following variables:

```env
BOT_TOKEN=your_discord_bot_token_here
CLIENT_ID=your_discord_client_id_here
GROQ_API_KEY=your_groq_api_key_here
Note: Replace the placeholders with your actual tokens and keys.
```

---

## Initialization

Before running the bot, you need to set up the databases and deploy commands:

### 1. Initialize databases

`npm run init-databases`

### 2. Deploy commands to Discord

`npm run deploy`

> This ensures that all slash commands are registered properly.

---

## Useful Commands

Here are the main commands for working with LegoBot:

### Start the bot

`npm run start`

### or

`npm run dev`

### Deploy commands and start the bot in one step

`npm run dstart`

### Initialize databases

`npm run init-databases`

### View database contents

`npm run view-databases`

> Tip: Always run init-databases and deploy first before starting the bot for the first time.

---

## Additional Notes

Make sure your bot has the necessary permissions in your Discord server to respond to commands.

Join our [Discord server](https://discord.gg/ghHCxWxDMG) for support and updates.

Check out our [website](https://llegonetwork.dev/projects/lego-bot) for more projects and guides
