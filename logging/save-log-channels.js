import fs from "fs";
const filePathLog = "./logging/log-channels.json";
const filePathWelcome = "./logging/welcome-channels.json";

// ensure file exists
if (!fs.existsSync(filePathLog)) fs.writeFileSync(filePathLog, "{}");
if (!fs.existsSync(filePathWelcome)) fs.writeFileSync(filePathWelcome, "{}");

function readData(filePath) {
  try {
    const content = fs.readFileSync(filePath, "utf8");
    return content ? JSON.parse(content) : {};
  } catch (err) {
    console.error("Error reading JSON, resetting file:", err);
    fs.writeFileSync(filePath, "{}");
    return {};
  }
}

// save a guild's log channel
export function setLogChannel(guildId, channelId) {
  const data = readData(filePathLog);
  if (channelId) data[guildId] = channelId;
  else delete data[guildId]; // remove if null
  fs.writeFileSync(filePathLog, JSON.stringify(data, null, 2));
}

// get a guild's log channel
export function getLogChannel(guildId) {
  const data = readData(filePathLog);
  return data[guildId] || null;
}

// save a guild's welcome channel
export function setWelcomeChannel(guildId, channelId) {
  const data = readData(filePathWelcome);
  if (channelId) data[guildId] = channelId;
  else delete data[guildId]; // remove if null
  fs.writeFileSync(filePathWelcome, JSON.stringify(data, null, 2));
}

// get a guild's welcome channel
export function getWelcomeChannel(guildId) {
  const data = readData(filePathWelcome);
  return data[guildId] || null;
}